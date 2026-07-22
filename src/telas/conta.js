import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Image, FlatList,
  KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Modal, Switch, Linking,
  PermissionsAndroid,
} from 'react-native';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
  deleteUser,
  reload,
} from '@react-native-firebase/auth';
import { getStorage, ref, getDownloadURL } from '@react-native-firebase/storage';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Feather';
import { getAuthErrorMessage } from '../componentes/AuthContext';
import { salvarFcmToken } from '../componentes/notificacaoService';
import { useAvatar } from '../componentes/AvatarContext';
import {
  getFirestore, collection, doc,
  getDoc, setDoc, serverTimestamp,
  deleteDoc,
  getDocs,
  query,
  where,      
} from '@react-native-firebase/firestore';
import { verificarEventosProximos } from '../componentes/eventosService';
import { states, cities } from 'estados-cidades';

const db = getFirestore();
const ESTADOS_LISTA = states();
const auth = getAuth();
const storageInstance = getStorage();

const GOLD = '#C9A84C';
const BG = '#0a0a0a';
const CARD = '#141414';
const BORDER = '#2a2a2a';
const MUTED = '#555555';

const getErroMensagem = (error) => {
  const mensagens = {
    'auth/email-already-in-use':   'Este e-mail já está cadastrado. Tente fazer login.',
    'auth/invalid-email':          'O e-mail informado é inválido. Verifique e tente novamente.',
    'auth/user-not-found':         'Nenhuma conta encontrada com este e-mail.',
    'auth/wrong-password':         'Senha incorreta. Verifique e tente novamente.',
    'auth/invalid-credential':     'E-mail ou senha incorretos. Verifique e tente novamente.',
    'auth/weak-password':          'A senha precisa ter pelo menos 6 caracteres.',
    'auth/too-many-requests':      'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    'auth/network-request-failed': 'Sem conexão. Verifique sua internet e tente novamente.',
    'auth/user-disabled':          'Esta conta foi desativada. Entre em contato com o suporte.',
    'auth/operation-not-allowed':  'Operação não permitida. Contate o suporte.',
  };
  return mensagens[error?.code] || 'Algo deu errado. Tente novamente.';
};

const emailValido = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

const FormButton = ({ icon, label, onPress, loading, style, textStyle }) => (
  <TouchableOpacity
    style={[styles.botao, styles.botaoPrimario, style]}
    onPress={onPress}
    disabled={loading}
  >
    {loading ? (
      <ActivityIndicator color={BG} />
    ) : (
      <>
        <Icon name={icon} size={18} color={BG} />
        <Text style={[styles.botaoTexto, styles.botaoPrimarioTexto, textStyle]}>
          {label}
        </Text>
      </>
    )}
  </TouchableOpacity>
);

const generateDefaultAvatar = (name) => {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : 'U';
  return `https://ui-avatars.com/api/?background=random&color=random&name=${initials}&size=128`;
};

const sincronizarPerfilRanking = async ({ uid, nome, photoURL }) => {
  if (!uid) return;
  await setDoc(
    doc(collection(db, 'ranking'), uid),
    {
      uid,
      nome: nome || 'Jogador',
      photoURL: photoURL || generateDefaultAvatar(nome || 'Jogador'),
      atualizadoEm: serverTimestamp(),
    },
    { merge: true },
  );
};

function ErroInline({ mensagem }) {
  if (!mensagem) return null;
  return (
    <View style={styles.erroInline}>
      <Icon name="alert-circle" size={14} color="#ff6b6b" />
      <Text style={styles.erroInlineTexto}>{mensagem}</Text>
    </View>
  );
}

