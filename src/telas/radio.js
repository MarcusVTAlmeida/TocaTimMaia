import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, View, Image, SafeAreaView, TouchableOpacity } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { Audio } from 'expo-av';
import Admob from '../../admob';

export default function App() {
  const [Loaded, SetLoaded] = useState(false);
  const [Loading, SetLoading] = useState(false);
  const [Playing, SetPlaying] = useState(false);
  const [IsPressed, SetIsPressed] = useState(false);
  const sound = useRef(new Audio.Sound());

  const PlayAudio = async () => {
    SetIsPressed(true);
    try {
      const result = await sound.current.getStatusAsync();
      if (result.isLoaded) {
        if (!result.isPlaying) {
          await sound.current.playAsync();
          SetPlaying(true);
        }
      }
    } catch (error) {
      SetPlaying(false);
    }
    SetIsPressed(false);
  };

  const PauseAudio = async () => {
    SetIsPressed(true);
    try {
      const result = await sound.current.getStatusAsync();
      if (result.isLoaded) {
        if (result.isPlaying) {
          await sound.current.pauseAsync();
          SetPlaying(false);
        }
      }
    } catch (error) {
      SetPlaying(true);
    }
    SetIsPressed(false);
  };

  const LoadAudio = async () => {
    SetLoading(true);
    const checkLoading = await sound.current.getStatusAsync();
    if (!checkLoading.isLoaded) {
      try {
        const result = await sound.current.loadAsync(
          { uri: 'https://stream.zeno.fm/6x7g9kxqb0hvv' },
          {},
          true
        );
        if (!result.isLoaded) {
          SetLoading(false);
          SetLoaded(false);
        } else {
          SetLoading(false);
          SetLoaded(true);
          PlayAudio(); // Toca o áudio automaticamente após carregar
        }
      } catch (error) {
        SetLoading(false);
        SetLoaded(false);
      }
    } else {
      SetLoading(false);
      SetLoaded(true);
    }
  };

  useEffect(() => {
    LoadAudio();
    return () => {
      sound.current.unloadAsync();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: 'https://res.cloudinary.com/dib0twra5/image/upload/v1721707222/Tim%20Maia%20dados/UnrulyMixedCranefly-mobile_lfqpvy_vuwsaq.gif' }}
            style={styles.cover}
            onLoadStart={() => console.log('GIF carregando...')}
            onLoad={() => console.log('GIF carregado!')}
            onError={() => console.log('Erro ao carregar o GIF')}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.textDark, styles.liveText]}>Ao Vivo</Text>
          <Text style={[styles.text, styles.radioText]}>Rádio</Text>
        </View>
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.playButtonContainer}
            onPress={Playing ? PauseAudio : PlayAudio}
            disabled={IsPressed}
          >
            <FontAwesome5
              name={Playing ? 'pause' : 'play'}
              size={75}
              color="#3D425C"
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
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  textLight: {
    color: "#B6B7BF"
  },
  text: {
    color: "#8E97A6"
  },
  textDark: {
    color: "white"
  },
  coverContainer: {
    marginTop: 32,
    width: 350,
    height: 350,
    shadowColor: "#5D3F6A",
    shadowOffset: { height: 15 },
    shadowRadius: 8,
    shadowOpacity: 0.3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cover: {
    width: 350,
    height: 350,
    borderRadius: 175
  },
  textContainer: {
    alignItems: "center",
    marginTop: 32
  },
  liveText: {
    fontSize: 20,
    fontWeight: "500"
  },
  radioText: {
    fontSize: 16,
    marginTop: 8
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
    shadowOpacity: 0.5
  },
  admobContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  }
});
