import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, TextInput, Modal, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, SafeAreaView, StatusBar,
  Animated, Dimensions, RefreshControl,
} from 'react-native';
import {
  getFirestore, collection, addDoc, getDocs, query,
  orderBy, limit, updateDoc, doc, increment,
  serverTimestamp, startAfter, getDoc, deleteDoc, arrayUnion, arrayRemove,
} from '@react-native-firebase/firestore';
import { getStorage, ref, getDownloadURL } from '@react-native-firebase/storage';
import { getAuth } from '@react-native-firebase/auth';
import { launchImageLibrary } from 'react-native-image-picker';
import { Icon } from 'react-native-elements';
import { useAvatar } from '../componentes/AvatarContext';
import { env } from '../config/env';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GOLD   = '#C9A84C';
const BG     = '#0a0a0a';
const CARD   = '#141414';
const CARD2  = '#1a1a1a';
const BORDER = '#222222';
const RED    = '#E53935';
const GREEN  = '#22C55E';
const MUTED  = '#555555';
const WHITE  = '#ffffff';

const DENUNCIAS_PARA_REMOVER = 3;
const POSTS_POR_PAGINA       = 10;
const COLECAO_MURAL          = 'mural';

const db      = getFirestore();
const auth    = getAuth();
const storage = getStorage();

