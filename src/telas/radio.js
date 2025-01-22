import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import Sound from "react-native-sound";
import { Icon } from "react-native-elements";
import Admob from "../../admob";

export default function App() {
  const [Playing, SetPlaying] = useState(false);
  const [IsPressed, SetIsPressed] = useState(false);

  const sound = useRef(null);
  const radioURL = "https://stream.zeno.fm/6x7g9kxqb0hvv";

  // Função para tocar a rádio
  const playRadio = () => {
    SetIsPressed(true);

    if (sound.current) {
      sound.current.stop(() => {
        sound.current.release();
      });
    }

    sound.current = new Sound(radioURL, null, (error) => {
      if (error) {
        console.log("Erro ao carregar a rádio", error);
        return;
      }

      sound.current.play((success) => {
        if (!success) {
          console.log("Erro ao reproduzir a rádio");
        }
      });
    });

    SetPlaying(true);
    SetIsPressed(false);
  };

  // Função para pausar a rádio
  const pauseRadio = () => {
    SetIsPressed(true);

    if (sound.current) {
      sound.current.pause();
      SetPlaying(false);
    }

    SetIsPressed(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.coverContainer}>
          <Image
            source={{
              uri: "https://res.cloudinary.com/dib0twra5/image/upload/v1721707222/Tim%20Maia%20dados/UnrulyMixedCranefly-mobile_lfqpvy_vuwsaq.gif",
            }}
            style={styles.cover}
            resizeMode="contain"
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.textDark, styles.liveText]}>Ao Vivo</Text>
          <Text style={[styles.text, styles.radioText]}>Rádio</Text>
        </View>
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.playButtonContainer}
            onPress={Playing ? pauseRadio : playRadio}
            disabled={IsPressed}
          >
            <Icon
              name={Playing ? "pause" : "play"}
              type="font-awesome"
              reverse
              raised
              color="#3D425C"
              size={60}
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.admobContainer}>
        <Admob />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 20,
  },
  textLight: {
    color: "#B6B7BF",
  },
  text: {
    color: "#8E97A6",
  },
  textDark: {
    color: "white",
  },
  coverContainer: {
    width: 300,
    height: 300,
    marginTop: 0,
    borderRadius: 150,
    overflow: "hidden",
    shadowColor: "#5D3F6A",
    shadowOffset: { height: 15 },
    shadowRadius: 8,
    shadowOpacity: 0.3,
    alignItems: "center",
    justifyContent: "center",
  },
  cover: {
    width: 400,
    height: 300,
  },
  textContainer: {
    alignItems: "center",
    marginTop: 32,
  },
  liveText: {
    fontSize: 20,
    fontWeight: "500",
  },
  radioText: {
    fontSize: 16,
    marginTop: 8,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
  },
  playButtonContainer: {
    backgroundColor: "#FFF",
    borderColor: "rgba(93, 63, 106, 0.2)",
    borderWidth: 16,
    width: 150,
    height: 150,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#5D3F6A",
    shadowRadius: 30,
    shadowOpacity: 0.5,
  },
  admobContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
});
