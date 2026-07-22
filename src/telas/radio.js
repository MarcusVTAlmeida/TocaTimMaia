import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet, Text, View,
  SafeAreaView, TouchableOpacity, ActivityIndicator,
  StatusBar, Animated, Dimensions, ScrollView,
} from "react-native";
import Video from 'react-native-video';
import { Icon } from 'react-native-elements';
import TrackPlayer, { State, usePlaybackState } from '@vmsilva/react-native-track-player';
import { setupPlayer } from '../../trackPlayerServices';
import { useFocusEffect } from '@react-navigation/native';
import { buscarShows } from '../componentes/shows';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const HEADER_ESTIMATED    = 80;
const INFO_CARD_ESTIMATED = 140;
const CONTROLS_ESTIMATED  = 140;
const RODAPE_ESTIMATED    = 40;
const GAPS_ESTIMATED      = 80;

const availableHeight   = SCREEN_HEIGHT - HEADER_ESTIMATED - INFO_CARD_ESTIMATED - CONTROLS_ESTIMATED - RODAPE_ESTIMATED - GAPS_ESTIMATED;
const maxCircleByHeight = Math.max(200, Math.min(availableHeight, 400));
const CIRCLE            = Math.min(SCREEN_WIDTH * 0.90, maxCircleByHeight);
const RADIUS            = CIRCLE / 2;

const GOLD = "#C9A84C";
const BG   = "#0a0a0a";
const CARD = "#141414";
const RED  = "#E53935";

const RADIO_URL = "https://stream-177.surfernetwork.com/6x7g9kxqb0hvv?zt=eyJhbGciOiJIUzI1NiJ9.eyJzdHJlYW0iOiI2eDdnOWt4cWIwaHZ2IiwiaG9zdCI6InN0cmVhbS0xNzcuc3VyZmVybmV0d29yay5jb20iLCJydHRsIjo1LCJqdGkiOiIzSENrUEh1UVJzMnljWjdHWjI1VXR3IiwiaWF0IjoxNzgxNjQ5MDk2LCJleHAiOjE3ODE2NDkxNTZ9.GGWtLGNfcojJ--Kv6Ci5p1t0LyA36IG6U07-w-byCp6o";

const BUFFER_CONFIG = {
  minBufferMs: 1000,
  maxBufferMs: 5000,
  bufferForPlaybackMs: 500,
  bufferForPlaybackAfterRebufferMs: 1000,
};

