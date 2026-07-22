import { useEffect } from 'react';
import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native';
import {
  getMessaging,
  requestPermission,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  onTokenRefresh,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { getFirestore, doc, setDoc } from '@react-native-firebase/firestore';

const db = getFirestore();

export async function pedirPermissaoNotificacao() {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        'android.permission.POST_NOTIFICATIONS',
      );

      if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Alert.alert(
          'Notificações desativadas',
          'Para receber novidades do TocaTimMaia, ative as notificações nas configurações.',
          [
            { text: 'Agora não', style: 'cancel' },
            { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
          ]
        );
        return false;
      }

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) return false;
    }

    const authStatus = await requestPermission(getMessaging());
    return (
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    console.error('Erro ao pedir permissão de notificação:', error);
    return false;
  }
}

export async function obterFcmToken() {
  try {
    const enabled = await pedirPermissaoNotificacao();
    if (!enabled) {
      console.log('Permissão de notificação negada');
      return null;
    }

    const token = await getToken(getMessaging());
    console.log('FCM Token obtido:', token);
    return token;
  } catch (error) {
    console.error('Erro ao obter FCM token:', error);
    return null;
  }
}

export async function salvarFcmToken(uid) {
  try {
    if (!uid) return null;

    const token = await obterFcmToken();
    if (!token) {
      console.log('Token não obtido, não será salvo');
      return null;
    }

    await setDoc(
      doc(db, 'users', uid),
      {
        fcmToken: token,
        fcmTokenAtualizadoEm: new Date().toISOString(),
        notificacoesAtivas: true,
      },
      { merge: true },
    );

    console.log('FCM Token salvo com sucesso para uid:', uid);

    const unsubscribe = onTokenRefresh(getMessaging(), async (novoToken) => {
      console.log('FCM Token renovado:', novoToken);
      await setDoc(
        doc(db, 'users', uid),
        {
          fcmToken: novoToken,
          fcmTokenAtualizadoEm: new Date().toISOString(),
        },
        { merge: true },
      );
    });

    return token;
  } catch (error) {
    console.error('Erro ao salvar FCM token:', error);
    return null;
  }
}

export async function removerFcmToken(uid) {
  try {
    if (!uid) return;
    await setDoc(
      doc(db, 'users', uid),
      {
        fcmToken: null,
        fcmTokenAtualizadoEm: new Date().toISOString(),
      },
      { merge: true },
    );
    console.log('FCM Token removido para uid:', uid);
  } catch (error) {
    console.error('Erro ao remover FCM token:', error);
  }
}

export function configurarForegroundHandler(onNotification) {
  return onMessage(getMessaging(), async (remoteMessage) => {
    console.log('Notificação recebida em foreground:', remoteMessage);
    onNotification?.(remoteMessage);
  });
}

export function usePermissaoNotificacao(uid) {
  useEffect(() => {
    if (!uid) return;

    salvarFcmToken(uid).catch(console.error);
  }, [uid]);
}

function extrairEventoId(msg) {
  const data = msg?.data || {};
  return data?.eventoId || null;
}

export async function handleNotificationOpenedApp(navigationRef) {
  const initial = await getInitialNotification(getMessaging());
  if (initial && navigationRef?.current) {
    console.log('App aberto por notificação (fechado):', initial);
    const eventoId = extrairEventoId(initial);
    setTimeout(() => {
      navigationRef.current?.navigate('Eventos', eventoId ? { eventoId } : undefined);
    }, 500);
  }

  return onNotificationOpenedApp(getMessaging(), (remoteMessage) => {
    console.log('App aberto por notificação (background):', remoteMessage);
    if (remoteMessage && navigationRef?.current) {
      const eventoId = extrairEventoId(remoteMessage);
      navigationRef.current?.navigate('Eventos', eventoId ? { eventoId } : undefined);
    }
  });
}