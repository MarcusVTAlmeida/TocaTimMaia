import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, View, Image, SafeAreaView, TouchableOpacity } from "react-native";
import Sound from 'react-native-sound'; // Importando a biblioteca react-native-sound
import axios from 'axios';
import base64 from 'base-64';
import { SocialIcon, Icon } from 'react-native-elements';
import Admob from '../../admob';

const cloudName = 'dib0twra5'; // Substitua com seu cloud_name do Cloudinary
const apiKey = '472745782282797'; // Substitua com sua api_key do Cloudinary
const apiSecret = 'lAPoqRdg0lsTVKUAbWnBEdUtyi0'; // Substitua com seu api_secret do Cloudinary

export default function App() {
  const [Loaded, SetLoaded] = useState(false);
  const [Loading, SetLoading] = useState(false);
  const [Playing, SetPlaying] = useState(false);
  const [IsPressed, SetIsPressed] = useState(false);
  const [musicas, setMusicas] = useState([]);
  const [currentMusicIndex, setCurrentMusicIndex] = useState(0); // Índice da música atual

  const sound = useRef(null);

  useEffect(() => {
    fetchMusicas();
  }, []);

  // Função para buscar as músicas da pasta do Cloudinary
  const fetchMusicas = async () => {
    try {
      const response = await axios.get(
        `https://api.cloudinary.com/v1_1/${cloudName}/resources/video/upload?prefix=cazuza musicas&type=upload`,
        {
          headers: {
            'Authorization': `Basic ${base64.encode(`${apiKey}:${apiSecret}`)}`,
          },
        }
      );
      setMusicas(response.data.resources); // Apenas as músicas da pasta 'cazuza' serão retornadas
    } catch (error) {
      console.error('Erro ao buscar músicas:', error);
    }
  };

  // Função para formatar o nome do arquivo
  const formatFileName = (fileName) => {
    const baseName = fileName.substring(0, fileName.lastIndexOf('_'));
    return baseName
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  // Função para tocar uma música
  const playMusic = (url) => {
    SetIsPressed(true);
    if (sound.current) {
      sound.current.stop(() => {
        sound.current.release();
      });
    }

    sound.current = new Sound(url, null, (error) => {
      if (error) {
        console.log('Erro ao carregar a música', error);
        return;
      }

      sound.current.play(() => {
        setNextMusic(); // Toca a próxima música após terminar
      });
    });

    SetPlaying(true);
    SetIsPressed(false);
  };

  // Função para selecionar aleatoriamente a próxima música
  const setNextMusic = () => {
    const nextIndex = Math.floor(Math.random() * musicas.length); // Escolhe uma música aleatória
    setCurrentMusicIndex(nextIndex);
    playMusic(musicas[nextIndex].secure_url);
  };

  // Função para pausar a música
  const PauseAudio = () => {
    SetIsPressed(true);
    if (sound.current) {
      sound.current.pause();
      SetPlaying(false);
    }
    SetIsPressed(false);
  };

  // Função para carregar e tocar a primeira música aleatória
  const LoadAudio = () => {
    SetLoading(true);
    if (musicas.length > 0) {
      const randomIndex = Math.floor(Math.random() * musicas.length); // Seleciona aleatoriamente a primeira música
      setCurrentMusicIndex(randomIndex); // Atualiza o índice da música atual
      playMusic(musicas[randomIndex].secure_url); // Toca a música aleatória inicial
    }
    SetLoading(false);
    SetLoaded(true);
  };

  // Chama LoadAudio quando as músicas estiverem carregadas
  useEffect(() => {
    if (musicas.length > 0) {
      LoadAudio(); // Toca uma música aleatória quando as músicas estiverem carregadas
    }
  }, [musicas]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: 'https://res.cloudinary.com/dib0twra5/image/upload/v1736400114/Cazuza%20Dados/cazuza-rollingstonebr_fqfxa4.gif' }}
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
            onPress={Playing ? PauseAudio : LoadAudio}
            disabled={IsPressed}
          >           
             <Icon
                          name={Playing ? 'pause' : 'play'}
                          type='font-awesome'
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
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start', // Alinha o conteúdo no topo da tela
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
    width: 300, // Aumenta a largura da imagem
    height: 300, // Aumenta a altura da imagem
    marginTop: 0, // Faz o GIF começar no topo
    borderRadius: 150, // Torna a imagem circular
    overflow: 'hidden', // Garante que a imagem será cortada para ser circular
    shadowColor: "#5D3F6A",
    shadowOffset: { height: 15 },
    shadowRadius: 8,
    shadowOpacity: 0.3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cover: {
    width: 400, // Aumenta a largura da imagem circular
    height: 300, // Aumenta a altura da imagem circular
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
