import React, { useEffect, useState } from 'react';
import {
  SafeAreaView, View, FlatList, StyleSheet,
  Text, TouchableOpacity, Image, ActivityIndicator,
  StatusBar, Dimensions, Linking,
} from 'react-native';
import { Icon } from 'react-native-elements';
import { buscarClips } from '../componentes/clips';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;

const GOLD = '#C9A84C';
const BG   = '#0a0a0a';
const CARD = '#141414';

export default function Clip() {
  const [clips,      setClips]      = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    buscarClips()
      .then(dados => setClips(dados))
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) {
    return (
      <SafeAreaView style={styles.centralizado}>
        <StatusBar barStyle="light-content" backgroundColor={BG} />
        <ActivityIndicator size="large" color={GOLD} />
        <Text style={styles.loadingText}>Carregando clipes...</Text>
      </SafeAreaView>
    );
  }

  if (clips.length === 0) {
    return (
      <SafeAreaView style={styles.centralizado}>
        <StatusBar barStyle="light-content" backgroundColor={BG} />
        <Icon name="video-off" type="feather" color="#333" size={48} />
        <Text style={styles.vazioTexto}>Nenhum clipe encontrado.</Text>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => {
        if (!item.video) return;
        Linking.openURL(item.video).catch(e => console.error(e));
      }}
    >
      {}
      <View style={styles.thumbWrapper}>
        <Image source={{ uri: item.imagem }} style={styles.thumb} />

        {}
        <View style={styles.thumbOverlay} />

        {}
        <View style={styles.playCircle}>
          <Icon name="play" type="feather" color={BG} size={26} />
        </View>

        {}
        <View style={styles.numeroBadge}>
          <Text style={styles.numeroTexto}>
            {String(index + 1).padStart(2, '0')}
          </Text>
        </View>

        {}
        <View style={styles.clipBadge}>
          <Text style={styles.clipBadgeTexto}>🎬 CLIPE</Text>
        </View>
      </View>

      {}
      <View style={styles.info}>
        <Text style={styles.clipNome} numberOfLines={2}>
          {item.nome}
        </Text>
        <View style={styles.infoRodape}>
          <Icon name="film" type="feather" color={GOLD} size={13} />
          <Text style={styles.infoSub}>Vídeo oficial</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerEyebrow}>🎷 Tim Maia</Text>
      <Text style={styles.headerTitulo}>Clipes</Text>
      <Text style={styles.headerSub}>{clips.length} clipes disponíveis</Text>
      <View style={styles.headerDivider} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <FlatList
        data={clips}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.nome ?? String(index)}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: BG },
  centralizado:{ flex: 1, backgroundColor: BG, justifyContent: 'center', alignItems: 'center', gap: 12 },
  lista:       { paddingHorizontal: 16, paddingBottom: 40 },

  loadingText: { color: '#555', fontSize: 14 },
  vazioTexto:  { color: '#444', fontSize: 14, marginTop: 8 },

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

  thumbWrapper: {
    width: CARD_WIDTH,
    height: (CARD_WIDTH * 9) / 16,
    position: 'relative',
  },
  thumb:        { width: '100%', height: '100%' },
  thumbOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },

  playCircle: {
    position: 'absolute',
    top: '50%', left: '50%',
    marginTop: -28, marginLeft: -28,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6, shadowRadius: 8,
    elevation: 8,
  },

  numeroBadge: {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: GOLD + '55',
  },
  numeroTexto: {
    color: GOLD, fontSize: 11,
    fontWeight: '700', letterSpacing: 1,
  },

  clipBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: '#ffffff22',
  },
  clipBadgeTexto: {
    color: '#fff', fontSize: 10,
    fontWeight: '700', letterSpacing: 1,
  },

  info:     { padding: 14 },
  clipNome: {
    color: '#fff', fontSize: 15,
    fontWeight: '800', letterSpacing: 0.3,
    marginBottom: 8,
  },
  infoRodape: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  infoSub: { color: '#555', fontSize: 12 },
});
