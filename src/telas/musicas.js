import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView, View, StyleSheet, Text, TouchableOpacity,
  Image, Alert, Modal, ScrollView, StatusBar, Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import TrackPlayer, {
  State, Capability, AppKilledPlaybackBehavior,
  usePlaybackState, useProgress, useActiveTrack,
  Event, useTrackPlayerEvents,
} from '@vmsilva/react-native-track-player';
import { Icon } from 'react-native-elements';
import { setupPlayer } from '../../trackPlayerServices';
import { useFocusEffect } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const C = {
  bg:       '#0a0a0a',
  surface:  '#111111',
  card:     '#181818',
  border:   '#1f1f1f',
  accent:   '#ff0044',
  accentDim:'#ff004433',
  gold:     '#C9A84C',
  white:    '#ffffff',
  muted:    '#555555',
  text:     '#cccccc',
};

const Musicas = ({ route }) => {
  const { musicas, imagem, album } = route.params;

  const playbackState  = usePlaybackState();
  const { position, duration } = useProgress(250);
  const activeTrack    = useActiveTrack();

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [showModal,   setShowModal]   = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [isReady,     setIsReady]     = useState(false);

  const mp3s = musicas
    .filter(m => m.nome.toLowerCase().endsWith('.mp3'))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const formatTrackTitle = (rawName, index) => {
    if (!rawName) return '';
    let name = rawName.replace(/\.mp3$/i, '');
    name = name.replace(/[|$|$].*?[$|$|]/g, '');
    name = name.replace(/[-_.]/g, ' ');
    name = name.replace(/\s+/g, ' ').trim();
    name = name.replace(/\btim\s+maia\b/gi, '').trim();
    name = name.replace(/\b\d{1,3}\b/g, '').trim();
    name = name.replace(/\s+/g, ' ').trim();
    const title = name.replace(/[^\p{L}\p{N}\s]/gu, '').trim();
    return `${title}`;
  };

  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], async () => {
    const index = await TrackPlayer.getActiveTrackIndex();
    if (index !== null && index !== undefined) setCurrentTrackIndex(index);
  });

  const tracks = mp3s.map((m, index) => ({
    id: index,
    url: m.url,
    title: formatTrackTitle(m.nome, index),
    artist: album,
    artwork: imagem,
  }));

  const isPlaying = playbackState?.state === State.Playing;