export default function AuthScreen({ navigation }) {
  const [modo, setModo] = useState('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [avatarUri, setAvatarUri] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);

  const [erroEmail, setErroEmail] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  const [erroNome, setErroNome] = useState('');
  const [erroGeral, setErroGeral] = useState('');

  const [modalResetSenhaVisivel, setModalResetSenhaVisivel] = useState(false);
  const [emailResetSenha, setEmailResetSenha] = useState('');
  const [loadingResetSenha, setLoadingResetSenha] = useState(false);
  const [erroResetEmail, setErroResetEmail] = useState('');
  const [sucessoReset, setSucessoReset] = useState(false);

  const [usuario, setUsuario] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [novoNome, setNovoNome] = useState('');
  const [loadingNome, setLoadingNome] = useState(false);
  const [loadingSenha, setLoadingSenha] = useState(false);
  const [loadingFoto, setLoadingFoto] = useState(false);
  const { avatarFotoUrl } = useAvatar();

  const fotoPerfil =
    usuario?.photoURL && usuario.photoURL.trim() !== ''
      ? usuario.photoURL
      : avatarFotoUrl ||
        `https://ui-avatars.com/api/?background=random&color=random&name=${encodeURIComponent(
          usuario?.displayName || 'U'
        )}`;

  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cidadesDisponiveis, setCidadesDisponiveis] = useState([]);
  const [cidadesFiltradas, setCidadesFiltradas] = useState([]);
  const [buscaCidade, setBuscaCidade] = useState('');
  const [modalDropdownEstado, setModalDropdownEstado] = useState(false);
  const [modalDropdownCidade, setModalDropdownCidade] = useState(false);
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true);
  const [salvandoCidade, setSalvandoCidade] = useState(false);
  const [tooltipVisivel, setTooltipVisivel] = useState(false);
  const [excluindoConta, setExcluindoConta] = useState(false);
  const [loadingNotif, setLoadingNotif] = useState(false);

  useEffect(() => {
    setErroEmail('');
    setErroSenha('');
    setErroNome('');
    setErroGeral('');
    setEmail('');
    setSenha('');
    setNome('');
  }, [modo]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await reload(auth.currentUser);
        const atualizado = auth.currentUser;
        setUsuario(atualizado);
        if (atualizado?.displayName) {
          setNovoNome(atualizado.displayName);
        }
      } else {
        setUsuario(null);
      }
      setLoadingAuth(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!usuario?.uid) return;
    async function carregarPreferencias() {
      try {
        const snap = await getDoc(doc(collection(db, 'users'), usuario.uid));
        if (snap.exists()) {
          const dados = snap.data();
          if (dados?.estado) setEstado(dados.estado);
          if (dados?.cidade) setCidade(dados.cidade);
          setNotificacoesAtivas(dados?.notificacoesAtivas ?? true);
        }
      } catch (e) {
        console.warn('Erro ao carregar preferências:', e);
      }
    }
    carregarPreferencias();
  }, [usuario?.uid]);

  useEffect(() => {
    if (estado) {
      const cidadesDoEstado = cities(estado);
      setCidadesDisponiveis(cidadesDoEstado || []);
      setCidadesFiltradas(cidadesDoEstado || []);
      setBuscaCidade('');
    } else {
      setCidadesDisponiveis([]);
      setCidadesFiltradas([]);
    }
  }, [estado]);

  useEffect(() => {
    if (buscaCidade.trim()) {
      const filtradas = cidadesDisponiveis.filter(c =>
        c.toLowerCase().includes(buscaCidade.toLowerCase())
      );
      setCidadesFiltradas(filtradas);
    } else {
      setCidadesFiltradas(cidadesDisponiveis);
    }
  }, [buscaCidade, cidadesDisponiveis]);

  const handleLogin = async () => {
    setErroEmail('');
    setErroSenha('');
    setErroGeral('');

    let temErro = false;

    if (!email.trim()) {
      setErroEmail('Informe seu e-mail.');
      temErro = true;
    } else if (!emailValido(email)) {
      setErroEmail('E-mail inválido. Verifique e tente novamente.');
      temErro = true;
    }

    if (!senha.trim()) {
      setErroSenha('Informe sua senha.');
      temErro = true;
    }

    if (temErro) return;

    setSalvando(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), senha);
    } catch (error) {
      if (
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        setErroSenha('E-mail ou senha incorretos. Verifique e tente novamente.');
      } else if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/invalid-email'
      ) {
        setErroEmail(getErroMensagem(error));
      } else {
        setErroGeral(getErroMensagem(error));
      }
    } finally {
      setSalvando(false);
    }
  };

  const handleCadastro = async () => {
    setErroEmail('');
    setErroSenha('');
    setErroNome('');
    setErroGeral('');

    let temErro = false;

    if (!nome.trim()) {
      setErroNome('Informe seu nome.');
      temErro = true;
    }

    if (!email.trim()) {
      setErroEmail('Informe seu e-mail.');
      temErro = true;
    } else if (!emailValido(email)) {
      setErroEmail('E-mail inválido. Verifique e tente novamente.');
      temErro = true;
    }

    if (!senha.trim()) {
      setErroSenha('Informe sua senha.');
      temErro = true;
    } else if (senha.length < 6) {
      setErroSenha('A senha precisa ter pelo menos 6 caracteres.');
      temErro = true;
    }

    if (temErro) return;

    setSalvando(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), senha);
      const user = userCredential.user;

      let finalPhotoURL = avatarUrl;
      if (!finalPhotoURL && nome) {
        finalPhotoURL = generateDefaultAvatar(nome);
      }

      await updateProfile(user, {
        displayName: nome.trim(),
        photoURL: finalPhotoURL,
      });

      await reload(auth.currentUser);
      const usuarioAtualizado = auth.currentUser;

      setUsuario({
        ...usuarioAtualizado,
        displayName: nome.trim(),
        photoURL: finalPhotoURL,
      });

      setNovoNome(nome.trim());

      setErroGeral('');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setErroEmail('Este e-mail já está cadastrado. Tente fazer login.');
      } else if (error.code === 'auth/weak-password') {
        setErroSenha('A senha precisa ter pelo menos 6 caracteres.');
      } else if (error.code === 'auth/invalid-email') {
        setErroEmail('O e-mail informado é inválido.');
      } else {
        setErroGeral(getErroMensagem(error));
      }
    } finally {
      setSalvando(false);
    }
  };

  const handleSendPasswordReset = async () => {
    setErroResetEmail('');
    setSucessoReset(false);

    if (!emailResetSenha.trim()) {
      setErroResetEmail('Informe seu e-mail.');
      return;
    }

    if (!emailValido(emailResetSenha)) {
      setErroResetEmail('E-mail inválido. Verifique e tente novamente.');
      return;
    }

    setLoadingResetSenha(true);
    try {
      await sendPasswordResetEmail(auth, emailResetSenha.trim().toLowerCase());
      setSucessoReset(true);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        setErroResetEmail('Nenhuma conta encontrada com este e-mail.');
      } else if (error.code === 'auth/invalid-email') {
        setErroResetEmail('E-mail inválido. Verifique e tente novamente.');
      } else {
        setErroResetEmail('Não foi possível enviar o e-mail. Tente novamente.');
      }
    } finally {
      setLoadingResetSenha(false);
    }
  };

