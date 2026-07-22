import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  getFirestore, collection, doc,
  getDoc, setDoc, getDocs, query, limit, serverTimestamp, deleteDoc,
  where, orderBy,
} from '@react-native-firebase/firestore';
import { gerarPerguntasGemini } from './geminiService';
import { textoTim } from './textoTim';
import { perguntasFallback } from '../dados/perguntasFallback';

const db = getFirestore();
const COLECAO = 'quizPerguntasIA';
const PERGUNTAS_POR_NIVEL = 2;
const NIVEIS = ['facil', 'medio', 'dificil'];
const HISTORICO_DIAS = 30;
const TENTATIVAS = 2;
const BANCO_VAZIO = { facil: [], medio: [], dificil: [] };
const MS_DIA = 24 * 60 * 60 * 1000;

const dataLocalISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const normalizarTexto = (t = '') =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
   .replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');

const assinatura = (p) => normalizarTexto(typeof p === 'string' ? p : p?.pergunta ?? '');

const tokens = (sig) => sig.split(' ').filter(t => t.length > 2);

const similaridade = (a, b) => {
  const ta = new Set(tokens(a)), tb = new Set(tokens(b));
  if (!ta.size || !tb.size) return 0;
  const inter = [...ta].filter(t => tb.has(t)).length;
  return inter / new Set([...ta,...tb]).size;
};

const pareceRepetida = (sig, bloqueadas) => {
  if (bloqueadas.has(sig)) return true;
  return [...bloqueadas].some(b => similaridade(sig, b) >= 0.75);
};

const perguntaValida = (p) => {
  if (!p?.pergunta || !NIVEIS.includes(p?.dificuldade)) return false;
  if (p.tipo === 'verdadeiro_falso') return typeof p.resposta === 'boolean';
  const comOpcoes = ['multipla','complete_letra','qual_nao_pertence','de_qual_musica','cronologia'];
  if (comOpcoes.includes(p.tipo)) {
    return Array.isArray(p.opcoes) && p.opcoes.length === 4 &&
           Number.isInteger(p.resposta) && p.resposta >= 0 && p.resposta < 4;
  }
  return false;
};

const filtrar = (perguntas = [], bloqueadas = new Set()) => {
  const vistas = new Set(bloqueadas);
  const result = [];
  perguntas.forEach((p, i) => {
    if (!perguntaValida(p)) return;
    const sig = assinatura(p);
    if (!sig || pareceRepetida(sig, vistas)) return;
    vistas.add(sig);
    const hashStr = (s) => {
      let h = 0;
      for (let j = 0; j < s.length; j++) h = (Math.imul(h,31) + s.charCodeAt(j)) % 2147483647;
      return Math.abs(h);
    };
    result.push({ ...p, id: p.id || `${p.dificuldade}-${hashStr(`${sig}-${i}`)}` });
  });
  return result;
};

const agrupar = (perguntas = []) => {
  const g = { facil: [], medio: [], dificil: [] };
  perguntas.forEach((p, i) => {
    if (g[p?.dificuldade]) g[p.dificuldade].push({ ...p, id: p.id || `${p.dificuldade}-${i}` });
  });
  return g;
};

const suficiente = (banco) => NIVEIS.every(n => (banco[n]??[]).length >= PERGUNTAS_POR_NIVEL);

const QuizContext = createContext();

