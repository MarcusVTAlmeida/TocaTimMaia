import React, { useState, useCallback } from "react";
import {
  View,
  Dimensions,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
  StatusBar,
  ScrollView,
} from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function App() {
  const [playing, setPlaying] = useState(false);

  const onStateChange = useCallback((state) => {
    if (state === "ended") setPlaying(false);
  }, []);

  function linkingYoutube() {
    Linking.openURL("https://www.youtube.com/watch?v=PPyMEpZfy_k");
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>

        <View style={styles.playerWrapper}>
          <YoutubePlayer
            height={220}
            width={SCREEN_WIDTH}
            play={playing}
            videoId={"Ul7gf2k2vgQ"}
            onChangeState={onStateChange}
          />
        </View>

        <View style={styles.content}>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>🎷 DOCUMENTÁRIO</Text>
          </View>

          <Text style={styles.title}>Tim Maia</Text>
          <Text style={styles.subtitle}>Não Há Nada Igual</Text>

          <View style={styles.divider} />

          <Text style={styles.description}>
            A vida e a arte de Sebastião Rodrigues Maia, mais conhecido como Tim Maia, músico de criatividade avassaladora e temperamento explosivo que transformou a música brasileira com doses irresistíveis de funk e soul. O filme recria sua trajetória desde a adolescência na Tijuca, bairro da Zona Norte do Rio de Janeiro, onde começou a carreira ao lado de Roberto Carlos e Erasmo Carlos, passando por sua temporada em Nova York, onde tomou contato com a música e o movimento negro, até sua explosão, com dezenas de “hits” que o tornaram um dos artistas mais populares e queridos do Brasil.
          </Text>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>ANO</Text>
              <Text style={styles.infoValue}>2014</Text>
            </View>
            <View style={styles.infoSeparator} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>GÊNERO</Text>
              <Text style={styles.infoValue}>Biografia, Drama, Music, Romance e Nacional</Text>
            </View>
            <View style={styles.infoSeparator} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>ORIGEM</Text>
              <Text style={styles.infoValue}>Brasil</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={linkingYoutube}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonIcon}>▶</Text>
            <Text style={styles.buttonText}>Assistir Filme Completo</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

const GOLD = "#C9A84C";
const DARK = "#111111";
const CARD = "#1A1A1A";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK,
  },
  playerWrapper: {
    backgroundColor: "#000",

    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },

  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#2A1F00",
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
  },
  badgeText: {
    color: GOLD,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 1,
  },
  subtitle: {
    color: GOLD,
    fontSize: 16,
    fontWeight: "500",
    marginTop: 4,
    letterSpacing: 0.5,
  },

  divider: {
    height: 1,
    backgroundColor: "#2A2A2A",
    marginVertical: 20,
  },

  description: {
    color: "#BBBBBB",
    fontSize: 15,
    lineHeight: 24,
    textAlign: "justify",
  },

  infoRow: {
    flexDirection: "row",
    backgroundColor: CARD,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  infoItem: {
    flex: 1,
    alignItems: "center",
  },
  infoSeparator: {
    width: 1,
    backgroundColor: "#2A2A2A",
  },
  infoLabel: {
    color: "#666",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  infoValue: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 28,
    gap: 10,

    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonIcon: {
    color: "#000",
    fontSize: 14,
    fontWeight: "900",
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  footer: {
    color: "#444",
    fontSize: 12,
    textAlign: "center",
    marginTop: 20,
  },
});