import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking, Dimensions } from "react-native";
import Video from 'react-native-video';

export default function App() {
  const videoUrl = 'https://res.cloudinary.com/dib0twra5/video/upload/v1736399890/Cazuza%20Dados/Trailer_do_filme_Cazuza_-_O_Tempo_n%C3%A3o_P%C3%A1ra_zitslu.mp4';
  
  const [isFullscreen, setIsFullscreen] = useState(false); // Para controle de tela cheia
  
  const linkingYoutube = () => {
    Linking.openURL('https://youtu.be/OG4O7xxTOGM');
  };

  // Função para ajustar o modo de tela cheia
  const onEnterFullscreen = () => {
    setIsFullscreen(true);
  };

  const onExitFullscreen = () => {
    setIsFullscreen(false);
  };

  return (
    <View style={styles.container}>
      <Video
        source={{ uri: videoUrl }}
        controls={true}
        isMuted={false}
        resizeMode="contain" // O vídeo deve ser ajustado ao tamanho da tela
        shouldPlay
        style={[styles.video, isFullscreen && styles.fullscreenVideo]}
        onFullscreenPlayerDidPresent={onEnterFullscreen} // Quando entra em tela cheia
        onFullscreenPlayerDidDismiss={onExitFullscreen} // Quando sai da tela cheia
      />
      <View style={styles.textContainer}>
        <Text style={styles.title}>Cazuza - O Tempo Não Pára</Text>
        <Text style={styles.description}>
          O filme retrata a vida polêmica e intensa do cantor e compositor Cazuza, desde quando começou a carreira, atuando na peça Para-Quedas do Coração, no Circo Voador, o sucesso com o Barão Vermelho e sua carreira solo até a descoberta de sua doença e morte precoce em 1990.
        </Text>
        <TouchableOpacity style={styles.button} onPress={linkingYoutube}>
          <Text style={styles.buttonText}>ACESSAR FILME COMPLETO</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start', // Garante que o vídeo fique no topo
    alignItems: 'center',
    backgroundColor: 'black',
    padding: 20,
  },
  video: {
    width: width, // Garante que o vídeo ocupe toda a largura da tela
    height: 200, // Definido para 200, mas será ajustado no modo fullscreen
  },
  fullscreenVideo: {
    width: width, // Ao entrar em tela cheia, o vídeo ocupa a largura total
    height: height, // Ao entrar em tela cheia, o vídeo ocupa a altura total
  },
  textContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    color: 'white',
    textAlign: 'justify',
    fontSize: 16,
    paddingHorizontal: 10,
  },
  button: {
    borderRadius: 10,
    borderColor: 'white',
    borderWidth: 1,
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
});
