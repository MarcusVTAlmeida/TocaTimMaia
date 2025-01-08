import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Image } from "react-native";
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import Icon from 'react-native-vector-icons/FontAwesome';

const PlayerScreen = ({ route, navigation }) => {
  const { musicUrl, albumImage, formattedName } = route.params;
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const sound = useRef(new Audio.Sound());

  useEffect(() => {
    loadAudio();

    return () => {
      sound.current.unloadAsync();
    };
  }, []);

  const loadAudio = async () => {
    try {
      const { sound: soundObject, status } = await Audio.Sound.createAsync(
        { uri: musicUrl },
        { shouldPlay: true }, // Play immediately after loading
        onPlaybackStatusUpdate
      );
      sound.current = soundObject;
      setLoaded(true);
      setDuration(status.durationMillis);
    } catch (error) {
      console.log('Erro ao carregar a música:', error);
    }
  };

  const onPlaybackStatusUpdate = status => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setPlaying(status.isPlaying);
    }
    if (status.didJustFinish) {
      sound.current.replayAsync();
    }
  };

  const handlePlayPause = async () => {
    if (playing) {
      await sound.current.pauseAsync();
    } else {
      await sound.current.playAsync();
    }
  };

  const handleSliderChange = async value => {
    if (loaded) {
      const seekPosition = value * duration;
      await sound.current.setPositionAsync(seekPosition);
    }
  };

  const formatTime = millis => {
    const minutes = Math.floor(millis / 1000 / 60);
    const seconds = Math.floor(millis / 1000) % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.coverContainer}>
        <Image source={{ uri: albumImage }} style={styles.cover} />
      </View>
      <Text style={[styles.textDark, styles.centeredText, { fontSize: 20, fontWeight: "500", marginTop: 32 }]}>{formattedName}</Text>
      <View style={{ marginTop: 8, width: '100%' }}>
        <Slider
          style={styles.slider}
          value={position / duration}
          onValueChange={handleSliderChange}
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
