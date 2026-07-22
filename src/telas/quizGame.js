import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal,
  FlatList, Alert,
  SafeAreaView, Image, ScrollView
} from 'react-native';
import {
  getFirestore, collection, doc,
  getDoc, setDoc, query, orderBy,
  limit, getDocs, increment, serverTimestamp,
} from '@react-native-firebase/firestore';
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { useQuiz } from '../componentes/QuizContext';
import { getAvatarUrl, useAuth } from '../componentes/AuthContext';
import { useAvatar } from '../componentes/AvatarContext';

const db           = getFirestore();

const GOLD  = '#C9A84C';
const BG    = '#0a0a0a';
const CARD  = '#141414';
const GREEN = '#22C55E';
const RED   = '#E53935';

const MULTIPLICADOR      = { facil: 1, medio: 2, dificil: 3 };
const ACERTOS_PARA_SUBIR = 7;
const LIMITE_DIARIO      = 6;
const NIVEIS             = ['facil', 'medio', 'dificil'];

const LABEL_NIVEL = {
  facil:   'Nível Fácil',
  medio:   'Nível Médio',
  dificil: 'Nível Difícil',
};

const LABEL_TIPO = {
  multipla:          'Múltipla Escolha',
  verdadeiro_falso:  'Verdadeiro ou Falso',
  complete_letra:    '🎵 Complete a Letra',
  qual_nao_pertence: '🚫 Qual Não Pertence',
  de_qual_musica:    '🎷 De Qual Música?',
  cronologia:        '📅 Cronologia',
};

