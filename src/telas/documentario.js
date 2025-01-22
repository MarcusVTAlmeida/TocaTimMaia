import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking, Dimensions } from "react-native";
import Video from 'react-native-video';

export default function App() {
  const videoUrl = 'https://res.cloudinary.com/dib0twra5/video/upload/v1722215248/Tim%20Maia%20dados/Tim_Maia_Trailer_Oficial_HD_kazbpj.mp4';
  
  const [isFullscreen, setIsFullscreen] = useState(false); // Para controle de tela cheia
  

  function linkingYoutube() {
    Linking.openURL('https://marcus-almeida.wistia.com/medias/0wwi20xjkr');
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
      <Text style={styles.title}>Tim Maia</Text>
      <Text style={styles.description}>
        "Tim Maia" (2014) é um filme biográfico que narra a vida do cantor brasileiro Tim Maia, baseado no livro "Vale Tudo - O Som e a Fúria de Tim Maia" de Nelson Motta. O filme segue sua trajetória desde a infância pobre no Rio de Janeiro, sua descoberta da soul music nos Estados Unidos, até o sucesso e as batalhas com drogas e alcoolismo. Destaca seus grandes sucessos, relacionamentos tumultuados e sua personalidade intensa, oferecendo um olhar profundo sobre a vida e carreira de uma das maiores lendas da música brasileira.
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