useFocusEffect(
  useCallback(() => {
    async function startPlayer() {
      try {
        await setupPlayer();

        const queue = await TrackPlayer.getQueue();

        const jaTemEsteAlbum = queue.length > 0 && queue[0]?.artist === album;

        if (jaTemEsteAlbum) {

          const index = await TrackPlayer.getActiveTrackIndex();
          if (index !== null && index !== undefined) setCurrentTrackIndex(index);
          setIsReady(true);
        } else {

          await TrackPlayer.reset();
          await TrackPlayer.add(tracks);
          setCurrentTrackIndex(0);
          setIsReady(true);
          await TrackPlayer.play();
        }
      } catch (err) {
        Alert.alert('Erro ao iniciar o player', err?.message || 'Erro desconhecido');
      }
    }
    startPlayer();

    return () => {

    };
  }, [album])
);

  const playTrack = useCallback(async (trackId) => {
    try {
      await TrackPlayer.skip(trackId);
      await TrackPlayer.play();
      setCurrentTrackIndex(trackId);
    } catch { Alert.alert('Erro', 'Não foi possível tocar esta música.'); }
  }, []);

  const togglePlayback = useCallback(async () => {
    try {
      isPlaying ? await TrackPlayer.pause() : await TrackPlayer.play();
    } catch (e) { console.warn('Erro no togglePlayback:', e); }
  }, [isPlaying]);

  const skipNext = useCallback(async () => {
    try {
      const queue = await TrackPlayer.getQueue();
      const currentIndex = await TrackPlayer.getActiveTrackIndex();
      if (!queue.length || currentIndex === null) return;
      if (isShuffling) {
        const r = Math.floor(Math.random() * queue.length);
        await TrackPlayer.skip(r); await TrackPlayer.play(); setCurrentTrackIndex(r);
      } else if (currentIndex < queue.length - 1) {
        const n = currentIndex + 1;
        await TrackPlayer.skip(n); await TrackPlayer.play(); setCurrentTrackIndex(n);
      } else if (isRepeating) {
        await TrackPlayer.skip(0); await TrackPlayer.play(); setCurrentTrackIndex(0);
      }
    } catch { Alert.alert('Erro', 'Não foi possível avançar.'); }
  }, [isShuffling, isRepeating]);

  const skipPrev = useCallback(async () => {
    try {
      const queue = await TrackPlayer.getQueue();
      const currentIndex = await TrackPlayer.getActiveTrackIndex();
      if (!queue.length || currentIndex === null) return;
      if (currentIndex > 0) {
        const p = currentIndex - 1;
        await TrackPlayer.skip(p); await TrackPlayer.play(); setCurrentTrackIndex(p);
      } else if (isRepeating) {
        const last = queue.length - 1;
        await TrackPlayer.skip(last); await TrackPlayer.play(); setCurrentTrackIndex(last);
      }
    } catch { Alert.alert('Erro', 'Não foi possível voltar.'); }
  }, [isRepeating]);

  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        <View style={s.heroSection}>
          <View style={s.artworkWrapper}>
            <Image source={{ uri: imagem }} style={s.artwork} />
            <View style={s.artworkGlow} />
          </View>
          <Text style={s.albumTitle}>{album}</Text>
          <Text style={s.albumSubtitle}>
            {tracks.length} {tracks.length === 1 ? 'faixa' : 'faixas'}
          </Text>
        </View>

        <View style={s.divider} />

        <View style={s.trackList}>
          {tracks.map((item) => {
            const active = item.id === currentTrackIndex;
            return (
              <TouchableOpacity
                key={item.id}
                style={[s.trackRow, active && s.trackRowActive]}
                onPress={() => playTrack(item.id)}
                activeOpacity={0.7}
              >

                <View style={[s.trackNum, active && s.trackNumActive]}>
                  {active && isPlaying
                    ? <Icon name="musical-notes" type="ionicon" size={14} color={C.accent} />
                    : <Text style={[s.trackNumText, active && { color: C.accent }]}>
                        {(item.id + 1).toString().padStart(2, '0')}
                      </Text>
                  }
                </View>

                <Text
                  style={[s.trackTitle, active && s.trackTitleActive]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>

                <Icon
                  name={active && isPlaying ? 'pause' : 'play'}
                  type="ionicon"
                  size={18}
                  color={active ? C.accent : C.muted}
                />
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      {isReady && (
        <TouchableOpacity style={s.miniPlayer} onPress={() => setShowModal(true)} activeOpacity={0.9}>

          <View style={s.miniProgress}>
            <View style={[s.miniProgressFill, { width: `${progressPercent}%` }]} />
          </View>

          <View style={s.miniContent}>
            <Image source={{ uri: imagem }} style={s.miniArtwork} />
            <View style={s.miniInfo}>
              <Text numberOfLines={1} style={s.miniTitle}>
                {tracks[currentTrackIndex]?.title}
              </Text>
              <Text numberOfLines={1} style={s.miniAlbum}>{album}</Text>
            </View>
            <TouchableOpacity onPress={skipPrev} style={s.miniBtn}>
              <Icon name="play-skip-back" type="ionicon" color={C.text} size={22} />
            </TouchableOpacity>
            <TouchableOpacity onPress={togglePlayback} style={s.miniBtn}>
              <Icon
                name={isPlaying ? 'pause-circle' : 'play-circle'}
                type="ionicon"
                color={C.accent}
                size={44}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={skipNext} style={s.miniBtn}>
              <Icon name="play-skip-forward" type="ionicon" color={C.text} size={22} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      <Modal animationType="slide" transparent={false} visible={showModal} onRequestClose={() => setShowModal(false)}>
        <SafeAreaView style={s.modalBg}>
          <StatusBar barStyle="light-content" backgroundColor={C.bg} />

          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)} style={s.modalClose}>
              <Icon name="chevron-down" type="ionicon" color={C.text} size={28} />
            </TouchableOpacity>
            <Text style={s.modalHeaderLabel}>TOCANDO AGORA</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={s.modalArtworkContainer}>
            <View style={s.modalArtworkGlow} />
            <Image source={{ uri: imagem }} style={s.modalArtwork} />
          </View>

          <View style={s.modalTrackInfo}>
            <Text style={s.modalTrackTitle} numberOfLines={2}>
              {tracks[currentTrackIndex]?.title}
            </Text>
            <Text style={s.modalTrackAlbum}>{album}</Text>
          </View>

          <View style={s.sliderContainer}>
            <Slider
              value={position}
              minimumValue={0}
              maximumValue={duration || 1}
              minimumTrackTintColor={C.accent}
              maximumTrackTintColor={C.border}
              thumbTintColor={C.accent}
              onSlidingComplete={async (v) => await TrackPlayer.seekTo(v)}
              style={{ width: '100%', height: 40 }}
            />
            <View style={s.timeRow}>
              <Text style={s.timeText}>{formatTime(position)}</Text>
              <Text style={s.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          <View style={s.modalControls}>
            <TouchableOpacity onPress={() => setIsShuffling(p => !p)} style={s.controlBtn}>
              <Icon name="shuffle" type="ionicon" color={isShuffling ? C.accent : C.muted} size={24} />
            </TouchableOpacity>

            <TouchableOpacity onPress={skipPrev} style={s.controlBtn}>
              <Icon name="play-skip-back" type="ionicon" color={C.white} size={34} />
            </TouchableOpacity>

            <TouchableOpacity onPress={togglePlayback} style={s.playBtn}>
              <Icon
                name={isPlaying ? 'pause' : 'play'}
                type="ionicon"
                color={C.white}
                size={32}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={skipNext} style={s.controlBtn}>
              <Icon name="play-skip-forward" type="ionicon" color={C.white} size={34} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsRepeating(p => !p)} style={s.controlBtn}>
              <Icon name="repeat" type="ionicon" color={isRepeating ? C.accent : C.muted} size={24} />
            </TouchableOpacity>
          </View>

        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  heroSection: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, paddingHorizontal: 20 },
  artworkWrapper: { position: 'relative', marginBottom: 20 },
  artwork: {
    width: SCREEN_WIDTH * 0.62,
    height: SCREEN_WIDTH * 0.62,
    borderRadius: 12,
  },
  artworkGlow: {
    position: 'absolute', bottom: -12, left: '10%', right: '10%', height: 40,
    opacity: 0.18,
    borderRadius: 50,

    transform: [{ scaleX: 1.1 }],
  },
  albumTitle: {
    color: C.white, fontSize: 22, fontWeight: '800',
    textAlign: 'center', marginBottom: 4, letterSpacing: 0.5,
  },
  albumSubtitle: { color: C.muted, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' },

  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 20, marginBottom: 8 },

  trackList: { paddingHorizontal: 16 },
  trackRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 12,
    borderRadius: 10, marginBottom: 4,
    gap: 12,
  },
  trackRowActive: {
    backgroundColor: C.accentDim,
    borderWidth: 1, borderColor: '#ff004466',
  },
  trackNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
  },
  trackNumActive: { backgroundColor: '#ff004422' },
  trackNumText: { color: C.muted, fontSize: 11, fontWeight: '700' },
  trackTitle: { flex: 1, color: C.text, fontSize: 14, fontWeight: '500' },
  trackTitleActive: { color: C.white, fontWeight: '700' },

  resumoBox: {
    flexDirection: 'row', margin: 20, backgroundColor: C.card,
    borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: C.border,
  },
  resumoAccent: { width: 3, backgroundColor: C.accent },
  resumoText: { flex: 1, color: C.text, fontSize: 14, lineHeight: 22, padding: 16 },

  miniPlayer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#161616',
    borderTopWidth: 1, borderColor: C.border,
  },
  miniProgress: { height: 2, backgroundColor: C.border },
  miniProgressFill: { height: 2, backgroundColor: C.accent },
  miniContent: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
  },
  miniArtwork: { width: 44, height: 44, borderRadius: 6 },
  miniInfo: { flex: 1 },
  miniTitle: { color: C.white, fontSize: 14, fontWeight: '600' },
  miniAlbum: { color: C.muted, fontSize: 11, marginTop: 2 },
  miniBtn: { padding: 4 },

  modalBg: { flex: 1, backgroundColor: C.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  modalClose: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  modalHeaderLabel: {
    color: C.muted, fontSize: 11, fontWeight: '700',
    letterSpacing: 2, textTransform: 'uppercase',
  },
  modalArtworkContainer: {
    alignItems: 'center', paddingHorizontal: 40, marginBottom: 32, position: 'relative',
  },
  modalArtworkGlow: {
    position: 'absolute', bottom: -20, left: '15%', right: '15%', height: 60,
     opacity: 0.15, borderRadius: 50,
  },
  modalArtwork: {
    width: SCREEN_WIDTH - 80, height: SCREEN_WIDTH - 80,
    borderRadius: 16,
  },
  modalTrackInfo: { paddingHorizontal: 32, marginBottom: 24 },
  modalTrackTitle: {
    color: C.white, fontSize: 22, fontWeight: '800', marginBottom: 6, lineHeight: 28,
  },
  modalTrackAlbum: { color: C.muted, fontSize: 14, letterSpacing: 0.5 },
  sliderContainer: { paddingHorizontal: 28, marginBottom: 16 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
  timeText: { color: C.muted, fontSize: 12 },
  modalControls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 32, paddingTop: 8,
  },
  controlBtn: {
    width: 48, height: 48, alignItems: 'center', justifyContent: 'center',
  },
  playBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center',

    paddingLeft: 3,
  },
});

export default Musicas;