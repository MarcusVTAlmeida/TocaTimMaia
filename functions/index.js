const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

admin.initializeApp();

exports.enviarNotificacaoPush = functions.firestore
  .document('notificacoes/{docId}')
  .onCreate(async (snap) => {
    const notificacao = snap.data();
    if (!notificacao) return null;

    const {
      usuarioId, titulo, mensagem, eventoId,
      foto, descricao, tipo_evento, data, hora, cidade, endereco,
    } = notificacao;

    if (!usuarioId || !titulo) return null;

    try {
      const userDoc = await admin.firestore().doc(`users/${usuarioId}`).get();
      if (!userDoc.exists) return null;

      const userData = userDoc.data();

      if (!userData || userData.notificacoesAtivas === false) return null;

      const fcmToken = userData.fcmToken;
      if (!fcmToken) {
        console.log(`Usuário ${usuarioId} sem FCM token — push não enviado`);
        return null;
      }

      const corpoNotificacao = mensagem || '';
      const corpoCompleto = descricao
        ? `${corpoNotificacao}\n${descricao}`
        : corpoNotificacao;

      const message = {
        token: fcmToken,
        notification: {
          title: titulo,
          body: corpoCompleto,
        },
        android: {
          priority: 'high',
          notification: {
            icon: 'ic_notification',
            channelId: 'eventos2',
            sound: 'notificacao_evento',
            color: '#FFFFFF',
            ...(eventoId && { tag: `evento_${eventoId}` }),
            ...(foto && { image: foto }),
          },
        },
        data: {
          eventoId: eventoId || '',
          tipo: notificacao.tipo || 'evento_notificacao',
          titulo: titulo,
          mensagem: corpoNotificacao,
          descricao: descricao || '',
          foto: foto || '',
          tipo_evento: tipo_evento || '',
          data: data || '',
          hora: hora || '',
          cidade: cidade || '',
          endereco: endereco || '',
          click_action: 'OPEN_EVENT',
        },
      };

      await admin.messaging().send(message);
      console.log(`Push enviado para usuário ${usuarioId}`);
      return null;
    } catch (error) {
      if (error.code === 'messaging/registration-token-not-registered') {
        await admin.firestore().doc(`users/${usuarioId}`).update({
          fcmToken: null,
          fcmTokenAtualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
        });
        return null;
      }
      console.error('Erro ao enviar push:', error);
      return null;
    }
  });

exports.notificarNovoEvento = functions.firestore
  .document('eventos/{eventoId}')
  .onCreate(async (snap) => {
    const evento = snap.data();
    if (!evento?.cidade || !evento?.criadorId) return null;

    try {
      const usersSnapshot = await admin
        .firestore()
        .collection('users')
        .where('cidade', '==', evento.cidade)
        .get();

      if (usersSnapshot.empty) return null;

      const notificacoesRef = admin.firestore().collection('notificacoes');
      const dataEvento = new Date(evento.dataEvento);
      const horaEvento = dataEvento.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const batch = admin.firestore().batch();

      usersSnapshot.forEach((userDoc) => {
        if (userDoc.id === evento.criadorId) return;

        const notificacao = {
          usuarioId: userDoc.id,
          eventoId: snap.id,
          tipo: 'evento_novo',
          titulo: `Novo evento em ${evento.cidade}! 🎷`,
          mensagem: evento.nome,
          descricao: evento.descricao || '',
          foto: evento.foto || null,
          tipo_evento: evento.tipo,
          data: dataEvento.toLocaleDateString('pt-BR'),
          hora: horaEvento,
          cidade: evento.cidade,
          endereco: evento.endereco || '',
          lida: false,
          criadaEm: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = notificacoesRef.doc();
        batch.set(docRef, notificacao);
      });

      await batch.commit();
      console.log(`Notificações de novo evento criadas para cidade: ${evento.cidade}`);
      return null;
    } catch (error) {
      console.error('Erro ao notificar novo evento:', error);
      return null;
    }
  });

exports.verificarEventosProximosAgendado = functions.pubsub
  .schedule('every day 08:00')
  .timeZone('America/Sao_Paulo')
  .onRun(async () => {
    try {
      const usersSnapshot = await admin.firestore().collection('users').get();
      if (usersSnapshot.empty) return null;

      const agora = new Date();
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() + 7);

      const notificacoesRef = admin.firestore().collection('notificacoes');

      async function commitBatch(operacoes) {
        const LIMITE = 500;
        for (let i = 0; i < operacoes.length; i += LIMITE) {
          const batch = admin.firestore().batch();
          operacoes.slice(i, i + LIMITE).forEach(({ ref, data }) => {
            batch.set(ref, data);
          });
          await batch.commit();
        }
      }

      const operacoes = [];

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        if (!userData?.cidade) continue;

        const eventosSnapshot = await admin
          .firestore()
          .collection('eventos')
          .where('cidade', '==', userData.cidade)
          .get();

        for (const eventoDoc of eventosSnapshot.docs) {
          const evento = eventoDoc.data();
          const dataEvento = new Date(evento.dataEvento);

          if (dataEvento <= agora || dataEvento > dataLimite) continue;

          const notifQuery = await notificacoesRef
            .where('usuarioId', '==', userDoc.id)
            .where('eventoId', '==', eventoDoc.id)
            .where('tipo', '==', 'evento_proximo')
            .get();

          if (notifQuery.empty) {
            const horaEvento = dataEvento.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            });

            operacoes.push({
              ref: notificacoesRef.doc(),
              data: {
                usuarioId: userDoc.id,
                eventoId: eventoDoc.id,
                tipo: 'evento_proximo',
                titulo: `${evento.nome} está chegando! 📅`,
                mensagem: `Em ${evento.cidade}`,
                descricao: evento.descricao || '',
                foto: evento.foto || null,
                tipo_evento: evento.tipo,
                data: dataEvento.toLocaleDateString('pt-BR'),
                hora: horaEvento,
                cidade: evento.cidade,
                endereco: evento.endereco || '',
                lida: false,
                criadaEm: admin.firestore.FieldValue.serverTimestamp(),
              },
            });
          }
        }
      }

      await commitBatch(operacoes);
      console.log(`Verificação diária concluída. ${operacoes.length} notificações criadas.`);
      return null;
    } catch (error) {
      console.error('Erro ao verificar eventos próximos:', error);
      return null;
    }
  });