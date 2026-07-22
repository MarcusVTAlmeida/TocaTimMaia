import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';

const db = getFirestore();
const auth = getAuth();

export async function verificarEventosProximos(cidade, diasAntecedencia = 7) {
  try {
    if (!cidade) {
      console.log('Cidade não informada para verificar eventos');
      return [];
    }

    const agora = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + diasAntecedencia);

    const eventosRef = collection(db, 'eventos');
    const q = query(
      eventosRef,
      where('cidade', '==', cidade),
    );

    const snapshot = await getDocs(q);
    const eventosProximos = [];

    snapshot.forEach(doc => {
      const evento = doc.data();
      const dataEvento = new Date(evento.dataEvento);

      if (dataEvento > agora && dataEvento <= dataLimite) {
        eventosProximos.push({
          id: doc.id,
          ...evento,
        });
      }
    });

    if (eventosProximos.length > 0) {
      const usuario = auth.currentUser;
      if (usuario) {
        await criarNotificacoesEventos(usuario.uid, eventosProximos);
      }
    }

    return eventosProximos;
  } catch (error) {
    console.error('Erro ao verificar eventos próximos:', error);
    return [];
  }
}

async function criarNotificacoesEventos(usuarioId, eventos) {
  try {
    const usuario = auth.currentUser;
    if (!usuario) return;

    const notificacoesRef = collection(db, 'notificacoes');

    for (const evento of eventos) {
      const q = query(
        notificacoesRef,
        where('usuarioId', '==', usuarioId),
        where('eventoId', '==', evento.id),
        where('tipo', '==', 'evento_proximo'),
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        const dataEvento = new Date(evento.dataEvento);
        const horaEvento = dataEvento.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const notificacao = {
          usuarioId,
          eventoId: evento.id,
          tipo: 'evento_proximo',
          titulo: `${evento.nome}`,
          mensagem: `Em ${evento.cidade}`,
          descricao: evento.descricao || '',
          foto: evento.foto || null,
          tipo_evento: evento.tipo,
          data: dataEvento.toLocaleDateString('pt-BR'),
          hora: horaEvento,
          cidade: evento.cidade,
          endereco: evento.endereco,
          lida: false,
          criadaEm: serverTimestamp(),
        };

        const docRef = doc(notificacoesRef);
        await setDoc(docRef, notificacao);
      }
    }
  } catch (error) {
    console.error('Erro ao criar notificações de eventos:', error);
  }
}

export async function buscarNotificacoesEventos(usuarioId) {
  try {
    const notificacoesRef = collection(db, 'notificacoes');
    const q = query(
      notificacoesRef,
      where('usuarioId', '==', usuarioId),
      where('tipo', '==', 'evento_proximo'),
    );

    const snapshot = await getDocs(q);
    const notificacoes = [];

    snapshot.forEach(doc => {
      notificacoes.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return notificacoes;
  } catch (error) {
    console.error('Erro ao buscar notificações de eventos:', error);
    return [];
  }
}

export async function marcarNotificacaoComoLida(notificacaoId) {
  try {
    const notificacaoRef = doc(db, 'notificacoes', notificacaoId);
    await updateDoc(notificacaoRef, {
      lida: true,
    });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    throw error;
  }
}

export async function buscarEventoPorId(eventoId) {
  try {
    const eventoRef = doc(db, 'eventos', eventoId);
    const eventoSnap = await getDoc(eventoRef);

    if (!eventoSnap.exists()) {
      return null;
    }

    const dataEvento = new Date(eventoSnap.data().dataEvento);
    const agora = new Date();

    return {
      id: eventoSnap.id,
      ...eventoSnap.data(),
      passado: dataEvento < agora,
    };
  } catch (error) {
    console.error('Erro ao buscar evento por ID:', error);
    return null;
  }
}

export async function salvarCidadeUsuario(usuarioId, cidade, estado) {
  try {
    const usuarioRef = doc(db, 'users', usuarioId);
    const usuarioSnap = await getDoc(usuarioRef);

    if (usuarioSnap.exists()) {
      await updateDoc(usuarioRef, {
        cidade,
        estado,
        atualizadoEm: serverTimestamp(),
      });
    } else {
      await setDoc(usuarioRef, {
        cidade,
        estado,
        atualizadoEm: serverTimestamp(),
      }, { merge: true });
    }
  } catch (error) {
    console.error('Erro ao salvar cidade do usuário:', error);
    throw error;
  }
}

export async function buscarCidadeUsuario(usuarioId) {
  try {
    const usuarioRef = doc(db, 'users', usuarioId);
    const usuarioSnap = await getDoc(usuarioRef);

    if (!usuarioSnap.exists()) {
      return null;
    }

    return {
      cidade: usuarioSnap.data().cidade,
      estado: usuarioSnap.data().estado,
    };
  } catch (error) {
    console.error('Erro ao buscar cidade do usuário:', error);
    return null;
  }
}

export async function notificarUsuariosDaCidade(evento) {
  try {
    if (!evento?.cidade || !evento?.id) return;

    const usuariosRef = collection(db, 'users');
    const q = query(usuariosRef, where('cidade', '==', evento.cidade));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    const notificacoesRef = collection(db, 'notificacoes');
    const promessas = [];

    snapshot.forEach(userDoc => {
      const usuarioId = userDoc.id;
      if (usuarioId === evento.criadorId) return;
      const dataEvento = new Date(evento.dataEvento);
      const horaEvento = dataEvento.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const notificacao = {
        usuarioId,
        eventoId: evento.id,
        tipo: 'evento_novo',
        titulo: `Novo evento em ${evento.cidade}`,
        mensagem: evento.nome,
        descricao: evento.descricao || '',
        foto: evento.foto || null,
        tipo_evento: evento.tipo,
        data: dataEvento.toLocaleDateString('pt-BR'),
        hora: horaEvento,
        cidade: evento.cidade,
        endereco: evento.endereco,
        lida: false,
        criadaEm: serverTimestamp(),
      };

      const docRef = doc(notificacoesRef);
      promessas.push(setDoc(docRef, notificacao));
    });

    await Promise.allSettled(promessas);
  } catch (error) {
    console.error('Erro ao notificar usuários da cidade:', error);
  }
}