export default function Radio() {
  const playbackState = usePlaybackState();
  const [trackCarregada, setTrackCarregada]   = useState(false);
  const [videoCarregando, setVideoCarregando] = useState(true);
  const [videoPronto, setVideoPronto]         = useState(false);
  const [shows, setShows] = useState([]);
  const [showIndex, setShowIndex] = useState(0);
  const [randomOffset, setRandomOffset] = useState(0);

  const pulseAnim       = useRef(new Animated.Value(1)).current;
  const videoRef        = useRef(null);
  const seekTimeoutRef  = useRef(null);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  useEffect(() => {
    buscarShows().then((lista) => {
      if (lista.length > 0) setShows(lista);
    });
  }, []);

  const showAtual = shows.length > 0 ? shows[showIndex % shows.length] : null;
  const videoUrl  = showAtual ? showAtual.downloadUrl : null;
  const posterUrl = showAtual ? showAtual.imagem : 'https://drive.google.com/uc?export=view&id=1bk5B2TIRFJEP8U0KsNF2WOZL0TCGczgE';

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

  useEffect(() => {
    setVideoCarregando(true);
    setVideoPronto(false);
    const timeout = setTimeout(() => {
      setVideoPronto(true);
      setVideoCarregando(false);
    }, 6000);
    return () => clearTimeout(timeout);
  }, [videoUrl]);

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
    setVideoPronto(true);
    setVideoCarregando(false);
  }, []);

  const handleVideoEnd = useCallback(() => {
    randomizarVideo();
  }, [randomizarVideo]);

  const handleVideoError = useCallback((e) => {
    console.warn('Erro vídeo rádio:', e);
    randomizarVideo();
  }, [randomizarVideo]);

  useFocusEffect(
    useCallback(() => {
      async function garantirFaixa() {
        try {
          await setupPlayer();
          const queue       = await TrackPlayer.getQueue();
          const jaTemRadio  = queue.length === 1 && queue[0]?.id === 'radio_ao_vivo';
          if (!jaTemRadio) {
            await TrackPlayer.reset();
            await TrackPlayer.add({
              id:          'radio_ao_vivo',
              url:         RADIO_URL,
              title:       'Tim Maia FM',
              artist:      'Ao Vivo · 24h',
              artwork:     'https://drive.google.com/uc?export=view&id=1D20DIGZ6kdeNzLsoARG5if6Sb7f-_Gb7',
              isLiveStream: true,
            });
          }
          setTrackCarregada(true);
        } catch (e) {
          console.warn('Erro ao garantir faixa:', e);
          setTrackCarregada(true);
        }
      }
      garantirFaixa();
      return () => { setTrackCarregada(false); };
    }, [])
  );

  const state       = playbackState?.state;
  const isPlaying   = state === State.Playing;
  const isBuffering = state === State.Loading || state === State.Buffering;
  const isLoading   = !trackCarregada || isBuffering;

  const statusLabel = isBuffering && trackCarregada
    ? "Conectando..."
    : isPlaying
      ? "Transmitindo ao vivo"
      : "Fora do ar";

  const statusColor = isPlaying ? "#22C55E" : isBuffering ? GOLD : "#555";

  const togglePlayback = useCallback(async () => {
    if (!trackCarregada) return;
    try {
      const queue = await TrackPlayer.getQueue();
      if (queue.length === 0 || queue[0]?.id !== 'radio_ao_vivo') {
        await TrackPlayer.reset();
        await TrackPlayer.add({
          id:          'radio_ao_vivo',
          url:         RADIO_URL,
          title:       'Tim Maia FM',
          artist:      'Ao Vivo · 24h',
          artwork:     'https://drive.google.com/uc?export=view&id=1D20DIGZ6kdeNzLsoARG5if6Sb7f-_Gb7',
          isLiveStream: true,
        });
      }
      if (isPlaying) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
    } catch (e) {
      console.warn('Erro no togglePlayback:', e);
    }
  }, [isPlaying, trackCarregada]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {videoCarregando && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          videoCarregando && { opacity: 0 },
        ]}
        showsVerticalScrollIndicator={false}
        pointerEvents={videoCarregando ? 'none' : 'auto'}
      >

        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>🎷 Toca Tim Maia</Text>
        </View>

        <View style={styles.capaWrapper}>
          <View style={[styles.ring, { width: CIRCLE + 40, height: CIRCLE + 40, borderColor: GOLD + "12" }]} />
          <View style={[styles.ring, { width: CIRCLE + 20, height: CIRCLE + 20, borderColor: GOLD + "22" }]} />
          <View style={[styles.ring, { width: CIRCLE + 6,  height: CIRCLE + 6,  borderColor: GOLD + "38" }]} />

          <View style={styles.videoContainer} pointerEvents="none">
            <Video
              key={videoUrl}
              ref={videoRef}
              source={{
                uri: videoUrl,
                bufferConfig: BUFFER_CONFIG,
              }}
              style={styles.video}
              muted
              repeat={false}
              resizeMode="cover"
              paused={!videoPronto}
              playInBackground={false}
              playWhenInactive={false}
              ignoreSilentSwitch="ignore"
              controls={false}
              disableFocus
              androidLayerType="none"
              poster={posterUrl}
              posterStyle={{ resizeMode: 'cover' }}
              onLoad={handleVideoLoad}
              onSeek={handleVideoSeek}
              onEnd={handleVideoEnd}
              onError={handleVideoError}
            />
          </View>

          <View style={styles.videoBorda} />
        </View>

        <View style={styles.infoCard}>
          <View style={styles.badgeRow}>
            {isPlaying && (
              <Animated.View style={[styles.pulseDot, { transform: [{ scale: pulseAnim }] }]} />
            )}
            <Text style={[styles.badge, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
          <Text style={styles.radioNome}>Tim Maia FM</Text>
          <Text style={styles.radioSub}>A rádio do Rei do Soul · 24h no ar</Text>
          <View style={styles.divider} />
          <View style={styles.freqRow}>
            <Icon name="radio" type="material-icons" size={13} color="#444" />
            <Text style={styles.freqTexto}>Streaming</Text>
          </View>
        </View>

        <View style={styles.controles}>
          <TouchableOpacity
            style={[styles.playBtn, isLoading && { opacity: 0.6 }]}
            onPress={togglePlayback}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="large" color={BG} />
            ) : (
              <Icon
                name={isPlaying ? "pause" : "play"}
                type="material-community"
                size={32}
                color={BG}
                containerStyle={!isPlaying && { marginLeft: 4 }}
              />
            )}
          </TouchableOpacity>
        </View>

        {isPlaying && (
          <View style={styles.equalizador}>
            {[1, 0.5, 0.8, 0.4, 0.9, 0.6, 1, 0.3, 0.7].map((h, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.barra,
                  {
                    height: 24 * h,
                    backgroundColor: GOLD,
                    opacity: 0.6 + h * 0.4,
                  },
                ]}
              />
            ))}
          </View>
        )}

        <Text style={styles.rodape}>
          "Eu prefiro ser essa metamorfose ambulante."
        </Text>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BG,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 16,
  },
  header: {
    alignItems: "center",
    paddingTop: 0,
    paddingBottom: 4,
  },
  headerEyebrow: {
    color: GOLD,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 4,
  },
  capaWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    width: CIRCLE + 40,
    height: CIRCLE + 40,
  },
  ring: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
  },
  videoContainer: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: RADIUS,
    overflow: "hidden",
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  video: {
    position: "absolute",
    top: 0,
    left: 0,
    width: CIRCLE,
    height: CIRCLE,
  },
  videoBorda: {
    position: "absolute",
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: RADIUS,
    borderWidth: 3,
    borderColor: GOLD,
    pointerEvents: "none",
  },
  infoCard: {
    backgroundColor: CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1f1f1f",
    paddingHorizontal: 28,
    paddingVertical: 16,
    marginTop: 16,
    width: SCREEN_WIDTH - 32,
    alignItems: "center",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: RED,
  },
  badge: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  radioNome: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  radioSub: {
    color: "#555",
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: "#222",
    marginVertical: 10,
  },
  freqRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  freqTexto: {
    color: "#444",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  controles: {
    marginTop: 20,
    alignItems: "center",
  },
  playBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  equalizador: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    marginTop: 16,
    height: 28,
  },
  barra: {
    width: 4,
    borderRadius: 2,
  },
  rodape: {
    color: "#2a2a2a",
    fontSize: 11,
    fontStyle: "italic",
    textAlign: "center",
    paddingHorizontal: 32,
    marginTop: 24,
  },
});
