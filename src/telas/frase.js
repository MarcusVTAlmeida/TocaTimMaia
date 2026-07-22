import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  StatusBar, Animated, Dimensions,
  TouchableOpacity, Share,
} from 'react-native';
import Video from 'react-native-video';
import frases from '../componentes/frases';
import { buscarShows } from '../componentes/shows';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GOLD    = '#C9A84C';
const BG      = '#050505';
const CARD    = 'rgba(5, 5, 5, 0.72)';
const WHITE   = '#F5F5F5';
const RED     = '#8B0000';
const BORDER  = 'rgba(255,255,255,0.10)';
const OVERLAY = 'rgba(0,0,0,0.30)';

const BUFFER_CONFIG = {
  minBufferMs: 1000,
  maxBufferMs: 5000,
  bufferForPlaybackMs: 500,
  bufferForPlaybackAfterRebufferMs: 1000,
};

function proximaFraseAleatoria(atual = '') {
  if (!Array.isArray(frases) || frases.length === 0) return 'Nenhuma frase encontrada.';
  if (frases.length === 1) return frases[0];
  let nova = atual;
  while (nova === atual) nova = frases[Math.floor(Math.random() * frases.length)];
  return nova;
}

export default function Frases() {
  const [frase, setFrase]       = useState(() => proximaFraseAleatoria());
  const [shows, setShows]       = useState([]);
  const [showIndex, setShowIndex] = useState(0);
  const [randomOffset, setRandomOffset] = useState(0);

  const fadeAnim       = useRef(new Animated.Value(1)).current;
  const videoRef       = useRef(null);
  const seekTimeoutRef = useRef(null);

  useEffect(() => {
    buscarShows().then((lista) => {
      if (lista.length > 0) setShows(lista);
    });
  }, []);

  const showAtual = shows.length > 0 ? shows[showIndex % shows.length] : null;
  const videoUrl  = showAtual ? showAtual.downloadUrl : null;

  const randomizarVideo = useCallback(() => {
    if (shows.length === 0) return;
    const idx = Math.floor(Math.random() * shows.length);
    setShowIndex(idx);
    const duracao = shows[idx].duracao;
    if (duracao && duracao > 10) {
      setRandomOffset(Math.floor(Math.random() * (duracao - 10)) + 5);
    } else {
      setRandomOffset(0);
    }
  }, [shows]);

  useEffect(() => {
    if (shows.length > 0) randomizarVideo();
  }, [shows, randomizarVideo]);

  useEffect(() => () => {
    if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
  }, []);

  const handleVideoLoad = useCallback(() => {
    seekTimeoutRef.current = setTimeout(() => {
      if (randomOffset > 0) videoRef.current?.seek(randomOffset);
    }, 200);
  }, [randomOffset]);

  const handleVideoSeek = useCallback(() => {
    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current);
      seekTimeoutRef.current = null;
    }
  }, []);

  const handleVideoEnd = useCallback(() => {
    randomizarVideo();
  }, [randomizarVideo]);

  const handleVideoError = useCallback(() => {
    randomizarVideo();
  }, [randomizarVideo]);

  const trocarFrase = useCallback(() => {
    randomizarVideo();
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    setFrase(f => proximaFraseAleatoria(f));
  }, [fadeAnim, randomizarVideo]);

  const compartilhar = useCallback(async () => {
    try {
      await Share.share({
        message: `"${frase}" — Tim Maia`,
        title:   'Frase de Tim Maia',
      });
    } catch {}
  }, [frase]);

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <Video
        key={videoUrl}
        ref={videoRef}
        source={{
          uri: videoUrl,
          bufferConfig: BUFFER_CONFIG,
        }}
        style={StyleSheet.absoluteFill}
        muted
        repeat={false}
        resizeMode="cover"
        paused={false}
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="ignore"
        controls={false}
        disableFocus
        androidLayerType="none"
        onLoad={handleVideoLoad}
        onSeek={handleVideoSeek}
        onEnd={handleVideoEnd}
        onError={handleVideoError}
      />

      <View style={[StyleSheet.absoluteFill, s.overlay]} pointerEvents="none" />

      <View style={s.content}>
        <Animated.View
          style={[
            s.card,
            {
              opacity: fadeAnim,
              transform: [{
                scale: fadeAnim.interpolate({
                  inputRange:  [0, 1],
                  outputRange: [0.97, 1],
                }),
              }],
            },
          ]}
        >
          <Text style={s.aspas}>"</Text>
          <Text style={s.frase}>{frase}</Text>
          <Text style={s.autor}>— Tim Maia</Text>
        </Animated.View>

        <View style={s.botoesRow}>
          <TouchableOpacity
            style={[s.botao, s.botaoPrimario]}
            onPress={trocarFrase}
            activeOpacity={0.8}
          >
            <Text style={s.botaoTexto}>Próxima frase</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.botao, s.botaoSecundario]}
            onPress={compartilhar}
            activeOpacity={0.8}
          >
            <Text style={s.botaoTexto}>Compartilhar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  overlay: {
    backgroundColor: OVERLAY,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  card: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: CARD,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 28,
    paddingVertical: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 10,
  },
  aspas: {
    fontSize: 84,
    lineHeight: 72,
    color: RED,
    fontWeight: '900',
    marginBottom: 8,
    opacity: 0.9,
  },
  frase: {
    color: WHITE,
    fontSize: 22,
    lineHeight: 34,
    textAlign: 'justify',
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  autor: {
    marginTop: 24,
    textAlign: 'right',
    color: GOLD,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  botoesRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  botao: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  botaoPrimario: {
    backgroundColor: 'rgba(201,168,76,0.18)',
    borderColor: GOLD,
  },
  botaoSecundario: {
    backgroundColor: 'rgba(201,168,76,0.10)',
    borderColor: GOLD,
  },
  botaoTexto: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
