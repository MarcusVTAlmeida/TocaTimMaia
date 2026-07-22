import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import TrackPlayer from '@vmsilva/react-native-track-player';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';
import { playbackService } from './trackPlayerServices';

setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
});

AppRegistry.registerComponent(appName, () => App);

TrackPlayer.registerPlaybackService(() => playbackService);