export function QuizProvider({ children }) {
  const [bancoDiario, setBancoDiario] = useState(BANCO_VAZIO);
  const [carregando,  setCarregando]  = useState(true);
  const [dataCarregada, setDataCarregada] = useState('');

  const limparPerguntasAntigas = useCallback(async () => {
    try {
      const limite = new Date(Date.now() - HISTORICO_DIAS * MS_DIA);
      const dataLimite = `${limite.getFullYear()}-${String(limite.getMonth() + 1).padStart(2, '0')}-${String(limite.getDate()).padStart(2, '0')}`;

      const antigasQuery = query(
        collection(db, COLECAO),
        where('data', '<', dataLimite),
        orderBy('data', 'asc')
      );

      const snap = await getDocs(antigasQuery);
      if (snap.empty) return;

      await Promise.all(snap.docs.map((docSnap) => deleteDoc(docSnap.ref)));
      console.log(`[Quiz] ${snap.size} documento(s) antigo(s) removido(s).`);
    } catch (error) {
      console.warn('Erro ao limpar perguntas antigas do quiz:', error);
    }
  }, []);

  const carregar = useCallback(async () => {
    const hoje = dataLocalISO();

    if (dataCarregada === hoje && suficiente(bancoDiario)) {
      return;
    }

    try {
      await limparPerguntasAntigas();

      const snapDia = await getDoc(doc(collection(db, COLECAO), hoje));
      if (snapDia.exists()) {
        const pergsDia = filtrar(snapDia.data()?.perguntas ?? []);
        const banco = agrupar(pergsDia);

        const MS = 24*60*60*1000;
        const [ano,mes,dia] = hoje.split('-').map(Number);
        const indice = Math.floor(Date.UTC(ano,mes-1,dia) / MS);
        const hashStr = (s) => { let h=0; for(let i=0;i<s.length;i++) h=(Math.imul(h,31)+s.charCodeAt(i))%2147483647; return Math.abs(h); };
        const embaralhar = (id, itens) => {
          const lista = [...itens];
          for (let i=lista.length-1;i>0;i--) { const j=hashStr(`${id}-${i}`)%(i+1); [lista[i],lista[j]]=[lista[j],lista[i]]; }
          return lista;
        };

        const bancoDia = NIVEIS.reduce((acc, nivel) => {
          const pergs = banco[nivel] ?? [];
          if (!pergs.length) { acc[nivel] = []; return acc; }
          const ciclo = Math.floor((indice*PERGUNTAS_POR_NIVEL)/pergs.length);
          const inicio = (indice*PERGUNTAS_POR_NIVEL)%pergs.length;
          const ordem = embaralhar(`${nivel}-${ciclo}`, pergs);
          acc[nivel] = Array.from({length:Math.min(PERGUNTAS_POR_NIVEL,ordem.length)},(_,i)=>ordem[(inicio+i)%ordem.length]);
          return acc;
        }, { facil:[], medio:[], dificil:[] });

        if (suficiente(bancoDia)) {
          setBancoDiario(bancoDia);
          setDataCarregada(hoje);
          return;
        }
      }

      setCarregando(true);

      const snapHistorico = await getDocs(query(collection(db, COLECAO), limit(HISTORICO_DIAS)));
      const historico = snapHistorico.docs
        .filter(d => d.id !== hoje)
        .sort((a,b) => (b.data()?.data??'').localeCompare(a.data()?.data??''))
        .flatMap(d => d.data()?.perguntas ?? []);

      const assinaturasHistorico = new Set(historico.map(assinatura));
      const evitadas = historico.map(p => p.pergunta).filter(Boolean);
      let geradasIA = [];

      for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
        try {
          const novas = await gerarPerguntasGemini(textoTim, {
            dataReferencia: hoje, tentativa,
            perguntasEvitadas: evitadas.slice(0,120),
          });
          const filtradas = filtrar(novas, assinaturasHistorico);
          const sigAtual = new Set(geradasIA.map(assinatura));
          filtradas.forEach(p => {
            const sig = assinatura(p);
            if (!pareceRepetida(sig, sigAtual)) { sigAtual.add(sig); geradasIA.push(p); }
          });
          filtradas.forEach(p => { assinaturasHistorico.add(assinatura(p)); evitadas.push(p.pergunta); });
          if (suficiente(agrupar(geradasIA))) break;
        } catch (e) {
          console.warn(`Tentativa ${tentativa} IA falhou:`, e);
        }
      }

      const bancoIA = agrupar(geradasIA);
      const sigAtual = new Set(geradasIA.map(assinatura));
      const fallbackFiltrado = filtrar(perguntasFallback, sigAtual);
      let perguntasFinais = [...geradasIA];

      NIVEIS.forEach(nivel => {
        const faltam = PERGUNTAS_POR_NIVEL - (bancoIA[nivel]??[]).length;
        if (faltam <= 0) return;
        const disp = fallbackFiltrado.filter(p => p.dificuldade === nivel).slice(0, faltam);
        perguntasFinais = [...perguntasFinais, ...disp];
        console.log(`Complementou ${nivel} com ${disp.length} fallback`);
      });

      const MS = 24*60*60*1000;
      const [ano,mes,dia] = hoje.split('-').map(Number);
      const indice = Math.floor(Date.UTC(ano,mes-1,dia) / MS);
      const hashStr = (s) => { let h=0; for(let i=0;i<s.length;i++) h=(Math.imul(h,31)+s.charCodeAt(i))%2147483647; return Math.abs(h); };
      const embaralhar = (id, itens) => {
        const lista = [...itens];
        for (let i=lista.length-1;i>0;i--) { const j=hashStr(`${id}-${i}`)%(i+1); [lista[i],lista[j]]=[lista[j],lista[i]]; }
        return lista;
      };
      const agrupadoFinal = agrupar(perguntasFinais);
      const bancoDia = NIVEIS.reduce((acc, nivel) => {
        const pergs = agrupadoFinal[nivel] ?? [];
        if (!pergs.length) { acc[nivel] = []; return acc; }
        const ciclo = Math.floor((indice*PERGUNTAS_POR_NIVEL)/pergs.length);
        const inicio = (indice*PERGUNTAS_POR_NIVEL)%pergs.length;
        const ordem = embaralhar(`${nivel}-${ciclo}`, pergs);
        acc[nivel] = Array.from({length:Math.min(PERGUNTAS_POR_NIVEL,ordem.length)},(_,i)=>ordem[(inicio+i)%ordem.length]);
        return acc;
      }, { facil:[], medio:[], dificil:[] });

      setBancoDiario(bancoDia);
      setDataCarregada(hoje);

      if (geradasIA.length > 0) {
        await setDoc(doc(collection(db, COLECAO), hoje), {
          data: hoje,
          perguntas: geradasIA,
          assinaturas: geradasIA.map(assinatura),
          total: geradasIA.length,
          atualizadoEm: serverTimestamp(),
        }, { merge: true });
      }

    } catch (e) {
      console.warn('Erro geral no QuizContext, usando fallback:', e);
      const hashStr = (s) => { let h=0; for(let i=0;i<s.length;i++) h=(Math.imul(h,31)+s.charCodeAt(i))%2147483647; return Math.abs(h); };
      const embaralhar = (id, itens) => {
        const lista = [...itens];
        for (let i=lista.length-1;i>0;i--) { const j=hashStr(`${id}-${i}`)%(i+1); [lista[i],lista[j]]=[lista[j],lista[i]]; }
        return lista;
      };
      const MS = 24*60*60*1000;
      const [ano,mes,dia] = hoje.split('-').map(Number);
      const indice = Math.floor(Date.UTC(ano,mes-1,dia) / MS);
      const agrupadoFb = agrupar(perguntasFallback);
      const bancoDia = NIVEIS.reduce((acc, nivel) => {
        const pergs = agrupadoFb[nivel] ?? [];
        if (!pergs.length) { acc[nivel]=[]; return acc; }
        const ciclo = Math.floor((indice*PERGUNTAS_POR_NIVEL)/pergs.length);
        const inicio = (indice*PERGUNTAS_POR_NIVEL)%pergs.length;
        const ordem = embaralhar(`${nivel}-${ciclo}`, pergs);
        acc[nivel] = Array.from({length:Math.min(PERGUNTAS_POR_NIVEL,ordem.length)},(_,i)=>ordem[(inicio+i)%ordem.length]);
        return acc;
      }, { facil:[], medio:[], dificil:[] });
      setBancoDiario(bancoDia);
      setDataCarregada(hoje);
    } finally {
      setCarregando(false);
    }
  }, [dataCarregada, bancoDiario, limparPerguntasAntigas]);

  useEffect(() => { carregar(); }, [carregar]);

  return (
    <QuizContext.Provider value={{ bancoDiario, carregando, recarregar: carregar }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  return useContext(QuizContext);
}