const dataLocalISO = () => {
  const agora          = new Date();
  const offsetBrasilia = -3 * 60;
  const offsetLocal    = agora.getTimezoneOffset();
  const diffFuso       = (offsetBrasilia - offsetLocal) * 60 * 1000;
  const d              = new Date(agora.getTime() - diffFuso);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const PERGUNTAS_POR_NIVEL = 2;
const bancoPronto = (banco) =>
  NIVEIS.every(n => (banco[n] ?? []).length >= PERGUNTAS_POR_NIVEL);

const montarSequenciaDiaria = (banco) => {
  if (!banco) return [];

  return [
    ...(banco.facil ?? []).slice(0, PERGUNTAS_POR_NIVEL),
    ...(banco.medio ?? []).slice(0, PERGUNTAS_POR_NIVEL),
    ...(banco.dificil ?? []).slice(0, PERGUNTAS_POR_NIVEL),
  ].slice(0, LIMITE_DIARIO);
};

export default function QuizGame({ navigation }) {

  const { bancoDiario, carregando: carregandoCtx, recarregar } = useQuiz();
  const {
    usuario,
    nomeUsuario,
    fotoUrl,
    carregandoUsuario,
    sairConta,
  } = useAuth();

  const { adicionarMoedas, avatarFotoUrl } = useAvatar();

  const interstitialPronto = useRef(false);
  const interstitialRef = useRef(null);

  const INTERSTITIAL_ID = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-2028860531808564/3770088144';
  const carregarInterstitial = useCallback(() => {
    const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_ID);
    ad.addAdEventListener(AdEventType.LOADED, () => { interstitialPronto.current = true; });
    ad.addAdEventListener(AdEventType.CLOSED, () => {
      interstitialPronto.current = false;
      carregarInterstitial();
    });
    ad.load();
    interstitialRef.current = ad;
  }, []);

  useEffect(() => { carregarInterstitial(); }, [carregarInterstitial]);

  const [quizIniciado,             setQuizIniciado]             = useState(false);
  const [perguntaAtual,            setPerguntaAtual]            = useState(null);
  const [indicePergunta,           setIndicePergunta]           = useState(0);
  const [nivel,                    setNivel]                    = useState('facil');
  const [pontuacao,                setPontuacao]                = useState(0);
  const [tempoRestante,            setTempoRestante]            = useState(30);
  const [carregandoPergunta,       setCarregandoPergunta]       = useState(false);
  const [acertosNivel,             setAcertosNivel]             = useState(0);
  const [feedback,                 setFeedback]                 = useState(null);
  const [perguntasUsadas,          setPerguntasUsadas]          = useState([]);
  const [perguntasRespondidasHoje, setPerguntasRespondidasHoje] = useState(0);
  const [indiceEscolhido,          setIndiceEscolhido]          = useState(null);
  const [jogoEncerrado,            setJogoEncerrado]            = useState(false);

  const pontuacaoFinalRef = useRef(0);
  const timerRef          = useRef(null);
  const perguntasUsadasRef = useRef([]);

  const [jogoJaFeitoHoje, setJogoJaFeitoHoje] = useState(false);
  const [tempoParaProximo, setTempoParaProximo] = useState('');

  const [modalRanking,  setModalRanking]  = useState(false);
  const [rankingGlobal, setRankingGlobal] = useState([]);
  const [loadingRanking, setLoadingRanking] = useState(false);

  const [perguntasDoDia, setPerguntasDoDia] = useState([]);

  useEffect(() => {
  if (!bancoDiario || !bancoPronto(bancoDiario)) return;

  const sequencia = [
    ...(bancoDiario.facil ?? []).slice(0, PERGUNTAS_POR_NIVEL),
    ...(bancoDiario.medio ?? []).slice(0, PERGUNTAS_POR_NIVEL),
    ...(bancoDiario.dificil ?? []).slice(0, PERGUNTAS_POR_NIVEL),
  ].slice(0, LIMITE_DIARIO);

  setPerguntasDoDia(sequencia);
  if (!quizIniciado) {
    setIndicePergunta(0);
    setPerguntaAtual(sequencia[0] || null);
    setNivel(sequencia[0]?.dificuldade || 'facil');
  }
}, [bancoDiario, quizIniciado]);

  useEffect(() => {
    async function verificar() {
      if (!usuario) { setJogoJaFeitoHoje(false); return; }
      try {
        const snap = await getDoc(doc(collection(db, 'ranking'), usuario.uid));
        if (!snap.exists()) { setJogoJaFeitoHoje(false); return; }
        const ultimaJogada = snap.data()?.ultimaJogada;
        if (ultimaJogada === dataLocalISO()) {
          setJogoJaFeitoHoje(true);
          iniciarContagemRegressiva();
        } else {
          setJogoJaFeitoHoje(false);
        }
      } catch (e) {
        console.warn('Erro ao verificar limite diário:', e);
        setJogoJaFeitoHoje(false);
      }
    }
    verificar();
  }, [usuario]);

const finalizarJogo = () => setJogoEncerrado(true);
function avancarPergunta() {
  setIndicePergunta((idxAnterior) => {
    const proximo = idxAnterior + 1;

    if (proximo >= perguntasDoDia.length) {
      finalizarJogo();
      return idxAnterior;
    }

    const proxPergunta = perguntasDoDia[proximo];
    setPerguntaAtual(proxPergunta);
    setTempoRestante(30);
    setIndiceEscolhido(null);
    setFeedback(null);

    return proximo;
  });
}
function responderMultipla(indiceOpcao) {
  if (!perguntaAtual || indiceEscolhido !== null) return;

  const acertou = indiceOpcao === perguntaAtual.resposta;

  setIndiceEscolhido(indiceOpcao);
  setFeedback(acertou ? 'acertou' : 'errou');
  clearInterval(timerRef.current);

  if (acertou) {
    const pontos = 10 * MULTIPLICADOR[perguntaAtual.dificuldade || 'medio'];
    setPontuacao((p) => p + pontos);
  }

  setTimeout(() => {
    avancarPergunta();
  }, 1200);
}
function iniciarContagemRegressiva() {
  const atualizar = () => {
    const agora = new Date();

    const offsetBrasilia = -3 * 60;
    const offsetLocal    = agora.getTimezoneOffset();
    const diffFuso = (offsetBrasilia - offsetLocal) * 60 * 1000;

    const agoraBrasilia = new Date(agora.getTime() - diffFuso);

    const amanhaBrasilia = new Date(
      agoraBrasilia.getFullYear(),
      agoraBrasilia.getMonth(),
      agoraBrasilia.getDate() + 1,
      0, 0, 0, 0,
    );

    const resetUTC = new Date(amanhaBrasilia.getTime() + diffFuso);

    const diff = resetUTC.getTime() - agora.getTime();

    if (diff <= 0) {
      setJogoJaFeitoHoje(false);
      setJogoEncerrado(false);
      setTempoParaProximo('00:00:00');
      return;
    }

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    setTempoParaProximo(
      `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    );
  };

  atualizar();
  const id = setInterval(atualizar, 1000);
  return () => clearInterval(id);
}

const carregarPerguntaDinamica = useCallback((
  nivelAtual = nivel,
  banco      = bancoDiario,
  zerarUsadas = false,
) => {
  const sequencia = perguntasDoDia.length ? perguntasDoDia : montarSequenciaDiaria(banco);
  if (sequencia.length) {
  const proximoIndice = zerarUsadas ? 0 : indicePergunta + 1;
  const proxima = sequencia[proximoIndice];

  if (!proxima) {
    setPerguntaAtual(null);
    setCarregandoPergunta(false);
    setJogoEncerrado(true);
    return;
  }

  setPerguntasDoDia(sequencia);
  setIndicePergunta(proximoIndice);
  setPerguntaAtual(proxima);
  setNivel(proxima.dificuldade || 'facil');
  setTempoRestante(30);
  setIndiceEscolhido(null);
  setFeedback(null);
  setCarregandoPergunta(false);
  return;
  }

  if (zerarUsadas) {
    perguntasUsadasRef.current = [];
    setPerguntasUsadas([]);
  }

  const todas = banco[nivelAtual] ?? [];
  const usadas = perguntasUsadasRef.current;
  let disponiveis = todas.filter(p => !usadas.includes(p.id));

  if (disponiveis.length === 0) {
    if (todas.length > 0) {
      perguntasUsadasRef.current = [];
      setPerguntasUsadas([]);
      disponiveis = todas;
    } else {
      setPerguntaAtual(null);
      setCarregandoPergunta(false);
      setJogoEncerrado(true);
      return;
    }
  }

  const nova = disponiveis[Math.floor(Math.random() * disponiveis.length)];

  perguntasUsadasRef.current = [...perguntasUsadasRef.current, nova.id];
  setPerguntasUsadas(perguntasUsadasRef.current);

  setPerguntaAtual(nova);
  setTempoRestante(30);
  setIndiceEscolhido(null);
  setFeedback(null);
  setCarregandoPergunta(false);
}, [nivel, bancoDiario, perguntasDoDia, indicePergunta]);

  const salvarPontuacaoFirebase = useCallback(async (pts) => {
    if (!usuario) return;
    try {
      await setDoc(
        doc(collection(db, 'ranking'), usuario.uid),
        {
          uid:   usuario.uid,
          nome:
  usuario?.displayName ||
  nomeUsuario ||
  usuario?.email?.split('@')[0] ||
  'Jogador',

photoURL:
  usuario?.photoURL ||
  fotoUrl ||
  getAvatarUrl(
    usuario?.displayName ||
    nomeUsuario ||
    'Jogador'
  ),
          avatarUrl:            avatarFotoUrl || null,
          totalPontosAcumulados: increment(pts),
          ultimaJogada:          dataLocalISO(),
          atualizadoEm:          serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.error('Erro ao salvar pontuação:', e);
    }
  }, [usuario, nomeUsuario, fotoUrl, avatarFotoUrl]);

  const carregarRankingGlobal = useCallback(async () => {
    setLoadingRanking(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'ranking'), orderBy('totalPontosAcumulados','desc'), limit(10))
      );
      setRankingGlobal(snap.docs.map((d, i) => ({ id: d.id, posicao: i+1, ...d.data() })));
    } catch (e) {
      console.error('Erro ao carregar ranking:', e);
      Alert.alert('Erro', 'Não foi possível carregar o ranking.');
    } finally {
      setLoadingRanking(false);
    }
  }, []);

  const responderPergunta = useCallback(async (resposta) => {
    if (jogoEncerrado || !perguntaAtual || feedback !== null || indiceEscolhido !== null) return;
    clearInterval(timerRef.current);
    setIndiceEscolhido(resposta);

    const total   = perguntasRespondidasHoje + 1;
    const acertou = resposta === perguntaAtual.resposta;
    setPerguntasRespondidasHoje(total);
    setFeedback(acertou ? 'certo' : 'errado');

setTimeout(async () => {
  let pts = pontuacaoFinalRef.current;
  if (acertou) pts += tempoRestante * MULTIPLICADOR[perguntaAtual.dificuldade || nivel];

  if (total >= LIMITE_DIARIO) {
    pontuacaoFinalRef.current = pts;
    setPontuacao(pts);
    setJogoJaFeitoHoje(true);
    setJogoEncerrado(true);
    iniciarContagemRegressiva();
    if (usuario) {
      await salvarPontuacaoFirebase(pts);
      const moedas = 50 + Math.floor(pts / 10);
      await adicionarMoedas(moedas);
    }
    if (interstitialPronto.current) {
      try { interstitialRef.current.show(); } catch {}
    }
    carregarRankingGlobal();
    return;
  }

  if (acertou) {
    const novosAcertos = acertosNivel + 1;
    pontuacaoFinalRef.current = pts;
    setPontuacao(pts);
    setAcertosNivel(novosAcertos);

    if (novosAcertos >= ACERTOS_PARA_SUBIR) {
      const idx  = NIVEIS.indexOf(nivel);
      const prox = idx < NIVEIS.length - 1 ? NIVEIS[idx+1] : NIVEIS[idx];
      setNivel(prox);
      setAcertosNivel(0);
      carregarPerguntaDinamica(prox, bancoDiario, true);
    } else {
      carregarPerguntaDinamica(nivel, bancoDiario);
    }
  } else {
    carregarPerguntaDinamica(nivel, bancoDiario);
  }
}, 1500);
}, [
  jogoEncerrado, perguntaAtual, feedback, indiceEscolhido, perguntasRespondidasHoje,
  tempoRestante, nivel, acertosNivel, usuario,
  salvarPontuacaoFirebase, adicionarMoedas, carregarRankingGlobal,
  carregarPerguntaDinamica, bancoDiario,
]);

  useEffect(() => {
    if (!perguntaAtual || feedback !== null || jogoEncerrado || !quizIniciado) {
      clearInterval(timerRef.current);
      return;
    }
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          responderPergunta(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [perguntaAtual, feedback, jogoEncerrado, quizIniciado, responderPergunta]);

  const renderizarOpcoes = () => {
    if (!perguntaAtual) return null;

    if (perguntaAtual.tipo === 'verdadeiro_falso') {
      return (
        <View style={s.opcoesVF}>
          {[true, false].map(valor => {
            const clicada = indiceEscolhido === valor;
            const correta = feedback && valor === perguntaAtual.resposta;
            const errada  = feedback && clicada && feedback === 'errado';
            return (
              <TouchableOpacity
                key={String(valor)}
                style={[s.btnVF, correta && s.opcaoCorreta, errada && s.opcaoErrada]}
                onPress={() => !feedback && responderPergunta(valor)}
                disabled={!!feedback}
              >
                <Text style={s.btnVFTexto}>{valor ? '✅ Verdadeiro' : '❌ Falso'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    const comOpcoes = ['multipla','complete_letra','qual_nao_pertence','de_qual_musica','cronologia'];
    if (comOpcoes.includes(perguntaAtual.tipo)) {
      const opcoes = perguntaAtual.opcoes || [];
      if (!opcoes.length) return <Text style={s.erroOpcao}>Erro na pergunta.</Text>;
      const icones = { complete_letra:'🎵', qual_nao_pertence:'🚫', de_qual_musica:'🎷', cronologia:'📅', multipla:'' };
      const icone  = icones[perguntaAtual.tipo] || '';
      return opcoes.map((opcao, i) => {
        const clicada = indiceEscolhido === i;
        const correta = feedback && i === perguntaAtual.resposta;
        const errada  = feedback && clicada && feedback === 'errado';
        return (
          <TouchableOpacity
            key={i}
            style={[s.opcao, correta && s.opcaoCorreta, errada && s.opcaoErrada]}
            onPress={() => !feedback && responderPergunta(i)}
            disabled={!!feedback}
          >
            <View style={s.opcaoLetra}>
              <Text style={s.opcaoLetraTexto}>{['A','B','C','D'][i]}</Text>
            </View>
            <Text style={s.opcaoTexto}>{icone ? `${icone} ` : ''}{opcao}</Text>
          </TouchableOpacity>
        );
      });
    }
    return null;
  };

  const corTimer  = tempoRestante > 15 ? GREEN : tempoRestante > 5 ? GOLD : RED;
  const quizPronto = bancoPronto(bancoDiario);

  const abrirConta = useCallback(() => {
    const parent = navigation?.getParent?.();

    if (parent) {
      parent.navigate('Conta');
      return;
    }

    navigation?.navigate?.('Conta');
  }, [navigation]);

  const sairDoQuiz = useCallback(async () => {
    try {
      await sairConta();
      clearInterval(timerRef.current);
      setQuizIniciado(false);
      setJogoEncerrado(false);
      setIndiceEscolhido(null);
      setFeedback(null);
      Alert.alert('Desconectado', 'Voce saiu da sua conta.');
    } catch (e) {
      Alert.alert('Erro', 'Nao foi possivel sair da conta.');
    }
  }, [sairConta]);

  const renderUsuarioQuiz = () => (
    <View style={s.usuarioBar}>
      <Image
        source={{ uri: avatarFotoUrl || fotoUrl || getAvatarUrl(nomeUsuario) }}
        style={s.usuarioAvatar}
      />
      <Text style={s.usuarioNome} numberOfLines={1}>
        {nomeUsuario}
      </Text>
      <TouchableOpacity style={s.usuarioSairBtn} onPress={sairDoQuiz}>
        <Text style={s.usuarioSairTexto}>Sair</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      {usuario && renderUsuarioQuiz()}

      {}
      {carregandoUsuario ? (
        <View style={s.centralized}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>

      ) : !usuario ? (
        <View style={s.centralized}>
          <Text style={s.startTitulo}>Entre para jogar</Text>
          <Text style={s.startSub}>
            O quiz precisa de uma conta para salvar sua pontuacao no Firebase.
          </Text>
          <TouchableOpacity style={s.btnPrimario} onPress={abrirConta}>
            <Text style={s.btnPrimarioTexto}>Entrar ou criar conta</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSecundario} onPress={()=>{carregarRankingGlobal();setModalRanking(true);}}>
            <Text style={s.btnSecundarioTexto}>Ver Ranking</Text>
          </TouchableOpacity>
        </View>

      ) : jogoJaFeitoHoje && !jogoEncerrado ? (
        <View style={s.centralized}>
          <Text style={{ fontSize: 56, marginBottom: 12 }}>⏳</Text>
          <Text style={s.bloqTitulo}>Você já jogou hoje!</Text>
          <Text style={s.bloqSub}>Volte em:</Text>
          <View style={s.bloqCard}>
            <Text style={s.bloqLabel}>PRÓXIMO QUIZ EM</Text>
            <Text style={s.bloqTimer}>{tempoParaProximo}</Text>
          </View>
          <TouchableOpacity style={[s.btnSecundario,{marginTop:24}]} onPress={()=>{carregarRankingGlobal();setModalRanking(true);}}>
            <Text style={s.btnSecundarioTexto}>🏆 Ver Ranking</Text>
          </TouchableOpacity>
        </View>

      ) : carregandoCtx ? (

        <View style={s.centralized}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={s.loadingTitulo}>🎷 Gerando perguntas inéditas...</Text>
          <Text style={s.loadingSub}>Consultando histórico para evitar repetição</Text>
        </View>

      ) : !quizIniciado ? (

        <View style={s.centralized}>
          <Text style={s.startEmoji}>🎷</Text>
          <Text style={s.startTitulo}>Quiz do Tim Maia</Text>
          <Text style={s.startSub}>Teste seus conhecimentos sobre O Rei do Soul!</Text>

          <TouchableOpacity
            style={s.btnPrimario}
           onPress={() => {
  if (!quizPronto) { recarregar(); return; }
  perguntasUsadasRef.current = [];
  setPerguntasUsadas([]);
  pontuacaoFinalRef.current = 0;
  setPontuacao(0);
  setAcertosNivel(0);
  setPerguntasRespondidasHoje(0);
  setIndiceEscolhido(null);
  setFeedback(null);
  setTempoRestante(30);
  setJogoEncerrado(false);
  setQuizIniciado(true);
  carregarPerguntaDinamica('facil', bancoDiario, true);
}}
          >
            <Text style={s.btnPrimarioTexto}>
              {quizPronto ? 'Iniciar Quiz' : 'Carregar perguntas'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.btnSecundario} onPress={()=>{carregarRankingGlobal();setModalRanking(true);}}>
            <Text style={s.btnSecundarioTexto}>🏆 Ver Ranking</Text>
          </TouchableOpacity>

        </View>

      ) : jogoEncerrado ? (

        <ScrollView contentContainerStyle={s.centralized}>
          <Text style={s.fimEmoji}>🎷</Text>
          <Text style={s.fimTitulo}>Fim de Jogo!</Text>
          <Text style={s.fimSub}>Você respondeu {LIMITE_DIARIO} perguntas hoje</Text>
          <View style={s.fimPontuacaoCard}>
            <Text style={s.fimPontuacaoLabel}>Sua pontuação</Text>
            <Text style={s.fimPontuacaoValor}>{pontuacao} pts</Text>
          </View>

          <Text style={s.fimSalvo}>Pontuacao salva no ranking!</Text>
          <TouchableOpacity style={s.btnPrimario} onPress={()=>{carregarRankingGlobal();setModalRanking(true);}}>
            <Text style={s.btnPrimarioTexto}>Ver Ranking</Text>
          </TouchableOpacity>
          <Text style={s.fimRodape}>Volte amanhã para mais perguntas!</Text>
        </ScrollView>

      ) : (

        <ScrollView showsVerticalScrollIndicator={false}>

          {}
         {}
<View style={s.topBar}>
  <View style={s.niveisRow}>
    {NIVEIS.map((n) => {
      const ativo = n === (perguntaAtual?.dificuldade || nivel);
      const labels = { facil: '⭐', medio: '⭐⭐', dificil: '⭐⭐⭐' };
      return (
        <View key={n} style={[s.nivelChip, ativo && s.nivelChipAtivo]}>
          <Text style={[s.nivelChipTexto, ativo && s.nivelChipTextoAtivo]}>
            {labels[n]}
          </Text>
          {ativo && (
            <Text style={s.nivelChipNome}>
              {n.charAt(0).toUpperCase() + n.slice(1)}
            </Text>
          )}
        </View>
      );
    })}
    <Text style={s.acertosTexto}>Pergunta {Math.min(indicePergunta + 1, LIMITE_DIARIO)}/{LIMITE_DIARIO}</Text>
  </View>

  <View style={s.topBtns}>
    <TouchableOpacity style={s.topBtn} onPress={() => {
      carregarRankingGlobal();
      setModalRanking(true);
    }}>
      <Text style={s.topBtnTexto}>Ranking</Text>
    </TouchableOpacity>
  </View>
</View>

          {}
          <View style={s.pontuacaoCard}>
            <Text style={s.pontuacaoLabel}>Pontuação</Text>
            <Text style={s.pontuacaoValor}>{pontuacao} pts</Text>
            <View style={s.progressoBar}>
              <View style={[s.progressoFill, { width: `${(perguntasRespondidasHoje / LIMITE_DIARIO) * 100}%` }]} />
            </View>
            <Text style={s.progressoTexto}>{perguntasRespondidasHoje}/{LIMITE_DIARIO} perguntas respondidas</Text>
          </View>

          {}
          {carregandoPergunta ? (
            <ActivityIndicator size="large" color={GOLD} style={{ marginTop: 40 }} />
          ) : (
            <View style={s.perguntaCard}>
              <View style={s.perguntaHeader}>
                <View style={[s.timerBadge, { borderColor: corTimer }]}>
                  <Text style={[s.timerTexto, { color: corTimer }]}>⏱ {tempoRestante}s</Text>
                </View>
                <Text style={s.tipoTexto}>{LABEL_TIPO[perguntaAtual?.tipo] || 'Pergunta'}</Text>
              </View>

              {feedback && (
                <View style={[s.feedbackBadge, {
                  backgroundColor: feedback === 'certo' ? '#14532d' : '#7f1d1d',
                  borderColor:     feedback === 'certo' ? GREEN : RED,
                }]}>
                  <Text style={[s.feedbackTexto, { color: feedback === 'certo' ? GREEN : RED }]}>
                    {feedback === 'certo' ? '✅ Correto!' : '❌ Errado!'}
                  </Text>
                </View>
              )}

              <Text style={s.perguntaTexto}>{perguntaAtual?.pergunta}</Text>
              {renderizarOpcoes()}
            </View>
          )}
        </ScrollView>
      )}

      {}
      <Modal visible={modalRanking} transparent animationType="slide" onRequestClose={()=>setModalRanking(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitulo}>🏆 Ranking Global</Text>
            {loadingRanking ? (
              <ActivityIndicator color={GOLD} size="large" style={{marginVertical:32}} />
            ) : rankingGlobal.length === 0 ? (
              <Text style={s.semDados}>Nenhum resultado ainda.</Text>
            ) : (
              <FlatList
                data={rankingGlobal}
                keyExtractor={item => item.uid || item.id || String(Math.random())}
                style={{ width:'100%', maxHeight:380 }}
                renderItem={({ item }) => (
                  <View style={[s.rankingItem, usuario?.uid === item.uid && s.rankingItemDestaque]}>
                    <Text style={s.rankingPos}>
                      {item.posicao===1?'🥇':item.posicao===2?'🥈':item.posicao===3?'🥉':`#${item.posicao}`}
                    </Text>
                    <Image
                      source={{ uri: item.avatarUrl || item.photoURL || `https://ui-avatars.com/api/?background=random&color=random&name=${encodeURIComponent(item.nome||'U')}` }}
                      style={s.rankingAvatar}
                    />
                    <Text style={s.rankingNome}>{item.nome || 'Jogador'}</Text>
                    <Text style={s.rankingPontos}>{`${item.totalPontosAcumulados || 0} pts`}</Text>
                  </View>
                )}
              />
            )}
            <TouchableOpacity onPress={()=>setModalRanking(false)} style={{marginTop:16}}>
              <Text style={s.fecharTexto}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:   { flex:1, backgroundColor:BG, padding:16 },
  centralized: { flex:1, justifyContent:'center', alignItems:'center', paddingVertical:40 },

  bloqTitulo: { color:GOLD, fontSize:22, fontWeight:'900', textAlign:'center' },
  bloqSub:    { color:'#555', fontSize:13, marginTop:8, textAlign:'center' },
  bloqCard:   { backgroundColor:CARD, borderRadius:16, borderWidth:1, borderColor:GOLD, paddingVertical:20, paddingHorizontal:40, alignItems:'center', marginTop:16 },
  bloqLabel:  { color:'#555', fontSize:11, letterSpacing:1, textTransform:'uppercase' },
  bloqTimer:  { color:GOLD, fontSize:40, fontWeight:'900', marginTop:4, fontVariant:['tabular-nums'] },

  loadingTitulo: { color:GOLD, fontSize:16, fontWeight:'700', marginTop:16 },
  loadingSub:    { color:'#444', fontSize:12, marginTop:6 },

  startEmoji: { fontSize:64, marginBottom:16 },
  startTitulo:{ color:GOLD, fontSize:28, fontWeight:'900', marginBottom:8 },
  startSub:   { color:'#ccc', fontSize:16, textAlign:'center', marginBottom:32, maxWidth:'80%' },

  fimEmoji:        { fontSize:56, marginBottom:8 },
  fimTitulo:       { color:GOLD, fontSize:24, fontWeight:'900' },
  fimSub:          { color:'#555', fontSize:13, marginTop:6 },
  fimPontuacaoCard:{ backgroundColor:CARD, borderRadius:16, borderWidth:1, borderColor:GOLD, paddingVertical:20, paddingHorizontal:40, alignItems:'center', marginTop:24 },
  fimPontuacaoLabel:{ color:'#555', fontSize:11, letterSpacing:1, textTransform:'uppercase' },
  fimPontuacaoValor:{ color:GOLD, fontSize:40, fontWeight:'900', marginTop:4 },
  fimSalvo:        { color:GREEN, fontSize:13, marginTop:12 },
  fimRodape:       { color:'#333', fontSize:11, marginTop:28, fontStyle:'italic' },

  avisoLoginBanner:     { backgroundColor:'#1a0a00', borderWidth:1, borderColor:'#7a3f00', borderRadius:10, padding:12, marginBottom:12, alignItems:'center', gap:4 },
  avisoLoginBannerTexto:{ color:'#f97316', fontSize:12, textAlign:'center' },
  avisoLoginBannerLink: { color:GOLD, fontSize:12, fontWeight:'700' },
  avisoNaoLogado:       { backgroundColor:'#1a0000', borderWidth:1, borderColor:'#7a0000', borderRadius:12, padding:16, marginTop:16, width:'85%', alignItems:'center' },
  avisoNaoLogadoTitulo: { color:RED, fontSize:14, fontWeight:'700' },
  avisoNaoLogadoSub:    { color:'#888', fontSize:12, marginTop:6, textAlign:'center', lineHeight:18 },

  usuarioBar:      { flexDirection:'row', alignItems:'center', backgroundColor:CARD, borderWidth:1, borderColor:'#222', borderRadius:12, padding:10, marginBottom:12, gap:10 },
  usuarioAvatar:   { width:36, height:36, borderRadius:18, backgroundColor:'#333' },
  usuarioNome:     { flex:1, color:'#fff', fontSize:14, fontWeight:'800' },
  usuarioSairBtn:  { paddingHorizontal:12, paddingVertical:8, borderRadius:8, backgroundColor:'#1a1a1a', borderWidth:1, borderColor:'#333' },
  usuarioSairTexto:{ color:GOLD, fontSize:12, fontWeight:'800' },

  topBar:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  nivelTexto: { color:GOLD, fontWeight:'700', fontSize:14 },
  acertosTexto:{ color:'#555', fontSize:11, marginTop:2 },
  topBtns:    { flexDirection:'row', gap:8 },
  topBtn:     { backgroundColor:CARD, paddingHorizontal:12, paddingVertical:8, borderRadius:10, borderWidth:1, borderColor:'#222' },
  topBtnTexto:{ color:'#fff', fontSize:12, fontWeight:'600' },

  pontuacaoCard:  { backgroundColor:CARD, borderRadius:14, padding:16, alignItems:'center', marginBottom:16, borderWidth:1, borderColor:'#1f1f1f' },
  pontuacaoLabel: { color:'#555', fontSize:11, letterSpacing:1, textTransform:'uppercase' },
  pontuacaoValor: { color:GOLD, fontSize:32, fontWeight:'900', marginTop:4 },
  progressoBar:   { width:'100%', height:4, backgroundColor:'#222', borderRadius:2, marginTop:12, overflow:'hidden' },
  progressoFill:  { height:'100%', backgroundColor:GOLD, borderRadius:2 },
  progressoTexto: { color:'#444', fontSize:11, marginTop:6 },

  perguntaCard:   { backgroundColor:CARD, borderRadius:16, padding:20, borderWidth:1, borderColor:'#1f1f1f' },
  perguntaHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  timerBadge:     { borderWidth:1, borderRadius:8, paddingHorizontal:10, paddingVertical:4 },
  timerTexto:     { fontSize:14, fontWeight:'700' },
  tipoTexto:      { color:'#444', fontSize:11, textTransform:'uppercase', letterSpacing:1 },
  feedbackBadge:  { borderWidth:1, borderRadius:8, padding:10, alignItems:'center', marginBottom:12 },
  feedbackTexto:  { fontSize:15, fontWeight:'700' },
  perguntaTexto:  { color:'#fff', fontSize:17, fontWeight:'600', lineHeight:26, marginBottom:20 },

  opcao:         { flexDirection:'row', alignItems:'center', backgroundColor:'#1a1a1a', borderRadius:10, padding:14, marginVertical:5, borderWidth:1, borderColor:'#2a2a2a', gap:12 },
  opcaoLetra:    { width:28, height:28, borderRadius:14, backgroundColor:'#2a2a2a', alignItems:'center', justifyContent:'center' },
  opcaoLetraTexto:{ color:'#888', fontSize:12, fontWeight:'700' },
  opcaoTexto:    { color:'#ccc', fontSize:15, flex:1 },
  opcaoCorreta:  { backgroundColor:'#14532d', borderColor:GREEN },
  opcaoErrada:   { opacity:0.4 },
  erroOpcao:     { color:RED, textAlign:'center', marginTop:8 },
  opcoesVF:      { flexDirection:'row', gap:10, marginTop:8 },
  btnVF:         { flex:1, backgroundColor:'#1a1a1a', borderRadius:10, padding:16, alignItems:'center', borderWidth:1, borderColor:'#2a2a2a' },
  btnVFTexto:    { color:'#ccc', fontSize:15, fontWeight:'600' },

  btnPrimario:      { backgroundColor:GOLD, paddingVertical:14, paddingHorizontal:24, borderRadius:12, alignItems:'center', width:'85%', marginTop:12 },
  btnPrimarioTexto: { color:BG, fontWeight:'700', fontSize:15 },
  btnSecundario:    { backgroundColor:'#1a1a1a', paddingVertical:14, paddingHorizontal:24, borderRadius:12, alignItems:'center', width:'85%', marginTop:8, borderWidth:1, borderColor:'#333' },
  btnSecundarioTexto:{ color:'#888', fontWeight:'600', fontSize:14 },

  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.85)', justifyContent:'flex-end' },
  modalCard:    { backgroundColor:'#111', borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, alignItems:'center', borderTopWidth:1, borderColor:'#222' },
  modalTitulo:  { color:'#fff', fontSize:20, fontWeight:'900', marginBottom:6 },
  modalSub:     { color:'#555', fontSize:12, textAlign:'center', marginBottom:20 },
  input:        { backgroundColor:'#1a1a1a', borderWidth:1, borderColor:'#2a2a2a', borderRadius:10, padding:14, color:'#fff', width:'100%', marginBottom:10, fontSize:14 },
  fecharTexto:  { color:'#444', fontSize:13 },

  rankingItem:        { flexDirection:'row', alignItems:'center', paddingVertical:10, paddingHorizontal:12, backgroundColor:'#1a1a1a', borderRadius:10, marginVertical:4, borderWidth:1, borderColor:'transparent', gap:10 },
  rankingItemDestaque:{ borderColor:GOLD },
  rankingPos:         { fontSize:18, width:36, textAlign:'center' },
  rankingAvatar:      { width:36, height:36, borderRadius:18, backgroundColor:'#333' },
  rankingNome:        { flex:1, color:'#fff', fontSize:14, fontWeight:'600' },
  rankingPontos:      { color:GOLD, fontWeight:'700', fontSize:14 },
  semDados:           { color:'#444', marginVertical:32, fontSize:13 },

niveisRow:          { flexDirection:'row', alignItems:'center', gap:6, flex:1 },
nivelChip:          { paddingHorizontal:8, paddingVertical:4, borderRadius:8, backgroundColor:'#1a1a1a', borderWidth:1, borderColor:'#2a2a2a', flexDirection:'row', alignItems:'center', gap:3 },
nivelChipAtivo:     { backgroundColor:'#2a1a00', borderColor:GOLD },
nivelChipTexto:     { fontSize:11, color:'#444' },
nivelChipTextoAtivo:{ fontSize:11, color:GOLD },
nivelChipNome:      { fontSize:10, color:GOLD, fontWeight:'700', letterSpacing:0.5 },
});