const handleExcluirConta = () => {
  Alert.alert(
    'Excluir conta permanentemente',
    'Esta ação não pode ser desfeita. Todos os seus dados, pontuações e histórico serão removidos para sempre.',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir minha conta',
        style: 'destructive',
        onPress: () => confirmarExclusao(),
      },
    ]
  );
};

const confirmarExclusao = () => {
  Alert.alert(
    'Tem certeza absoluta?',
    `A conta de "${usuario?.displayName || usuario?.email}" será excluída permanentemente junto com todos os seus dados.`,
    [
      { text: 'Não, manter conta', style: 'cancel' },
      {
        text: 'Sim, excluir tudo',
        style: 'destructive',
        onPress: () => executarExclusaoConta(),
      },
    ]
  );
};

const executarExclusaoConta = async () => {
  setExcluindoConta(true);
  try {
    const uid = usuario?.uid;
    if (!uid) throw new Error('Usuário não identificado');

    const colecoes = ['users', 'ranking'];
    await Promise.allSettled(
      colecoes.map(colecao =>
        deleteDoc(doc(db, colecao, uid))
      )
    );

    try {
      const notifSnap = await getDocs(
        query(
          collection(db, 'notificacoes'),
          where('usuarioId', '==', uid)
        )
      );
      await Promise.allSettled(
        notifSnap.docs.map(d => deleteDoc(d.ref))
      );
    } catch (e) {
      console.warn('Erro ao deletar notificações:', e);
    }

    await deleteUser(auth.currentUser);
  } catch (error) {
    setExcluindoConta(false);

    if (error.code === 'auth/requires-recent-login') {
      Alert.alert(
        'Confirmação necessária',
        'Por segurança, faça login novamente antes de excluir sua conta.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Fazer login novamente',
            onPress: async () => {
              await signOut(auth);
            },
          },
        ]
      );
      return;
    }

    Alert.alert('Erro', 'Não foi possível excluir a conta. Tente novamente.');
  }
};

  const handleChangePassword = async () => {
    if (!usuario?.email) return;
    setLoadingSenha(true);
    try {
      await sendPasswordResetEmail(auth, usuario.email.trim().toLowerCase());
      setErroGeral('');
      setErroGeral('✅ E-mail de redefinição enviado para ' + usuario.email);
    } catch (error) {
      setErroGeral(getErroMensagem(error));
    } finally {
      setLoadingSenha(false);
    }
  };

  const handleUpdateName = async () => {
    if (!novoNome.trim()) return;
    try {
      setLoadingNome(true);
      const fotoAtual = usuario?.photoURL || null;
      await updateProfile(auth.currentUser, {
        displayName: novoNome.trim(),
        photoURL: fotoAtual,
      });
      await reload(auth.currentUser);
      const atualizado = auth.currentUser;
      setUsuario({
        uid: atualizado.uid,
        email: atualizado.email,
        displayName: novoNome.trim(),
        photoURL: atualizado.photoURL || fotoAtual,
      });
      await sincronizarPerfilRanking({
        uid: atualizado.uid,
        nome: novoNome.trim(),
        photoURL: atualizado.photoURL || fotoAtual,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingNome(false);
    }
  };

  const handleSalvarCidade = async () => {
    if (!cidade.trim()) return;
    setSalvandoCidade(true);
    try {
      await setDoc(
        doc(collection(db, 'users'), usuario.uid),
        { cidade: cidade.trim(), estado, atualizadoEm: serverTimestamp() },
        { merge: true }
      );
      await verificarEventosProximos(cidade.trim());
    } catch (e) {
      console.warn('Erro ao salvar cidade:', e);
    } finally {
      setSalvandoCidade(false);
    }
  };

  const handleToggleNotificacoes = async (valor) => {
    setNotificacoesAtivas(valor);
    setLoadingNotif(true);
    try {
      await setDoc(
        doc(collection(db, 'users'), usuario.uid),
        { notificacoesAtivas: valor, atualizadoEm: serverTimestamp() },
        { merge: true }
      );
      if (valor && Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          'android.permission.POST_NOTIFICATIONS',
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setNotificacoesAtivas(false);
          return;
        }
      }
      if (valor) {
        await salvarFcmToken(usuario.uid);
      }
    } catch (e) {
      setNotificacoesAtivas(!valor);
    } finally {
      setLoadingNotif(false);
    }
  };

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.7,
      maxWidth: 500,
      maxHeight: 500,
    });

    if (result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setAvatarUri(uri);
      setLoadingFoto(true);
      await uploadImage(uri);
    }
  };

  const uploadImage = async (uri) => {
    if (!uri) return;
    setLoadingFoto(true);
    try {
      const uploadUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
      const filename = `avatars/${auth.currentUser.uid}.jpg`;
      const storageRef = ref(storageInstance, filename);
      await storageRef.putFile(uploadUri);
      const downloadURL = await getDownloadURL(storageRef);
      const nomeAtual = auth.currentUser.displayName;
      await updateProfile(auth.currentUser, {
        photoURL: downloadURL,
        displayName: nomeAtual,
      });
      await reload(auth.currentUser);
      const atualizado = auth.currentUser;
      setUsuario({
        uid: atualizado.uid,
        email: atualizado.email,
        displayName: atualizado.displayName || nomeAtual,
        photoURL: downloadURL,
      });
      await sincronizarPerfilRanking({
        uid: atualizado.uid,
        nome: atualizado.displayName || nomeAtual,
        photoURL: downloadURL,
      });
      setAvatarUrl(downloadURL);
    } catch (error) {
      console.error('Erro no upload:', error);
    } finally {
      setLoadingFoto(false);
    }
  };

  if (loadingAuth) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centralizado}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      </SafeAreaView>
    );
  }

  if (usuario) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.profileScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
            {loadingFoto ? (
              <View style={[styles.profileAvatar, styles.avatarLoading]}>
                <ActivityIndicator color={GOLD} />
              </View>
            ) : (
              <Image source={{ uri: fotoPerfil }} style={styles.profileAvatar} />
            )}
            <View style={styles.editAvatarButton}>
              <Icon name="camera" size={16} color={BG} />
            </View>
          </TouchableOpacity>

          <Text style={styles.profileName}>{usuario.displayName || 'Usuário'}</Text>
          <Text style={styles.profileEmail}>{usuario.email}</Text>

          {erroGeral ? (
            <View style={[
              styles.erroInline,
              erroGeral.startsWith('✅') && styles.sucessoInline,
              { marginBottom: 8, paddingHorizontal: 12 }
            ]}>
              <Icon
                name={erroGeral.startsWith('✅') ? 'check-circle' : 'alert-circle'}
                size={14}
                color={erroGeral.startsWith('✅') ? '#4CAF50' : '#ff6b6b'}
              />
              <Text style={[
                styles.erroInlineTexto,
                erroGeral.startsWith('✅') && { color: '#4CAF50' }
              ]}>
                {erroGeral.replace('✅ ', '')}
              </Text>
            </View>
          ) : null}

            <View style={styles.profileCard}>

            <View style={styles.profileEditBox}>
              <Text style={styles.editLabel}>Seu nome</Text>
              <View style={styles.editInputContainer}>
                <Icon name="user" size={18} color={GOLD} />
                <TextInput
                  style={styles.editInput}
                  value={novoNome}
                  onChangeText={setNovoNome}
                  placeholder="Digite seu nome"
                  placeholderTextColor="#777"
                />
              </View>
              <TouchableOpacity
                style={styles.saveNameButton}
                onPress={handleUpdateName}
                disabled={loadingNome}
              >
                {loadingNome ? <ActivityIndicator color={BG} /> : (
                  <>
                    <Icon name="save" size={18} color={BG} />
                    <Text style={styles.saveNameText}>Salvar nome</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.profileEditBox}>
              <View style={styles.editLabelRow}>
                <Text style={styles.editLabel}>Sua cidade</Text>
                <TouchableOpacity
                  onPress={() => setTooltipVisivel(v => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="help-circle" size={16} color={MUTED} />
                </TouchableOpacity>
              </View>

              {tooltipVisivel && (
                <View style={styles.tooltip}>
                  <Icon name="bell" size={13} color={GOLD} />
                  <Text style={styles.tooltipTexto}>
                    Com sua cidade cadastrada, o app avisa quando houver um evento de fãs perto de você!
                  </Text>
                  <TouchableOpacity onPress={() => setTooltipVisivel(false)}>
                    <Icon name="x" size={13} color={MUTED} />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.grupoInput}>
                <TouchableOpacity
                  style={[styles.editInput, styles.dropdownTrigger]}
                  onPress={() => setModalDropdownEstado(true)}
                >
                  <Icon name="map-pin" size={18} color={GOLD} />
                  <Text style={[styles.dropdownTexto, estado ? { color: '#fff' } : { color: '#666' }]}>
                    {estado || 'Selecione o estado'}
                  </Text>
                  <Icon name="chevron-down" size={18} color={GOLD} />
                </TouchableOpacity>
              </View>

              <View style={styles.grupoInput}>
                <TouchableOpacity
                  style={[styles.editInput, styles.dropdownTrigger]}
                  onPress={() => {
                    if (estado) {
                      setModalDropdownCidade(true);
                    }
                  }}
                >
                  <Icon name="map-pin" size={18} color={GOLD} />
                  <Text style={[styles.dropdownTexto, cidade ? { color: '#fff' } : { color: '#666' }]}>
                    {cidade || (estado ? 'Selecione a cidade' : 'Selecione o estado primeiro')}
                  </Text>
                  <Icon name="chevron-down" size={18} color={GOLD} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.saveNameButton}
                onPress={handleSalvarCidade}
                disabled={salvandoCidade}
              >
                {salvandoCidade ? <ActivityIndicator color={BG} /> : (
                  <>
                    <Icon name="save" size={18} color={BG} />
                    <Text style={styles.saveNameText}>Salvar cidade</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <Modal
              visible={modalDropdownEstado}
              animationType="fade"
              transparent={true}
              onRequestClose={() => setModalDropdownEstado(false)}
            >
              <TouchableOpacity
                style={styles.overlayModal}
                activeOpacity={1}
                onPress={() => setModalDropdownEstado(false)}
              >
                <View style={styles.dropdownModalContent}>
                  <FlatList
                    data={ESTADOS_LISTA}
                    keyExtractor={item => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.dropdownItem, estado === item && styles.dropdownItemAtivo]}
                        onPress={() => {
                          setEstado(item);
                          setCidade('');
                          setModalDropdownEstado(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemTexto, estado === item && styles.dropdownItemTextoAtivo]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    )}
                    scrollEnabled
                    nestedScrollEnabled
                  />
                </View>
              </TouchableOpacity>
            </Modal>

            <Modal
              visible={modalDropdownCidade}
              animationType="fade"
              transparent={true}
              onRequestClose={() => setModalDropdownCidade(false)}
            >
              <TouchableOpacity
                style={styles.overlayModal}
                activeOpacity={1}
                onPress={() => setModalDropdownCidade(false)}
              >
                <View style={styles.dropdownModalContent}>
                  <View style={styles.dropdownSearchContainer}>
                    <Icon name="search" size={16} color="#666" />
                    <TextInput
                      style={styles.dropdownSearchInput}
                      placeholder="Digite a cidade..."
                      placeholderTextColor="#666"
                      value={buscaCidade}
                      onChangeText={setBuscaCidade}
                      autoFocus
                    />
                    {buscaCidade ? (
                      <TouchableOpacity onPress={() => setBuscaCidade('')}>
                        <Icon name="x" size={16} color="#666" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <FlatList
                    data={cidadesFiltradas}
                    keyExtractor={item => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.dropdownItem, cidade === item && styles.dropdownItemAtivo]}
                        onPress={() => {
                          setCidade(item);
                          setModalDropdownCidade(false);
                          setBuscaCidade('');
                        }}
                      >
                        <Text style={[styles.dropdownItemTexto, cidade === item && styles.dropdownItemTextoAtivo]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    )}
                    scrollEnabled
                    nestedScrollEnabled
                  />
                </View>
              </TouchableOpacity>
            </Modal>

            <View style={styles.notifRow}>
              <View style={styles.notifInfo}>
                <Icon name="bell" size={18} color={notificacoesAtivas ? GOLD : MUTED} />
                <View style={styles.notifTextos}>
                  <Text style={styles.notifTitulo}>Notificações de eventos</Text>
                  <Text style={styles.notifSub}>
                    {notificacoesAtivas
                      ? 'Ativadas · Você será avisado de eventos próximos'
                      : 'Desativadas'}
                  </Text>
                </View>
              </View>
              {loadingNotif
                ? <ActivityIndicator size="small" color={GOLD} />
                : <Switch
                    value={notificacoesAtivas}
                    onValueChange={handleToggleNotificacoes}
                    trackColor={{ false: '#333', true: GOLD + '66' }}
                    thumbColor={notificacoesAtivas ? GOLD : '#555'}
                  />
              }
            </View>

            <TouchableOpacity
              style={styles.profileOption}
              onPress={() => navigation?.navigate?.('Avatar')}
            >
              <Icon name="user" size={20} color={GOLD} />
              <Text style={styles.profileOptionText}>Personalizar Avatar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileOption}
              onPress={handleChangePassword}
              disabled={loadingSenha}
            >
              {loadingSenha
                ? <ActivityIndicator color={GOLD} />
                : <>
                    <Icon name="lock" size={20} color={GOLD} />
                    <Text style={styles.profileOptionText}>Alterar senha</Text>
                  </>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={async () => { await signOut(auth); }}
            >
              <Icon name="log-out" size={20} color="#fff" />
              <Text style={styles.logoutText}>Sair da conta</Text>
            </TouchableOpacity>
<TouchableOpacity
  style={[
    styles.logoutButton,
    styles.excluirContaButton,
    excluindoConta && { opacity: 0.6 },
  ]}
  onPress={handleExcluirConta}
  disabled={excluindoConta}
>
  {excluindoConta ? (
    <ActivityIndicator color="#fff" />
  ) : (
    <>
      <Icon name="trash-2" size={20} color="#fff" />
      <Text style={styles.logoutText}>Excluir conta permanentemente</Text>
    </>
  )}
</TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.authHeader}>
            <Text style={styles.titulo}>Toca Tim Maia Quiz</Text>
            <Text style={styles.subtitulo}>
              {modo === 'login'
                ? 'Entre para continuar jogando e ver seu ranking!'
                : 'Crie sua conta para começar a jogar!'}
            </Text>
          </View>

          {modo === 'cadastro' && (
            <View style={styles.profileHeader}>
              <TouchableOpacity onPress={pickImage}>
                <Image
                  source={avatarUri ? { uri: avatarUri } : require('../../assets/icon.png')}
                  style={styles.avatarPreview}
                />
                <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: GOLD, borderRadius: 20, padding: 6 }}>
                  <Icon name="camera" size={18} color={BG} />
                </View>
              </TouchableOpacity>
              <Text style={styles.subtitulo}>Toque para escolher uma foto</Text>
            </View>
          )}

          <View style={styles.card}>
            {modo === 'cadastro' && (
              <>
                <TextInput
                  style={[styles.input, erroNome ? styles.inputErro : null]}
                  placeholder="Seu nome"
                  placeholderTextColor="#666"
                  value={nome}
                  onChangeText={(v) => { setNome(v); setErroNome(''); }}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                <ErroInline mensagem={erroNome} />
              </>
            )}

            <TextInput
              style={[styles.input, erroEmail ? styles.inputErro : null]}
              placeholder="E-mail"
              placeholderTextColor="#666"
              value={email}
              onChangeText={(v) => { setEmail(v); setErroEmail(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <ErroInline mensagem={erroEmail} />

            <TextInput
              style={[styles.input, erroSenha ? styles.inputErro : null]}
              placeholder="Senha"
              placeholderTextColor="#666"
              value={senha}
              onChangeText={(v) => { setSenha(v); setErroSenha(''); }}
              secureTextEntry
            />
            <ErroInline mensagem={erroSenha} />

            <ErroInline mensagem={erroGeral} />

            {modo === 'login' ? (
              <>
                <FormButton
                  icon="log-in"
                  label="Entrar"
                  onPress={handleLogin}
                  loading={salvando}
                />
                <TouchableOpacity
                  style={styles.linkBotao}
                  onPress={() => {
                    setModalResetSenhaVisivel(true);
                    setErroResetEmail('');
                    setSucessoReset(false);
                    setEmailResetSenha('');
                  }}
                  disabled={salvando}
                >
                  <Text style={styles.linkTexto}>Esqueci minha senha</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.linkBotao}
                  onPress={() => setModo('cadastro')}
                  disabled={salvando}
                >
                  <Text style={styles.linkTexto}>Não tenho conta ainda</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <FormButton
                  icon="user-plus"
                  label="Criar conta"
                  onPress={handleCadastro}
                  loading={salvando}
                />
                <TouchableOpacity
                  style={styles.linkBotao}
                  onPress={() => setModo('login')}
                  disabled={salvando}
                >
                  <Text style={styles.linkTexto}>Já tenho uma conta</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalResetSenhaVisivel}
        onRequestClose={() => setModalResetSenhaVisivel(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalCard}>

              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => {
                  setModalResetSenhaVisivel(false);
                  setEmailResetSenha('');
                  setErroResetEmail('');
                  setSucessoReset(false);
                }}
              >
                <Icon name="x" size={20} color="#999" />
              </TouchableOpacity>

              <View style={styles.modalIconBox}>
                <Icon name="lock" size={34} color={BG} />
              </View>

              <Text style={styles.modalTitulo}>Recuperar senha</Text>

              {sucessoReset ? (
                <View style={[styles.erroInline, styles.sucessoInline, { marginBottom: 16 }]}>
                  <Icon name="check-circle" size={14} color="#4CAF50" />
                  <Text style={[styles.erroInlineTexto, { color: '#4CAF50' }]}>
                    E-mail enviado! Verifique sua caixa de entrada.
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.modalSubtitulo}>
                    Digite seu e-mail para receber o link de redefinição de senha.
                  </Text>

                  <View style={[
                    styles.inputWrapper,
                    erroResetEmail ? { borderColor: '#ff6b6b' } : null
                  ]}>
                    <Icon name="mail" size={18} color="#777" style={{ marginRight: 10 }} />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Seu e-mail"
                      placeholderTextColor="#666"
                      value={emailResetSenha}
                      onChangeText={(v) => { setEmailResetSenha(v); setErroResetEmail(''); }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <ErroInline mensagem={erroResetEmail} />

                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={handleSendPasswordReset}
                    disabled={loadingResetSenha}
                    activeOpacity={0.85}
                  >
                    {loadingResetSenha ? (
                      <ActivityIndicator color={BG} />
                    ) : (
                      <>
                        <Icon name="send" size={18} color={BG} />
                        <Text style={styles.modalButtonText}>Enviar link</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalResetSenhaVisivel(false);
                  setEmailResetSenha('');
                  setErroResetEmail('');
                  setSucessoReset(false);
                }}
                disabled={loadingResetSenha}
              >
                <Text style={styles.cancelButtonText}>
                  {sucessoReset ? 'Fechar' : 'Cancelar'}
                </Text>
              </TouchableOpacity>

            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  keyboard: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20, gap: 14 },
  centralizado: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG },
  authHeader: { alignItems: 'center', marginBottom: 4 },
  profileHeader: { alignItems: 'center', marginBottom: 10 },
  avatarPreview: {
    width: 92, height: 92, borderRadius: 46,
    backgroundColor: '#222', borderWidth: 2, borderColor: GOLD, marginBottom: 16,
  },
  titulo: { color: '#fff', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  subtitulo: { color: '#888', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 8 },
  card: {
    backgroundColor: CARD, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER, padding: 16, gap: 6,
  },
  input: {
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13,
    color: '#fff', fontSize: 14,
  },
  inputErro: { borderColor: '#ff6b6b' },
  erroInline: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,107,107,0.1)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  erroInlineTexto: { color: '#ff6b6b', fontSize: 12, flex: 1 },
  sucessoInline: { backgroundColor: 'rgba(76,175,80,0.1)' },
  botao: {
    minHeight: 48, borderRadius: 10, alignItems: 'center',
    justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 16,
  },
  excluirContaButton: {
  marginTop: 4,
  backgroundColor: '#350606',
  borderWidth: 1,
  borderColor: '#8B0000',
},
  botaoPrimario: { backgroundColor: GOLD },
  botaoTexto: { fontSize: 15, fontWeight: '800' },
  botaoPrimarioTexto: { color: BG },
  linkBotao: { alignItems: 'center', paddingVertical: 8 },
  linkTexto: { color: GOLD, fontSize: 13, fontWeight: '700' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20,
  },
  modalContainer: { width: '100%', maxWidth: 420 },
  modalCard: {
    backgroundColor: '#141414', borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.22)', padding: 26,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45, shadowRadius: 20, elevation: 10,
  },
  modalClose: {
    position: 'absolute', top: 16, right: 16, zIndex: 20,
    width: 34, height: 34, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#1d1d1d',
  },
  modalIconBox: {
    width: 74, height: 74, borderRadius: 37, backgroundColor: GOLD,
    justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 22,
  },
  modalTitulo: { color: '#fff', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  modalSubtitulo: {
    color: '#8a8a8a', fontSize: 14, textAlign: 'center',
    lineHeight: 22, marginTop: 10, marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a',
    borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 14,
    paddingHorizontal: 14, height: 56, marginBottom: 8,
  },
  modalInput: { flex: 1, color: '#fff', fontSize: 15 },
  modalButton: {
    height: 54, borderRadius: 14, backgroundColor: GOLD, marginTop: 10,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    shadowColor: GOLD, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  modalButtonText: { color: BG, fontSize: 15, fontWeight: '900' },
  cancelButton: { marginTop: 16, alignItems: 'center', paddingVertical: 10 },
  cancelButtonText: { color: '#888', fontSize: 14, fontWeight: '700' },
  profileScroll: { flexGrow: 1, alignItems: 'center', padding: 24, paddingBottom: 48 },
  avatarWrapper: { position: 'relative', marginBottom: 20 },
  profileAvatar: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 3, borderColor: GOLD, marginBottom: 20,
  },
  avatarLoading: {
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a',
  },
  profileName: { color: '#fff', fontSize: 24, fontWeight: '900' },
  profileEmail: { color: '#888', fontSize: 14, marginTop: 6, marginBottom: 28 },
  profileCard: {
    width: '100%', backgroundColor: CARD, borderRadius: 18,
    borderWidth: 1, borderColor: BORDER, padding: 16, gap: 14,
  },
  profileOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#1b1b1b', borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 16,
  },
  profileOptionText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  logoutButton: {
    marginTop: 12, backgroundColor: '#8B0000', borderRadius: 14,
    height: 54, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
  },
  logoutText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  editAvatarButton: {
    position: 'absolute', bottom: 4, right: 4, width: 34, height: 34,
    borderRadius: 17, backgroundColor: GOLD, justifyContent: 'center',
    alignItems: 'center', borderWidth: 2, borderColor: BG,
  },
  profileEditBox: { backgroundColor: '#1b1b1b', borderRadius: 14, padding: 16 },
  editLabel: { color: GOLD, fontSize: 13, fontWeight: '700', marginBottom: 10 },
  editInputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#111',
    borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 12,
    paddingHorizontal: 14, height: 52,
  },
  editInput: { flex: 1, color: '#fff', marginLeft: 10, fontSize: 15 },
  saveNameButton: {
    marginTop: 14, backgroundColor: GOLD, height: 50, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 10,
  },
  saveNameText: { color: BG, fontSize: 15, fontWeight: '900' },
  editLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  tooltip: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#1a1400', borderWidth: 1, borderColor: GOLD + '44',
    borderRadius: 10, padding: 10, marginBottom: 12,
  },
  tooltipTexto: { flex: 1, color: '#ccc', fontSize: 12, lineHeight: 18 },
  notifRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1b1b1b', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16,
  },
  notifInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  notifTextos: { flex: 1 },
  notifTitulo: { color: '#fff', fontSize: 14, fontWeight: '700' },
  notifSub: { color: MUTED, fontSize: 11, marginTop: 2 },
  grupoInput: { marginBottom: 12 },
  dropdownTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownTexto: { flex: 1, marginLeft: 10, fontSize: 14 },
  overlayModal: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)',
  },
  dropdownModalContent: {
    width: '85%', maxHeight: '60%', backgroundColor: '#1A1A1A',
    borderRadius: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#333',
  },
  dropdownSearchContainer: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#333', gap: 8,
  },
  dropdownSearchInput: { flex: 1, color: '#fff', fontSize: 14, paddingVertical: 4 },
  dropdownItem: {
    paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: 0.5, borderBottomColor: '#2A2A2A',
  },
  dropdownItemAtivo: { backgroundColor: 'rgba(201, 168, 76, 0.15)' },
  dropdownItemTexto: { color: '#ccc', fontSize: 14 },
  dropdownItemTextoAtivo: { color: GOLD, fontWeight: '700' },
});