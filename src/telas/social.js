import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Linking,
} from 'react-native';
import { Icon } from 'react-native-elements';

const GOLD = '#C9A84C';
const BG   = '#0a0a0a';
const CARD = '#141414';

const REDES = [
  {
    label: 'Spotify',
    sublabel: '3,1 mi de ouvintes mensais',
    icon: 'spotify',
    iconType: 'font-awesome',
    cor: '#1DB954',
    url: 'https://open.spotify.com/intl-pt/artist/0jOs0wnXCu1bGGP7kh5uIu',
  },
  {
    label: 'Amazon Music',
    sublabel: 'Ouça na Amazon',
    icon: 'amazon',
    iconType: 'font-awesome',
    cor: '#FF9900',
    url: 'https://music.amazon.com.br/artists/B000QJNPWU/tim-maia',
  },
  {
    label: 'Apple Music',
    sublabel: 'Ouça na Apple Music',
    icon: 'apple',
    iconType: 'font-awesome',
    cor: '#fff',
    url: 'https://music.apple.com/br/artist/tim-maia/6931042',
  },
  {
    label: 'Deezer',
    sublabel: 'Ouça no Deezer',
    icon: 'music',
    iconType: 'font-awesome',
    cor: '#00C7F2',
    url: 'https://www.deezer.com/br/artist/13704',
  },
  {
    label: 'Tidal',
    sublabel: 'Ouça no Tidal',
    icon: 'music-circle',
    iconType: 'material-community',
    cor: '#00FFFF',
    url: 'https://tidal.com/artist/32821',
  },

  {
    label: 'YouTube',
    sublabel: 'Canal oficial',
    icon: 'youtube',
    iconType: 'font-awesome',
    cor: '#FF0000',
    url: 'https://www.youtube.com/channel/UCQm7LSEuBoLHVIjWnDctW2Q',
  },
  {
    label: 'Facebook',
    sublabel: 'Página oficial',
    icon: 'facebook',
    iconType: 'font-awesome',
    cor: '#1877F2',
    url: 'https://www.facebook.com/TimMaiaOfficial',
  },
  {
    label: 'Instagram',
    sublabel: '@timmaia.oficial',
    icon: 'instagram',
    iconType: 'font-awesome',
    cor: '#E1306C',
    url: 'https://www.instagram.com/timmaia.oficial/',
  },
  {
    label: 'Twitter / X',
    sublabel: '@OficialTimMaia',
    icon: 'twitter',
    iconType: 'font-awesome',
    cor: '#1DA1F2',
    url: 'https://x.com/OficialTimMaia',
  },
  {
    label: 'TikTok',
    sublabel: '@timmaia.oficial',
    icon: 'music-note',
    iconType: 'material-community',
    cor: '#69C9D0',
    url: 'https://www.tiktok.com/@timmaia.oficial',
  },
  {
    label: 'E-mail',
    sublabel: 'carmelo@timmaia.com.br',
    icon: 'envelope',
    iconType: 'font-awesome',
    cor: '#888',
    url: 'mailto:carmelo@timmaia.com.br',
  },
];

const Separador = ({ label }) => (
  <View style={styles.separador}>
    <Text style={styles.separadorLabel}>{label}</Text>
    <View style={styles.separadorLinha} />
  </View>
);

export default function Social() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {}
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>🎷 TOCA TIM MAIA</Text>
          <Text style={styles.headerTitle}>Redes Sociais</Text>
          <Text style={styles.headerSubtitle}>
            Siga o REI DO SOUL em todas as plataformas
          </Text>
          <View style={styles.headerDivider} />
        </View>

        {}
        <Separador label="STREAMING DE MÚSICA" />
        <View style={styles.lista}>
          {REDES.slice(0, 5).map((rede, i) => (
            <Card key={i} rede={rede} />
          ))}
        </View>

        {}
        <Separador label="REDES SOCIAIS" />
        <View style={styles.lista}>
          {REDES.slice(5, 10).map((rede, i) => (
            <Card key={i} rede={rede} />
          ))}
        </View>

        {}
        <Separador label="OUTROS" />
        <View style={styles.lista}>
          {REDES.slice(10).map((rede, i) => (
            <Card key={i} rede={rede} />
          ))}
        </View>

        {}
        <Text style={styles.rodape}>
          "Você marcou na minha vida, viveu, morreu na minha história. Chego a ter medo do futuro e da solidão que em minha porta bate."
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({ rede }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => Linking.openURL(rede.url)}
      activeOpacity={0.75}
    >
      {}
      <View style={[styles.iconWrapper, { backgroundColor: rede.cor + '22' }]}>
        <Icon
          name={rede.icon}
          type={rede.iconType}
          color={rede.cor}
          size={22}
        />
      </View>

      {}
      <View style={styles.cardTexto}>
        <Text style={styles.cardLabel}>{rede.label}</Text>
        <Text style={styles.cardSublabel}>{rede.sublabel}</Text>
      </View>

      {}
      <Icon
        name="chevron-right"
        type="font-awesome"
        color="#333"
        size={14}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    paddingBottom: 40,
  },

  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerEyebrow: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: '#555',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  headerDivider: {
    width: 40,
    height: 2,
    backgroundColor: GOLD,
    borderRadius: 2,
    marginTop: 20,
  },

  separador: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
    gap: 10,
  },
  separadorLabel: {
    color: GOLD,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  separadorLinha: {
    flex: 1,
    height: 1,
    backgroundColor: '#1f1f1f',
  },

  lista: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    gap: 14,
  },
  iconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTexto: {
    flex: 1,
  },
  cardLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  cardSublabel: {
    color: '#555',
    fontSize: 12,
    marginTop: 2,
  },

  rodape: {
    color: '#333',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 32,
    paddingHorizontal: 32,
  },
});