async function moderarConteudo(texto, imagemBase64 = null) {
  try {
    const content = [];

    if (imagemBase64) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: imagemBase64 },
      });
    }

    content.push({
      type: 'text',
      text: `Você é um moderador de conteúdo para um app de fãs do cantor Tim Maia.
Analise se este conteúdo é apropriado para publicação pública.
Bloqueie conteúdo com: nudez, violência, ódio, spam, conteúdo ilegal ou completamente irrelevante ao tema música/Tim Maia.
Permita: elogios, críticas construtivas, letras de músicas, memórias pessoais, opiniões sobre a obra.
Texto do post: "${texto || '(sem texto)'}"
Responda APENAS com JSON válido, sem texto antes ou depois:
{"aprovado": true, "motivo": "string explicando a decisão"}`,
    });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.openRouterApiKey}`,
        'HTTP-Referer': 'https://tocarock.com.br',
        'X-Title': 'Toca Tim Maia Mural',
      },
      body: JSON.stringify({
        model: 'openrouter/auto',
        messages: [{ role: 'user', content }],
      }),
    });

    const data  = await response.json();
    const raw   = data?.choices?.[0]?.message?.content ?? '';
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.warn('Moderação falhou, aprovando por padrão:', e);
    return { aprovado: true, motivo: 'Moderação indisponível' };
  }
}

async function uploadImagemMural(uri, uid) {
  const uploadUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
  const filename  = `mural/${uid}_${Date.now()}.jpg`;
  const storageRef = ref(storage, filename);
  await storageRef.putFile(uploadUri);
  return getDownloadURL(storageRef);
}

const PostCard = ({ post, usuarioUid, avatarFotoUrl, onDenunciar, onCurtir, onDeletar }) => {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const [expandido, setExpandido] = useState(false);
  const [jaDenunciou, setJaDenunciou] = useState(false);
  const [jaCurtiu, setJaCurtiu] = useState(post.curtidosPor?.includes(usuarioUid) ?? false);
  const [menuVisivel, setMenuVisivel] = useState(false);
  const [modalDeleteVisivel, setModalDeleteVisivel] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8,   useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const tempoDecorrido = (timestamp) => {
    if (!timestamp) return '';
    const agora = Date.now();
    const ms    = agora - timestamp.toMillis?.();
    if (isNaN(ms)) return '';
    const min  = Math.floor(ms / 60000);
    const h    = Math.floor(ms / 3600000);
    const dias = Math.floor(ms / 86400000);
    if (min < 1)   return 'agora';
    if (min < 60)  return `${min}m`;
    if (h < 24)    return `${h}h`;
    return `${dias}d`;
  };

  const handleDenunciar = () => {
    if (jaDenunciou) {
      Alert.alert('Já denunciado', 'Você já denunciou este post.');
      return;
    }
    Alert.alert(
      '⚠️ Denunciar post',
      'Tem certeza?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Denunciar',
          style: 'destructive',
          onPress: () => { onDenunciar(post.id); setJaDenunciou(true); },
        },
      ]
    );
  };

  const handleCurtir = () => {
    onCurtir(post.id, jaCurtiu);
    setJaCurtiu(!jaCurtiu);
  };

  const handleDeletar = () => {
    setModalDeleteVisivel(true);
  };

  const confirmarDelecao = () => {
    setModalDeleteVisivel(false);
    setMenuVisivel(false);
    onDeletar(post.id);
  };

  const textoLongo  = post.texto && post.texto.length > 180;
  const textoExibir = textoLongo && !expandido
    ? post.texto.substring(0, 180) + '...'
    : post.texto;

  return (
    <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      {}
      <View style={s.cardHeader}>
        <Image
          key={post.uid === usuarioUid ? avatarFotoUrl : post.avatarUrl}
          source={{ uri: post.uid === usuarioUid && avatarFotoUrl ? avatarFotoUrl : (post.avatarUrl || post.photoURL || `https://ui-avatars.com/api/?background=random&color=random&name=${encodeURIComponent(post.nome || 'F')}`) }}
          style={s.avatar}
        />
        <View style={s.cardHeaderInfo}>
          <Text style={s.autorNome}>{post.nome || 'Fã anônimo'}</Text>
          <Text style={s.cardTempo}>{tempoDecorrido(post.criadoEm)}</Text>
        </View>

        {}
        {post.uid === usuarioUid && (
          <View style={s.menuContainer}>
            <TouchableOpacity
              onPress={() => setMenuVisivel(!menuVisivel)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon
                name="more-vertical"
                type="feather"
                size={18}
                color={MUTED}
              />
            </TouchableOpacity>

            {menuVisivel && (
              <View style={s.menuDropdown}>
                <TouchableOpacity
                  style={s.menuItem}
                  onPress={handleDeletar}
                >
                  <Icon
                    name="trash-2"
                    type="feather"
                    size={14}
                    color={RED}
                  />
                  <Text style={s.menuItemTexto}>Deletar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {}
        <TouchableOpacity
          onPress={handleDenunciar}
          style={[s.denunciarBtn, jaDenunciou && s.denunciarBtnAtivo]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon
            name="flag"
            type="feather"
            size={14}
            color={jaDenunciou ? RED : MUTED}
          />
        </TouchableOpacity>
      </View>

      {}
      {post.imagemUrl ? (
        <Image source={{ uri: post.imagemUrl }} style={s.postImagem} resizeMode="cover" />
      ) : null}

      {}
      {post.texto ? (
        <View style={s.textoWrapper}>
          <Text style={s.postTexto}>{textoExibir}</Text>
          {textoLongo && (
            <TouchableOpacity onPress={() => setExpandido(e => !e)}>
              <Text style={s.verMais}>{expandido ? 'Ver menos' : 'Ver mais'}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {}
      <View style={s.cardFooter}>
        <View style={s.dividerLinha} />
        <View style={s.footerRow}>
          <TouchableOpacity style={s.footerBtn} onPress={handleCurtir}>
            <Icon
              name={jaCurtiu ? "heart" : "heart"}
              type="feather"
              size={14}
              color={jaCurtiu ? RED : MUTED}
              solid={jaCurtiu}
            />
            <Text style={[s.footerBtnTexto, jaCurtiu && { color: RED }]}>
              {post.curtidas ?? 0}
            </Text>
          </TouchableOpacity>
          <View style={s.footerDivisor} />
          <View style={s.footerInfo}>
            <Icon name="music" type="feather" size={11} color={MUTED} />
            <Text style={s.footerTexto}>Toca Tim Maia · Mural de Fãs</Text>
          </View>
        </View>
      </View>

      {}
      <Modal
        visible={modalDeleteVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setModalDeleteVisivel(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.confirmDialog}>
            <Text style={s.confirmTitulo}>Deletar post?</Text>
            <Text style={s.confirmMensagem}>Esta ação não pode ser desfeita.</Text>
            <View style={s.confirmBotoes}>
              <TouchableOpacity
                style={[s.confirmBtn, s.cancelBtn]}
                onPress={() => setModalDeleteVisivel(false)}
              >
                <Text style={s.cancelBtnTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.confirmBtn, s.deleteBtn]}
                onPress={confirmarDelecao}
              >
                <Text style={s.deleteBtnTexto}>Deletar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
};

export default function Mural() {
  const [posts,         setPosts]         = useState([]);
  const [carregando,    setCarregando]    = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [ultimoDoc,     setUltimoDoc]     = useState(null);
  const [temMais,       setTemMais]       = useState(true);
  const [carregandoMais,setCarregandoMais]= useState(false);
  const [modalVisivel,  setModalVisivel]  = useState(false);
  const [texto,         setTexto]         = useState('');
  const [imagemUri,     setImagemUri]     = useState(null);
  const [imagemBase64,  setImagemBase64]  = useState(null);
  const [publicando,    setPublicando]    = useState(false);
  const [moderandoMsg,  setModerandoMsg]  = useState('');
  const [ordenacao,     setOrdenacao]     = useState('recentes');

  const usuario = auth.currentUser;
  const { avatarFotoUrl } = useAvatar();

  const carregarPosts = useCallback(async (refresh = false) => {
    try {
      let orderByField = 'criadoEm';
      let orderByDirection = 'desc';

      if (ordenacao === 'antigas') {
        orderByField = 'criadoEm';
        orderByDirection = 'asc';
      } else if (ordenacao === 'curtidas') {
        orderByField = 'curtidas';
        orderByDirection = 'desc';
      } else if (ordenacao === 'menosCurtidas') {
        orderByField = 'curtidas';
        orderByDirection = 'asc';
      }

      const q = query(
        collection(db, COLECAO_MURAL),
        orderBy(orderByField, orderByDirection),
        limit(POSTS_POR_PAGINA)
      );

      const snap = await getDocs(q);
      const todos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const lista = todos.filter(p => p.denuncias < DENUNCIAS_PARA_REMOVER && p.aprovado === true);

      setPosts(lista);
      let ultimoValido = null;
      for (let i = snap.docs.length - 1; i >= 0; i--) {
        if (snap.docs[i].data().denuncias < DENUNCIAS_PARA_REMOVER) {
          ultimoValido = snap.docs[i];
          break;
        }
      }
      setUltimoDoc(ultimoValido);
      setTemMais(snap.docs.length === POSTS_POR_PAGINA);
    } catch (e) {
      console.warn('Erro ao carregar posts:', e);
    } finally {
      setCarregando(false);
      setRefreshing(false);
    }
  }, [ordenacao]);

  useEffect(() => { carregarPosts(); }, [carregarPosts]);

  const carregarMais = async () => {
    if (!temMais || carregandoMais || !ultimoDoc) return;
    setCarregandoMais(true);
    try {
      let orderByField = 'criadoEm';
      let orderByDirection = 'desc';

      if (ordenacao === 'antigas') {
        orderByField = 'criadoEm';
        orderByDirection = 'asc';
      } else if (ordenacao === 'curtidas') {
        orderByField = 'curtidas';
        orderByDirection = 'desc';
      } else if (ordenacao === 'menosCurtidas') {
        orderByField = 'curtidas';
        orderByDirection = 'asc';
      }

      const q = query(
        collection(db, COLECAO_MURAL),
        orderBy(orderByField, orderByDirection),
        limit(POSTS_POR_PAGINA),
        startAfter(ultimoDoc)
      );
      const snap = await getDocs(q);
      const todos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const novos = todos.filter(p => p.denuncias < DENUNCIAS_PARA_REMOVER && p.aprovado === true);
      setPosts(prev => [...prev, ...novos]);
      let ultimoValido = null;
      for (let i = snap.docs.length - 1; i >= 0; i--) {
        if (snap.docs[i].data().denuncias < DENUNCIAS_PARA_REMOVER) {
          ultimoValido = snap.docs[i];
          break;
        }
      }
      setUltimoDoc(ultimoValido);
      setTemMais(snap.docs.length === POSTS_POR_PAGINA);
    } catch (e) {
      console.warn('Erro ao carregar mais:', e);
    } finally {
      setCarregandoMais(false);
    }
  };

  const selecionarImagem = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.7,
      maxWidth: 1080,
      maxHeight: 1080,
      includeBase64: true,
    });
    if (result.assets?.[0]) {
      setImagemUri(result.assets[0].uri);
      setImagemBase64(result.assets[0].base64 ?? null);
    }
  };

  const publicar = async () => {
    if (!texto.trim() && !imagemUri) {
      Alert.alert('Atenção', 'Escreva algo ou escolha uma foto para publicar.');
      return;
    }
    if (!usuario) {
      Alert.alert('Login necessário', 'Entre na sua conta para publicar no mural.');
      return;
    }

    setPublicando(true);
    try {
      setModerandoMsg('Verificando conteúdo...');
      const moderacao = await moderarConteudo(texto, imagemBase64);

      if (!moderacao.aprovado) {
        Alert.alert(
          '❌ Conteúdo não permitido',
          moderacao.motivo || 'Este conteúdo não pode ser publicado.'
        );
        return;
      }

      let imagemUrl = null;
      if (imagemUri) {
        setModerandoMsg('Enviando imagem...');
        imagemUrl = await uploadImagemMural(imagemUri, usuario.uid);
      }

      setModerandoMsg('Publicando...');
      await addDoc(collection(db, COLECAO_MURAL), {
        uid:       usuario.uid,
        nome:      usuario.displayName || 'Fã',
        photoURL:  usuario.photoURL || null,
        avatarUrl: avatarFotoUrl || null,
        texto:     texto.trim(),
        imagemUrl,
        denuncias: 0,
        curtidas: 0,
        curtidosPor: [],
        aprovado:  true,
        criadoEm:  serverTimestamp(),
      });

      setTexto('');
      setImagemUri(null);
      setImagemBase64(null);
      setModalVisivel(false);
      await carregarPosts(true);
      Alert.alert('✅ Publicado!', 'Sua mensagem foi ao mural.');
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível publicar. Tente novamente.');
    } finally {
      setPublicando(false);
      setModerandoMsg('');
    }
  };

  const denunciarPost = async (postId) => {
    try {
      const ref = doc(db, COLECAO_MURAL, postId);
      await updateDoc(ref, { denuncias: increment(1) });

      const snap = await getDoc(ref);
      const denuncias = snap.data()?.denuncias ?? 0;

      if (denuncias >= DENUNCIAS_PARA_REMOVER) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        Alert.alert('Post removido', 'Este post foi removido por denúncias.');
      } else {
        Alert.alert('Denúncia enviada', `Este post tem ${denuncias} denúncia(s).`);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível enviar a denúncia.');
    }
  };

  const curtirPost = async (postId, jaCurtiu) => {
    if (!usuario) {
      Alert.alert('Login necessário', 'Entre na sua conta para curtir posts.');
      return;
    }

    try {
      const ref = doc(db, COLECAO_MURAL, postId);

      if (jaCurtiu) {
        await updateDoc(ref, {
          curtidas: increment(-1),
          curtidosPor: arrayRemove(usuario.uid),
        });
      } else {
        await updateDoc(ref, {
          curtidas: increment(1),
          curtidosPor: arrayUnion(usuario.uid),
        });
      }

      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? {
                ...p,
                curtidas: jaCurtiu ? (p.curtidas ?? 1) - 1 : (p.curtidas ?? 0) + 1,
                curtidosPor: jaCurtiu
                  ? (p.curtidosPor ?? []).filter(uid => uid !== usuario.uid)
                  : [...(p.curtidosPor ?? []), usuario.uid],
              }
            : p
        )
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível curtir o post.');
    }
  };

  const deletarPost = async (postId) => {
    try {
      const ref = doc(db, COLECAO_MURAL, postId);
      await deleteDoc(ref);

      setPosts(prev => prev.filter(p => p.id !== postId));
      Alert.alert('✅ Deletado', 'Seu post foi removido do mural.');
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível deletar o post.');
    }
  };

  const ListHeader = () => (
    <View style={s.listHeader}>
      {}
      <View style={s.banner}>
        <View style={s.bannerAccent} />
        <View style={s.bannerContent}>
          <Text style={s.bannerEmoji}>🎷</Text>
          <View style={s.bannerTextos}>
            <Text style={s.bannerTitulo}>Mural de Fãs</Text>
            <Text style={s.bannerSub}>Compartilhe o que Tim Maia significa para você, memórias e experiências</Text>
          </View>
        </View>
      </View>

      {}
      <View style={s.divisorRow}>
        <View style={s.divisorLinha} />
        <View style={s.losango} />
        <View style={s.divisorLinha} />
      </View>

      {}
      <View style={s.filtrosContainer}>
        <TouchableOpacity
          style={[s.filtroBtn, (ordenacao === 'recentes' || ordenacao === 'antigas') && s.filtroBtnAtivo]}
          onPress={() => {
            let novaOrdenacao;
            if (ordenacao === 'recentes') {
              novaOrdenacao = 'antigas';
            } else if (ordenacao === 'antigas') {
              novaOrdenacao = 'recentes';
            } else {
              novaOrdenacao = 'recentes';
            }
            setOrdenacao(novaOrdenacao);
          }}
        >
          <Icon
            name={ordenacao === 'antigas' ? "arrow-up" : "arrow-down"}
            type="feather"
            size={14}
            color={(ordenacao === 'recentes' || ordenacao === 'antigas') ? BG : MUTED}
          />
          <Text style={[s.filtroBtnTexto, (ordenacao === 'recentes' || ordenacao === 'antigas') && s.filtroBtnTextoAtivo]}>
            {ordenacao === 'recentes' ? '📅 Recentes' : '📅 Antigas'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.filtroBtn, (ordenacao === 'curtidas' || ordenacao === 'menosCurtidas') && s.filtroBtnAtivo]}
          onPress={() => {
            let novaOrdenacao;
            if (ordenacao === 'curtidas') {
              novaOrdenacao = 'menosCurtidas';
            } else if (ordenacao === 'menosCurtidas') {
              novaOrdenacao = 'curtidas';
            } else {
              novaOrdenacao = 'curtidas';
            }
            setOrdenacao(novaOrdenacao);
          }}
        >
          <Icon
            name="heart"
            type="feather"
            size={14}
            color={(ordenacao === 'curtidas' || ordenacao === 'menosCurtidas') ? BG : MUTED}
            solid={ordenacao === 'menosCurtidas' ? false : (ordenacao === 'curtidas')}
          />
          <Text style={[s.filtroBtnTexto, (ordenacao === 'curtidas' || ordenacao === 'menosCurtidas') && s.filtroBtnTextoAtivo]}>
            {ordenacao === 'curtidas' ? '❤️ Mais Curtidos' : '❤️ Menos Curtidos'}
          </Text>
        </TouchableOpacity>
      </View>

      {}
      {usuario ? (
        <TouchableOpacity style={s.ctaPublicar} onPress={() => setModalVisivel(true)} activeOpacity={0.85}>
          <Image
            key={avatarFotoUrl || 'cta-avatar'}
            source={{ uri: avatarFotoUrl || usuario.photoURL || `https://ui-avatars.com/api/?background=random&color=random&name=${encodeURIComponent(usuario.displayName || 'F')}` }}
            style={s.ctaAvatar}
          />
          <Text style={s.ctaTexto}>O que Tim Maia significa para você?</Text>
          <View style={s.ctaIcone}>
            <Icon name="edit-2" type="feather" size={16} color={BG} />
          </View>
        </TouchableOpacity>
      ) : (
        <View style={s.ctaLogin}>
          <Icon name="lock" type="feather" size={18} color={GOLD} />
          <Text style={s.ctaLoginTexto}>Entre na sua conta para publicar no mural</Text>
        </View>
      )}
    </View>
  );

  const ListFooter = () => (
    <View style={s.listFooter}>
      {carregandoMais && <ActivityIndicator color={GOLD} />}
      {!temMais && posts.length > 0 && (
        <Text style={s.semMaisTexto}>— Você chegou ao fim do mural —</Text>
      )}
    </View>
  );

  if (carregando) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={s.loadingTexto}>Carregando mural...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            usuarioUid={usuario?.uid}
            avatarFotoUrl={avatarFotoUrl}
            onDenunciar={denunciarPost}
            onCurtir={curtirPost}
            onDeletar={deletarPost}
          />
        )}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={() => (
          <View style={s.vazio}>
            <Text style={s.vazioEmoji}>🎵</Text>
            <Text style={s.vazioTitulo}>Nenhum post ainda</Text>
            <Text style={s.vazioSub}>Seja o primeiro a compartilhar algo sobre Tim Maia!</Text>
          </View>
        )}
        contentContainerStyle={s.lista}
        showsVerticalScrollIndicator={false}
        onEndReached={carregarMais}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); carregarPosts(true); }}
            tintColor={GOLD}
            colors={[GOLD]}
          />
        }
      />

      {}
      {usuario && (
        <TouchableOpacity style={s.fab} onPress={() => setModalVisivel(true)} activeOpacity={0.85}>
          <Icon name="plus" type="feather" size={26} color={BG} />
        </TouchableOpacity>
      )}

      {}
      <Modal
        visible={modalVisivel}
        animationType="slide"
        transparent={false}
        onRequestClose={() => !publicando && setModalVisivel(false)}
      >
        <SafeAreaView style={s.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor={BG} />

          {}
          <View style={s.modalHeader}>
            <TouchableOpacity
              onPress={() => !publicando && setModalVisivel(false)}
              disabled={publicando}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="x" type="feather" size={24} color={publicando ? MUTED : WHITE} />
            </TouchableOpacity>
            <Text style={s.modalTitulo}>Nova publicação</Text>
            <TouchableOpacity
              style={[s.publicarBtn, publicando && s.publicarBtnDisabled]}
              onPress={publicar}
              disabled={publicando}
            >
              {publicando
                ? <ActivityIndicator size="small" color={BG} />
                : <Text style={s.publicarBtnTexto}>Publicar</Text>
              }
            </TouchableOpacity>
          </View>

          {publicando && moderandoMsg ? (
            <View style={s.moderandoBox}>
              <ActivityIndicator color={GOLD} size="small" />
              <Text style={s.moderandoTexto}>{moderandoMsg}</Text>
            </View>
          ) : null}

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {}
            <View style={s.modalAutor}>
              <Image
                key={avatarFotoUrl || 'modal-avatar'}
                source={{ uri: avatarFotoUrl || usuario?.photoURL || `https://ui-avatars.com/api/?background=random&color=random&name=${encodeURIComponent(usuario?.displayName || 'F')}` }}
                style={s.modalAvatar}
              />
              <View>
                <Text style={s.modalAutorNome}>{usuario?.displayName || 'Fã'}</Text>
                <Text style={s.modalAutorSub}>Publicação pública</Text>
              </View>
            </View>

            {}
            <TextInput
              style={s.textInput}
              placeholder="O que Tim Maia significa para você?&#10;Compartilhe uma memória, sentimento ou frase favorita..."
              placeholderTextColor={MUTED}
              value={texto}
              onChangeText={setTexto}
              multiline
              maxLength={500}
              editable={!publicando}
            />

            <Text style={s.contadorTexto}>{texto.length}/500</Text>

            {}
            {imagemUri && (
              <View style={s.previewWrapper}>
                <Image source={{ uri: imagemUri }} style={s.previewImagem} resizeMode="cover" />
                <TouchableOpacity
                  style={s.removerImagemBtn}
                  onPress={() => { setImagemUri(null); setImagemBase64(null); }}
                >
                  <Icon name="x-circle" type="feather" size={24} color={RED} />
                </TouchableOpacity>
              </View>
            )}

            {}
            <View style={s.acoesBar}>
              <View style={s.acoesDivisor} />
              <TouchableOpacity
                style={s.acaoBtn}
                onPress={selecionarImagem}
                disabled={publicando}
              >
                <Icon name="image" type="feather" size={22} color={imagemUri ? GOLD : MUTED} />
                <Text style={[s.acaoBtnTexto, imagemUri && { color: GOLD }]}>
                  {imagemUri ? 'Trocar foto' : 'Adicionar foto'}
                </Text>
              </TouchableOpacity>

              <View style={s.avisosBar}>
                <Icon name="shield" type="feather" size={12} color={MUTED} />
                <Text style={s.avisoTexto}>
                  Conteúdo moderado antes de publicar
                </Text>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: BG },
  lista:        { paddingHorizontal: 16, paddingBottom: 100 },
  loadingBox:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTexto: { color: MUTED, fontSize: 13 },

  listHeader: { paddingTop: 16, marginBottom: 8 },

  banner: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    marginBottom: 20,
  },
  bannerAccent:  { height: 3, backgroundColor: GOLD },
  bannerContent: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  bannerEmoji:   { fontSize: 32 },
  bannerTextos:  { flex: 1 },
  bannerTitulo:  { color: WHITE, fontSize: 18, fontWeight: '900' },
  bannerSub:     { color: MUTED, fontSize: 12, marginTop: 3, lineHeight: 18 },

  divisorRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 8 },
  divisorLinha: { flex: 1, height: 1, backgroundColor: BORDER },
  losango: {
    width: 8, height: 8,
    backgroundColor: GOLD,
    transform: [{ rotate: '45deg' }],
  },

  filtrosContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 0,
  },
  filtroBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
  },
  filtroBtnAtivo: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  filtroBtnTexto: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '600',
  },
  filtroBtnTextoAtivo: {
    color: BG,
  },

  ctaPublicar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD, borderRadius: 14,
    borderWidth: 1, borderColor: BORDER,
    padding: 12, gap: 10, marginBottom: 20,
  },
  ctaAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#333' },
  ctaTexto:  { flex: 1, color: MUTED, fontSize: 14 },
  ctaIcone: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
  },

  ctaLogin: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a0e00', borderRadius: 12,
    borderWidth: 1, borderColor: '#3a2a00',
    padding: 14, gap: 10, marginBottom: 20,
  },
  ctaLoginTexto: { color: GOLD, fontSize: 13, fontWeight: '600', flex: 1 },

  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, paddingBottom: 10, gap: 10,
  },
  avatar:         { width: 40, height: 40, borderRadius: 20, backgroundColor: '#333' },
  cardHeaderInfo: { flex: 1 },
  autorNome:      { color: WHITE, fontSize: 14, fontWeight: '700' },
  cardTempo:      { color: MUTED, fontSize: 11, marginTop: 1 },

  menuContainer: {
    position: 'relative',
  },
  menuDropdown: {
    position: 'absolute',
    top: 28,
    right: 0,
    backgroundColor: CARD,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuItemTexto: {
    color: RED,
    fontSize: 13,
    fontWeight: '600',
  },

  denunciarBtn: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1a1a1a',
  },
  denunciarBtnAtivo: { backgroundColor: '#2a0a0a' },

  postImagem: {
    width: '100%',
    height: SCREEN_WIDTH * 0.65,
    backgroundColor: '#111',
  },

  textoWrapper: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4 },
  postTexto:    { color: '#ddd', fontSize: 15, lineHeight: 23 },
  verMais:      { color: GOLD, fontSize: 13, fontWeight: '700', marginTop: 4 },

  cardFooter: { paddingHorizontal: 14, paddingBottom: 12, marginTop: 8 },
  dividerLinha: { height: 1, backgroundColor: BORDER, marginBottom: 8 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: CARD2,
  },
  footerBtnTexto: { color: MUTED, fontSize: 12, fontWeight: '600' },
  footerDivisor: { width: 1, height: 20, backgroundColor: BORDER },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  footerTexto: { color: '#333', fontSize: 10, letterSpacing: 0.5 },

  listFooter: {
    alignItems: 'center', paddingVertical: 24, gap: 8,
  },
  semMaisTexto: { color: '#333', fontSize: 11, fontStyle: 'italic' },

  vazio:       { alignItems: 'center', paddingTop: 48, gap: 8 },
  vazioEmoji:  { fontSize: 48 },
  vazioTitulo: { color: WHITE, fontSize: 18, fontWeight: '900' },
  vazioSub:    { color: MUTED, fontSize: 13, textAlign: 'center', maxWidth: '70%', lineHeight: 20 },

  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },

  modalContainer: { flex: 1, backgroundColor: BG },

  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  modalTitulo: { color: WHITE, fontSize: 16, fontWeight: '800' },

  publicarBtn: {
    backgroundColor: GOLD,
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 20, minWidth: 80,
    alignItems: 'center',
  },
  publicarBtnDisabled: { backgroundColor: '#4a3a10', opacity: 0.7 },
  publicarBtnTexto: { color: BG, fontSize: 14, fontWeight: '800' },

  moderandoBox: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#1a1a00', borderBottomWidth: 1, borderBottomColor: '#333',
  },
  moderandoTexto: { color: GOLD, fontSize: 12 },

  modalAutor: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, padding: 16,
  },
  modalAvatar:    { width: 44, height: 44, borderRadius: 22, backgroundColor: '#333' },
  modalAutorNome: { color: WHITE, fontSize: 15, fontWeight: '700' },
  modalAutorSub:  { color: MUTED, fontSize: 11, marginTop: 2 },

  textInput: {
    flex: 0,
    minHeight: 120,
    maxHeight: 220,
    marginHorizontal: 16,
    color: WHITE,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  contadorTexto: {
    textAlign: 'right',
    color: MUTED, fontSize: 11,
    marginRight: 16, marginTop: 4,
  },

  previewWrapper: {
    margin: 16, borderRadius: 12, overflow: 'hidden',
    position: 'relative',
  },
  previewImagem: {
    width: '100%', height: 200, backgroundColor: '#111',
  },
  removerImagemBtn: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 14, padding: 2,
  },

  acoesBar: {
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16,
  },
  acoesDivisor: { height: 1, backgroundColor: BORDER, marginBottom: 14 },
  acaoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: CARD2, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER,
    marginBottom: 12,
  },
  acaoBtnTexto: { color: MUTED, fontSize: 14, fontWeight: '600' },

  avisosBar: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, paddingHorizontal: 4,
  },
  avisoTexto: { color: '#333', fontSize: 11, flex: 1 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmDialog: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 20,
    paddingVertical: 24,
    minWidth: '75%',
  },
  confirmTitulo: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  confirmMensagem: {
    color: MUTED,
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 20,
  },
  confirmBotoes: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: BORDER,
  },
  cancelBtnTexto: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: RED,
  },
  deleteBtnTexto: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
});
