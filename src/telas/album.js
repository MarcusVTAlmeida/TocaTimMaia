import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import { buscarAlbunsComMusicas } from '../componentes/albuns';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;

const GOLD = '#C9A84C';
const BG   = '#0a0a0a';
const CARD = '#141414';

const App = ({ navigation }) => {
  const [todosAlbuns, setTodosAlbuns]     = useState([]);
  const [albunsVisiveis, setAlbunsVisiveis] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [pagina, setPagina]               = useState(1);
  const porPagina = 6;

  useEffect(() => {
    async function carregarMusicas() {
      const albuns = await buscarAlbunsComMusicas();
      albuns.sort((a, b) =>
        a.album.localeCompare(b.album, 'pt', { sensitivity: 'base' })
      );
      setTodosAlbuns(albuns);
      setAlbunsVisiveis(albuns.slice(0, porPagina));
      setLoading(false);
    }
    carregarMusicas();
  }, []);

  const carregarMais = () => {
    const novaPagina = pagina + 1;
    setAlbunsVisiveis(todosAlbuns.slice(0, novaPagina * porPagina));
    setPagina(novaPagina);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GOLD} />
        <Text style={styles.loadingText}>Carregando álbuns...</Text>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() =>
        navigation.navigate('musicas', {
          musicas: item.musicas,
          imagem:  item.imagem,
          album:   item.album,
          resumo:  item.resumo,
        })
      }
    >
      {}
      <Image source={{ uri: item.imagem }} style={styles.capa} />

      {}
      <View style={styles.capaOverlay} />

      {}
      <View style={styles.numeroBadge}>
        <Text style={styles.numeroTexto}>{String(index + 1).padStart(2, '0')}</Text>
      </View>

      {}
      <View style={styles.info}>
        <Text style={styles.albumNome} numberOfLines={2}>{item.album}</Text>
        <View style={styles.infoRodape}>
          <Text style={styles.musicasQtd}>
            {item.musicas?.length ?? 0} músicas
          </Text>
          <View style={styles.playBtn}>
            <Text style={styles.playBtnTexto}>▶  Ouvir</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (albunsVisiveis.length >= todosAlbuns.length) return null;
    return (
      <TouchableOpacity style={styles.loadMore} onPress={carregarMais} activeOpacity={0.8}>
        <Text style={styles.loadMoreTexto}>Carregar mais álbuns</Text>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerEyebrow}>🎷 DISCOGRAFIA</Text>
      <Text style={styles.headerTitulo}>Álbuns</Text>
      <Text style={styles.headerSub}>{todosAlbuns.length} álbuns no acervo</Text>
      <View style={styles.headerDivider} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <FlatList
        data={albunsVisiveis}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        onEndReached={carregarMais}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  lista: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#555',
    fontSize: 14,
  },

  header: {
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerEyebrow: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  headerTitulo: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSub: {
    color: '#444',
    fontSize: 12,
    marginTop: 4,
  },
  headerDivider: {
    width: 40,
    height: 2,
    backgroundColor: GOLD,
    borderRadius: 2,
    marginTop: 16,
  },

  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1f1f1f',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  capa: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
  },
  capaOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: 'transparent',
    background: 'linear-gradient(transparent, #141414)',
  },

  numeroBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: GOLD + '55',
  },
  numeroTexto: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },

  info: {
    padding: 14,
  },
  albumNome: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  infoRodape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  musicasQtd: {
    color: '#555',
    fontSize: 12,
  },

  playBtn: {
    backgroundColor: GOLD,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  playBtnTexto: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },

  loadMore: {
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  loadMoreTexto: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default App;
