import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import {
  buscarNotificacoesEventos,
  marcarNotificacaoComoLida,
} from './eventosService';

const EventosContext = createContext(null);
const db = getFirestore();
const auth = getAuth();

export function EventosProvider({ children }) {
  const [eventos, setEventos] = useState([]);
  const [eventosCarregando, setEventosCarregando] = useState(false);
  const [filtros, setFiltros] = useState({
    cidade: null,
    tipo: null,
    dataInicio: null,
    dataFim: null,
  });
  const [notificacoes, setNotificacoes] = useState([]);
  const [notificacaoExibida, setNotificacaoExibida] = useState(null);

  const limparEventosEncerrados = useCallback(async () => {
    try {
      const dataLimite = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString();
      const eventosRef = collection(db, 'eventos');
      const q = query(
        eventosRef,
        where('dataEvento', '<', dataLimite),
        orderBy('dataEvento', 'asc')
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return;

      await Promise.all(snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));
      console.log(`[Eventos] ${snapshot.size} evento(s) encerrado(s) removido(s).`);
    } catch (error) {
      console.error('Erro ao limpar eventos antigos:', error);
    }
  }, []);

  const buscarEventos = useCallback(async () => {
    try {
      setEventosCarregando(true);
      await limparEventosEncerrados();
      const eventosRef = collection(db, 'eventos');
      const q = query(eventosRef, orderBy('dataEvento', 'asc'));
      const snapshot = await getDocs(q);

      const eventosLista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      const eventosAtualizados = eventosLista.map(evento => {
        const dataEvento = new Date(evento.dataEvento);
        const agora = new Date();
        return {
          ...evento,
          passado: dataEvento < agora,
        };
      });

      setEventos(eventosAtualizados);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
    } finally {
      setEventosCarregando(false);
    }
  }, [limparEventosEncerrados]);

  const buscarEventosFiltrados = useCallback(async () => {
    try {
      setEventosCarregando(true);
      await limparEventosEncerrados();
      const eventosRef = collection(db, 'eventos');
      let condicoes = [];

      if (filtros.cidade) {
        condicoes.push(where('cidade', '==', filtros.cidade));
      }
      if (filtros.tipo) {
        condicoes.push(where('tipo', '==', filtros.tipo));
      }

      const q = condicoes.length > 0
        ? query(eventosRef, ...condicoes, orderBy('dataEvento', 'asc'))
        : query(eventosRef, orderBy('dataEvento', 'asc'));

      const snapshot = await getDocs(q);

      let eventosLista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (filtros.dataInicio || filtros.dataFim) {
        const dataInicio = filtros.dataInicio ? new Date(filtros.dataInicio) : new Date(0);
        const dataFim = filtros.dataFim ? new Date(filtros.dataFim) : new Date('2099-12-31');

        eventosLista = eventosLista.filter(evento => {
          const dataEvento = new Date(evento.dataEvento);
          return dataEvento >= dataInicio && dataEvento <= dataFim;
        });
      }

      const eventosAtualizados = eventosLista.map(evento => {
        const dataEvento = new Date(evento.dataEvento);
        const agora = new Date();
        return {
          ...evento,
          passado: dataEvento < agora,
        };
      });

      setEventos(eventosAtualizados);
    } catch (error) {
      console.error('Erro ao buscar eventos filtrados:', error);
    } finally {
      setEventosCarregando(false);
    }
  }, [filtros, limparEventosEncerrados]);

  const buscarEventosPorCidade = useCallback(async (cidade) => {
    try {
      setEventosCarregando(true);
      await limparEventosEncerrados();
      const eventosRef = collection(db, 'eventos');
      const q = query(
        eventosRef,
        where('cidade', '==', cidade),
        orderBy('dataEvento', 'asc')
      );
      const snapshot = await getDocs(q);

      const eventosLista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      const eventosAtualizados = eventosLista.map(evento => {
        const dataEvento = new Date(evento.dataEvento);
        const agora = new Date();
        return {
          ...evento,
          passado: dataEvento < agora,
        };
      });

      setEventos(eventosAtualizados);
    } catch (error) {
      console.error('Erro ao buscar eventos por cidade:', error);
    } finally {
      setEventosCarregando(false);
    }
  }, [limparEventosEncerrados]);

  const criarEvento = useCallback(async (eventoData) => {
    try {
      const usuario = auth.currentUser;
      if (!usuario) throw new Error('Usuário não autenticado');

      const novoEvento = {
        ...eventoData,
        criadorId: usuario.uid,
        criadorNome: usuario.displayName || usuario.email || 'Anônimo',
        criadorFoto: usuario.photoURL || null,
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
        curtidas: 0,
        presencas: 0,
        comentarios: [],
        curtidasPor: [],
        presencasPor: [],
        oficial: false,
        dataEvento: new Date(eventoData.dataEvento).toISOString(),
      };

      const eventosRef = collection(db, 'eventos');
      const docRef = doc(eventosRef);

      await setDoc(docRef, novoEvento);

      await buscarEventos();

      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw error;
    }
  }, [buscarEventos]);

  const atualizarEvento = useCallback(async (eventoId, dadosAtualizacao) => {
    try {
      const usuario = auth.currentUser;
      if (!usuario) throw new Error('Usuário não autenticado');

      const eventoRef = doc(db, 'eventos', eventoId);
      const eventoSnap = await getDoc(eventoRef);

      if (!eventoSnap.exists()) {
        throw new Error('Evento não encontrado');
      }

      const eventoData = eventoSnap.data();
      if (eventoData.criadorId !== usuario.uid) {
        throw new Error('Você não tem permissão para editar este evento');
      }

      const atualizacao = {
        ...dadosAtualizacao,
        atualizadoEm: serverTimestamp(),
      };

      if (dadosAtualizacao.dataEvento) {
        atualizacao.dataEvento = new Date(dadosAtualizacao.dataEvento).toISOString();
      }

      await updateDoc(eventoRef, atualizacao);

      await buscarEventos();
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      throw error;
    }
  }, [buscarEventos]);

  const deletarEvento = useCallback(async (eventoId) => {
    try {
      const usuario = auth.currentUser;
      if (!usuario) throw new Error('Usuário não autenticado');

      const eventoRef = doc(db, 'eventos', eventoId);
      const eventoSnap = await getDoc(eventoRef);

      if (!eventoSnap.exists()) {
        throw new Error('Evento não encontrado');
      }

      const eventoData = eventoSnap.data();
      if (eventoData.criadorId !== usuario.uid) {
        throw new Error('Você não tem permissão para deletar este evento');
      }

      await deleteDoc(eventoRef);

      await buscarEventos();
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      throw error;
    }
  }, [buscarEventos]);

  const marcarPresenca = useCallback(async (eventoId) => {
    try {
      const usuario = auth.currentUser;
      if (!usuario) throw new Error('Usuário não autenticado');

      const eventoRef = doc(db, 'eventos', eventoId);
      const eventoSnap = await getDoc(eventoRef);

      if (!eventoSnap.exists()) {
        throw new Error('Evento não encontrado');
      }

      const eventoData = eventoSnap.data();
      const presencasPor = eventoData.presencasPor || [];
      const jaPresente = presencasPor.includes(usuario.uid);

      const novaPresencasPor = jaPresente
        ? presencasPor.filter(id => id !== usuario.uid)
        : [...presencasPor, usuario.uid];

      await updateDoc(eventoRef, {
        presencasPor: novaPresencasPor,
        presencas: novaPresencasPor.length,
        atualizadoEm: serverTimestamp(),
      });

      await buscarEventos();
    } catch (error) {
      console.error('Erro ao marcar presença:', error);
      throw error;
    }
  }, [buscarEventos]);

  const curtirEvento = useCallback(async (eventoId) => {
    try {
      const usuario = auth.currentUser;
      if (!usuario) throw new Error('Usuário não autenticado');

      const eventoRef = doc(db, 'eventos', eventoId);
      const eventoSnap = await getDoc(eventoRef);

      if (!eventoSnap.exists()) {
        throw new Error('Evento não encontrado');
      }

      const eventoData = eventoSnap.data();
      const curtidasPor = eventoData.curtidasPor || [];
      const jaCurtido = curtidasPor.includes(usuario.uid);

      const novasCurtidasPor = jaCurtido
        ? curtidasPor.filter(id => id !== usuario.uid)
        : [...curtidasPor, usuario.uid];

      await updateDoc(eventoRef, {
        curtidasPor: novasCurtidasPor,
        curtidas: novasCurtidasPor.length,
        atualizadoEm: serverTimestamp(),
      });

      await buscarEventos();
    } catch (error) {
      console.error('Erro ao curtir evento:', error);
      throw error;
    }
  }, [buscarEventos]);

  const adicionarComentario = useCallback(async (eventoId, texto) => {
    try {
      const usuario = auth.currentUser;
      if (!usuario) throw new Error('Usuário não autenticado');

      const eventoRef = doc(db, 'eventos', eventoId);
      const eventoSnap = await getDoc(eventoRef);

      if (!eventoSnap.exists()) {
        throw new Error('Evento não encontrado');
      }

      const eventoData = eventoSnap.data();
      const comentarios = eventoData.comentarios || [];

      const novoComentario = {
        id: `${usuario.uid}_${Date.now()}`,
        usuarioId: usuario.uid,
        texto,
        criadoEm: new Date().toISOString(),
      };

      comentarios.push(novoComentario);

      await updateDoc(eventoRef, {
        comentarios,
        atualizadoEm: serverTimestamp(),
      });

      await buscarEventos();
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      throw error;
    }
  }, [buscarEventos]);

  const deletarComentario = useCallback(async (eventoId, comentarioId) => {
    try {
      const usuario = auth.currentUser;
      if (!usuario) throw new Error('Usuário não autenticado');

      const eventoRef = doc(db, 'eventos', eventoId);
      const eventoSnap = await getDoc(eventoRef);

      if (!eventoSnap.exists()) {
        throw new Error('Evento não encontrado');
      }

      const eventoData = eventoSnap.data();
      const comentarios = eventoData.comentarios || [];

      const comentarioIndex = comentarios.findIndex(c => c.id === comentarioId);
      if (comentarioIndex === -1) {
        throw new Error('Comentário não encontrado');
      }

      if (comentarios[comentarioIndex].usuarioId !== usuario.uid) {
        throw new Error('Você não tem permissão para deletar este comentário');
      }

      comentarios.splice(comentarioIndex, 1);

      await updateDoc(eventoRef, {
        comentarios,
        atualizadoEm: serverTimestamp(),
      });

      await buscarEventos();
    } catch (error) {
      console.error('Erro ao deletar comentário:', error);
      throw error;
    }
  }, [buscarEventos]);

  const marcarComoOficial = useCallback(async (eventoId, oficial = true) => {
    try {
      const usuario = auth.currentUser;
      if (!usuario) throw new Error('Usuário não autenticado');

      const eventoRef = doc(db, 'eventos', eventoId);
      const eventoSnap = await getDoc(eventoRef);

      if (!eventoSnap.exists()) {
        throw new Error('Evento não encontrado');
      }

      const eventoData = eventoSnap.data();
      if (eventoData.criadorId !== usuario.uid) {
        throw new Error('Você não tem permissão para marcar este evento como oficial');
      }

      await updateDoc(eventoRef, {
        oficial,
        atualizadoEm: serverTimestamp(),
      });

      await buscarEventos();
    } catch (error) {
      console.error('Erro ao marcar evento como oficial:', error);
      throw error;
    }
  }, [buscarEventos]);

  const denunciarEvento = useCallback(async (eventoId, motivo) => {
    try {
      const usuario = auth.currentUser;
      if (!usuario) throw new Error('Usuário não autenticado');

      const eventoRef = doc(db, 'eventos', eventoId);
      const eventoSnap = await getDoc(eventoRef);

      if (!eventoSnap.exists()) {
        throw new Error('Evento não encontrado');
      }

      const eventoData = eventoSnap.data();
      const denuncias = eventoData.denuncias || [];
      const denunciasPor = eventoData.denunciasPor || [];

      if (denunciasPor.includes(usuario.uid)) {
        throw new Error('Você já denunciou este evento');
      }

      denuncias.push({
        usuarioId: usuario.uid,
        motivo,
        criadaEm: new Date().toISOString(),
      });

      const novasDenunciasPor = [...denunciasPor, usuario.uid];

      if (denuncias.length >= 3) {
        await deleteDoc(eventoRef);
      } else {
        await updateDoc(eventoRef, {
          denuncias,
          denunciasPor: novasDenunciasPor,
          atualizadoEm: serverTimestamp(),
        });
      }

      await buscarEventos();
    } catch (error) {
      console.error('Erro ao denunciar evento:', error);
      throw error;
    }
  }, [buscarEventos]);

  const buscarNotificacoes = useCallback(async () => {
    try {
      const usuario = auth.currentUser;
      if (!usuario) {
        setNotificacoes([]);
        return [];
      }

      const notificacoesList = await buscarNotificacoesEventos(usuario.uid);
      const naoLidas = notificacoesList.filter(n => !n.lida);
      setNotificacoes(naoLidas);

      if (naoLidas.length > 0) {
        setNotificacaoExibida(naoLidas[0]);
      }

      return notificacoesList;
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      return [];
    }
  }, []);

  const marcarNotificacaoLida = useCallback(async (notificacaoId) => {
    try {
      await marcarNotificacaoComoLida(notificacaoId);
      setNotificacoes(prev =>
        prev.filter(n => n.id !== notificacaoId)
      );
      setNotificacaoExibida(null);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    buscarEventos();
    buscarNotificacoes();
  }, [buscarEventos, buscarNotificacoes]);

  const value = useMemo(
    () => ({
      eventos,
      eventosCarregando,
      filtros,
      setFiltros,
      notificacoes,
      notificacaoExibida,
      buscarEventos,
      buscarEventosFiltrados,
      buscarEventosPorCidade,
      buscarNotificacoes,
      marcarNotificacaoLida,
      criarEvento,
      atualizarEvento,
      deletarEvento,
      marcarPresenca,
      curtirEvento,
      adicionarComentario,
      deletarComentario,
      marcarComoOficial,
      denunciarEvento,
    }),
    [
      eventos,
      eventosCarregando,
      filtros,
      notificacoes,
      notificacaoExibida,
      buscarEventos,
      buscarEventosFiltrados,
      buscarEventosPorCidade,
      buscarNotificacoes,
      marcarNotificacaoLida,
      criarEvento,
      atualizarEvento,
      deletarEvento,
      marcarPresenca,
      curtirEvento,
      adicionarComentario,
      deletarComentario,
      marcarComoOficial,
      denunciarEvento,
    ],
  );

  return (
    <EventosContext.Provider value={value}>
      {children}
    </EventosContext.Provider>
  );
}

export function useEventos() {
  const context = useContext(EventosContext);
  if (!context) {
    throw new Error('useEventos precisa estar dentro de EventosProvider');
  }
  return context;
}
