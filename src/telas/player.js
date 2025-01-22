import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Image } from "react-native";
import Slider from '@react-native-community/slider';
import Sound from 'react-native-sound'; // Importando a biblioteca react-native-sound
import Icon from 'react-native-vector-icons/FontAwesome';

const PlayerScreen = ({ route, navigation }) => {
  const { musicUrl, albumImage, formattedName } = route.params;
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const sound = useRef(null);

  useEffect(() => {
    loadAudio();

    return () => {
      if (sound.current) {
        sound.current.release(); // Libera o áudio quando o componente for desmontado
      }
    };
  }, []);

  const loadAudio = () => {
    sound.current = new Sound(musicUrl, null, (error) => {
      if (error) {
        console.log('Erro ao carregar a música:', error);
      } else {
        setDuration(sound.current.getDuration()); // Obtém a duração da música
        sound.current.setNumberOfLoops(-1); // Para que a música se repita
      }
    });
  };

  const onPlaybackStatusUpdate = () => {
    if (sound.current) {
      sound.current.getCurrentTime((seconds) => {
        setPosition(seconds); // Atualiza a posição em segundos
      });
    }
  };

  const handlePlayPause = () => {
    if (!sound.current) return;
  
    if (playing) {
      sound.current.pause();
      setPlaying(false);
    } else {
      setPlaying(true); // Atualiza antes para refletir visualmente
      sound.current.play((success) => {
        if (!success) {
          console.log('Erro ao reproduzir o áudio');
          setPlaying(false); // Volta ao estado anterior se houver erro
        }
      });
    }
  };
  

  const handleSliderChange = (value) => {
    const seekPosition = value * duration; // Calcula a nova posição proporcionalmente
    sound.current.setCurrentTime(seekPosition); // Define a nova posição
    setPosition(seekPosition); // Atualiza imediatamente a posição
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    if (sound.current && playing) {
      const interval = setInterval(() => {
        onPlaybackStatusUpdate();
      }, 500); // Atualiza a posição do áudio a cada 0,5 segundos

      return () => clearInterval(interval);
    }
  }, [playing]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.coverContainer}>
        <Image source={{ uri: albumImage }} style={styles.cover} />
      </View>
      <Text style={[styles.textDark, styles.centeredText, { fontSize: 20, fontWeight: "500", marginTop: 32 }]}>{formattedName}</Text>
      <View style={{ marginTop: 8, width: '100%' }}>
        <Slider
          style={styles.slider}
          value={position / duration} // Proporção entre posição e duração
          onSlidingComplete={handleSliderChange}
          minimumTrackTintColor={'dodgerblue'}
          maximumTrackTintColor="#8E97A6"
          thumbTintColor="#3D425C"
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeStamp}>{formatTime(position)}</Text>
          <Text style={styles.timeStamp}>{formatTime(duration)}</Text>
        </View>
      </View>
      <View style={styles.centeredView}>
        <TouchableOpacity style={styles.playButtonContainer} onPress={handlePlayPause}>
        <Icon name={playing ? "pause" : "play"} size={50} color="#3D425C" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: 'center',
    padding: 20,
  },
  coverContainer: {
    width: 250,
    height: 250,
    shadowColor: "#5D3F6A",
    shadowOffset: { height: 15 },
    shadowRadius: 8,
    shadowOpacity: 0.3,
    alignSelf: 'center',
  },
  cover: {
    width: 275,
    height: 275,
    borderRadius: 150,
  },
  textDark: {
    color: "white",
  },
  centeredText: {
    textAlign: 'center',
  },
  slider: {
    width: "100%",
    marginTop: 20,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  timeStamp: {
    color: "#8E97A6",
    fontSize: 11,
    fontWeight: "500",
  },
  centeredView: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  playButtonContainer: {
    backgroundColor: "#FFF",
    borderColor: "rgba(93, 63, 106, 0.2)",
    borderWidth: 16,
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#5D3F6A",
    shadowRadius: 30,
    shadowOpacity: 0.5,
  },
});

export default PlayerScreen;
