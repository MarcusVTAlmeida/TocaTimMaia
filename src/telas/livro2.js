import React from 'react';
import {
  StyleSheet,
  Text,
  Image,
  View,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Icon } from 'react-native-elements';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GOLD  = '#C9A84C';
const BG    = '#0a0a0a';
const CARD  = '#141414';

const App = ({ route }) => {
  const { nome, imagem, resumo } = route.params;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {}
        <View style={styles.capaSection}>

          {}
          <View style={[styles.ring, { width: 260, height: 260, borderColor: GOLD + '15' }]} />
          <View style={[styles.ring, { width: 220, height: 220, borderColor: GOLD + '25' }]} />

          {}
          <View style={styles.capaShadow}>
            <Image source={{ uri: imagem }} style={styles.capa} />
          </View>

          {}
          <View style={styles.badge}>
            <Text style={styles.badgeTexto}>📖 LIVRO</Text>
          </View>
        </View>

        {}
        <View style={styles.infoSection}>

          {}
          <Text style={styles.titulo}>{nome}</Text>

          {}
          <View style={styles.divider} />

          {}
          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <Icon name="book" type="feather" color={GOLD} size={12} />
              <Text style={styles.chipTexto}>Literatura</Text>
            </View>
            <View style={styles.chip}>
              <Icon name="music" type="feather" color={GOLD} size={12} />
              <Text style={styles.chipTexto}>Soul Brasileiro</Text>
            </View>
            <View style={styles.chip}>
              <Icon name="star" type="feather" color={GOLD} size={12} />
              <Text style={styles.chipTexto}>Tim Maia</Text>
            </View>
          </View>
        </View>

        {}
        {resumo ? (
          <View style={styles.resumoCard}>

            {}
            <View style={styles.resumoHeader}>
              <Icon name="align-left" type="feather" color={GOLD} size={14} />
              <Text style={styles.resumoLabel}>Sinopse</Text>
            </View>

            <Text style={styles.resumoTexto}>{resumo.trim()}</Text>
          </View>
        ) : null}

        {}
        <Text style={styles.rodape}>
          "De repente a dor de esperar terminou e o amor veio, enfim."
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    paddingBottom: 48,
  },

  capaSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 28,
    backgroundColor: CARD,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
  },
  capaShadow: {
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
    borderRadius: 8,
  },
  capa: {
    width: 160,
    height: 230,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: GOLD + '55',
  },
  badge: {
    marginTop: 16,
    backgroundColor: '#1f1f1f',
    borderWidth: 1,
    borderColor: GOLD + '44',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  badgeTexto: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  infoSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  titulo: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: 0.3,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: GOLD,
    borderRadius: 2,
    marginVertical: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipTexto: {
    color: '#888',
    fontSize: 11,
    fontWeight: '600',
  },

  resumoCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 20,
  },
  resumoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  resumoLabel: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  resumoTexto: {
    color: '#999',
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'justify',
  },

  rodape: {
    color: '#2a2a2a',
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 32,
    paddingHorizontal: 32,
  },
});

export default App;
