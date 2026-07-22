import React from 'react';
import {
  SafeAreaView,
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Icon } from 'react-native-elements';
import livros from '../componentes/livros';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GOLD = '#C9A84C';
const BG   = '#0a0a0a';
const CARD = '#141414';

const App = ({ navigation }) => {

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() =>
        navigation.navigate('livro2', {
          nome:   item.nome,
          imagem: item.imagem,
          resumo: item.resumo,
        })
      }
    >
      {}
      <View style={styles.capaWrapper}>
        <Image source={{ uri: item.imagem }} style={styles.capa} />

        {}
        <View style={styles.capaOverlay} />

        {}
        <View style={styles.numeroBadge}>
          <Text style={styles.numeroTexto}>
            {String(index + 1).padStart(2, '0')}
          </Text>
        </View>

        {}
        <View style={styles.livroBadge}>
          <Text style={styles.livroBadgeTexto}>📖 LIVRO</Text>
        </View>
      </View>

      {}
      <View style={styles.info}>
        <Text style={styles.livroNome} numberOfLines={2}>
          {item.nome}
        </Text>

        {}
        {item.resumo ? (
          <Text style={styles.livroResumo} numberOfLines={3}>
            {item.resumo.trim()}
          </Text>
        ) : null}

        {}
        <View style={styles.infoRodape}>
          <Icon name="book-open" type="feather" color={GOLD} size={13} />
          <Text style={styles.infoSub}>Ver detalhes</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerEyebrow}>🎷 Tim Maia</Text>
      <Text style={styles.headerTitulo}>Livros</Text>
      <Text style={styles.headerSub}>{livros.length} obras no acervo</Text>
      <View style={styles.headerDivider} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <FlatList
        data={livros}
        renderItem={renderItem}
        keyExtractor={(item) => item.nome}
        ListHeaderComponent={renderHeader}
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
    flexDirection: 'row',
  },

  capaWrapper: {
    width: 110,
    height: 160,
    position: 'relative',
  },
  capa: {
    width: '100%',
    height: '100%',
  },
  capaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },

  numeroBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: GOLD + '55',
  },
  numeroTexto: {
    color: GOLD,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },

  livroBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#ffffff18',
  },
  livroBadgeTexto: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  info: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  livroNome: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
    lineHeight: 20,
    marginBottom: 8,
  },
  livroResumo: {
    color: '#555',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  infoRodape: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  infoSub: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default App;
