import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from '@react-native-firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { salvarFcmToken, removerFcmToken } from './notificacaoService';

const AuthContext = createContext(null);
const authInstance = getAuth();
const db = getFirestore();

export const getAvatarUrl = (nome = 'Jogador') =>
  `https://ui-avatars.com/api/?background=random&color=random&name=${encodeURIComponent(nome || 'Jogador')}`;

export const getAuthErrorMessage = (error) => {
  const mensagens = {
    'auth/email-already-in-use': 'Este e-mail ja esta cadastrado.',
    'auth/invalid-email': 'Informe um e-mail valido.',
    'auth/user-not-found': 'Nao encontramos uma conta com este e-mail.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente daqui a pouco.',
    'auth/network-request-failed': 'Falha de conexao. Confira sua internet.',
  };

  return mensagens[error?.code] || error?.message || 'Nao foi possivel concluir a acao.';
};

const montarPerfil = (user, overrides = {}) => {
  const nome = overrides.nome || user?.displayName || user?.email || 'Jogador';
  const photoURL = overrides.photoURL || user?.photoURL || getAvatarUrl(nome);

  return {
    uid: user.uid,
    nome,
    email: user.email || '',
    photoURL,
    notificacoesAtivas: true,
    atualizadoEm: serverTimestamp(),
  };
};

async function salvarPerfilPublico(user, overrides = {}) {
  if (!user) return;

  const perfil = montarPerfil(user, overrides);

  await setDoc(doc(collection(db, 'users'), user.uid), perfil, { merge: true });
  await setDoc(
    doc(collection(db, 'ranking'), user.uid),
    {
      uid: perfil.uid,
      nome: perfil.nome,
      photoURL: perfil.photoURL,
      atualizadoEm: serverTimestamp(),
    },
    { merge: true },
  );
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregandoUsuario, setCarregandoUsuario] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(authInstance, (user) => {
      setUsuario(user);
      setCarregandoUsuario(false);
      if (user) salvarFcmToken(user.uid);
    });
  }, []);

  const nomeUsuario = usuario?.displayName || usuario?.email || 'Jogador';
  const fotoUrl = usuario ? usuario.photoURL || getAvatarUrl(nomeUsuario) : null;

  const cadastrarConta = useCallback(async ({ nome, email, senha, photoURL }) => {
    const nomeLimpo = nome?.trim();
    const emailLimpo = email?.trim();
    const fotoLimpa = photoURL?.trim();

    if (!nomeLimpo || !emailLimpo || !senha) {
      throw new Error('Preencha nome, e-mail e senha.');
    }

    const credencial = await createUserWithEmailAndPassword(
      authInstance,
      emailLimpo,
      senha,
    );
    const fotoFinal = fotoLimpa || getAvatarUrl(nomeLimpo);

    await updateProfile(credencial.user, {
      displayName: nomeLimpo,
      photoURL: fotoFinal,
    });
    await salvarPerfilPublico(credencial.user, {
      nome: nomeLimpo,
      photoURL: fotoFinal,
    });

    salvarFcmToken(credencial.user.uid);
    setUsuario(authInstance.currentUser);
    return credencial.user;
  }, []);

  const entrarConta = useCallback(async ({ email, senha }) => {
    const emailLimpo = email?.trim();

    if (!emailLimpo || !senha) {
      throw new Error('Preencha e-mail e senha.');
    }

    const credencial = await signInWithEmailAndPassword(
      authInstance,
      emailLimpo,
      senha,
    );

    await salvarPerfilPublico(credencial.user);
    salvarFcmToken(credencial.user.uid);
    setUsuario(authInstance.currentUser);
    return credencial.user;
  }, []);

  const atualizarPerfil = useCallback(async ({ nome, photoURL }) => {
    const user = authInstance.currentUser;
    const nomeLimpo = nome?.trim();
    const fotoLimpa = photoURL?.trim();

    if (!user) throw new Error('Entre na conta para atualizar o perfil.');
    if (!nomeLimpo) throw new Error('Informe seu nome completo.');

    const fotoFinal = fotoLimpa || getAvatarUrl(nomeLimpo);

    await updateProfile(user, {
      displayName: nomeLimpo,
      photoURL: fotoFinal,
    });
    await salvarPerfilPublico(user, {
      nome: nomeLimpo,
      photoURL: fotoFinal,
    });

    setUsuario(authInstance.currentUser);
    return authInstance.currentUser;
  }, []);

  const sairConta = useCallback(async () => {
    const user = authInstance.currentUser;
    if (user) removerFcmToken(user.uid);
    await signOut(authInstance);
  }, []);

  const enviarRedefinicaoSenha = useCallback(async (email) => {
    const emailLimpo = email?.trim();
    if (!emailLimpo) throw new Error('Informe seu e-mail para redefinir a senha.');

    await sendPasswordResetEmail(authInstance, emailLimpo);
  }, []);

  const value = useMemo(
    () => ({
      usuario,
      nomeUsuario,
      fotoUrl,
      carregandoUsuario,
      cadastrarConta,
      entrarConta,
      atualizarPerfil,
      sairConta,
      enviarRedefinicaoSenha,
    }),
    [
      usuario,
      nomeUsuario,
      fotoUrl,
      carregandoUsuario,
      cadastrarConta,
      entrarConta,
      atualizarPerfil,
      sairConta,
      enviarRedefinicaoSenha,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth precisa estar dentro de AuthProvider.');
  }

  return context;
}
