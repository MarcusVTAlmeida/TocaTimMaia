
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
} from '@vmsilva/react-native-track-player';

const STREAM_URL = 'https://node-05.zeno.fm/94zzgqmq54zuv?rj-ttl=5&rj-tok=AAABezhG5KEAyVBIAcTmuuYxaw';

export async function setupRadio() {
  let isSetup = false;
  try {
    await TrackPlayer.getCurrentTrack();
    isSetup = true;
  } catch {
    await TrackPlayer.setupPlayer();

    await TrackPlayer.updateOptions({
      android: {

        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.Stop,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
      ],
    });


    await TrackPlayer.add({
      id: 'radio_ao_vivo',
      url: STREAM_URL,
      title: 'Ao Vivo',
      artist: 'Rádio',
      artwork: 'https://res.cloudinary.com/dib0twra5/image/upload/v1595126394/DH81ox_rwxxjb.gif',
      isLiveStream: true,
    });

    isSetup = true;
  } finally {
    return isSetup;
  }
}

export async function playbackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    await TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, async () => {
    await TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteStop, async () => {
    await TrackPlayer.stop();
  });
}