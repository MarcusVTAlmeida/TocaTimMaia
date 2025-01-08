import React, { useRef, useState } from 'react';
import { View, StyleSheet, StatusBar, TouchableOpacity, Text, Dimensions } from 'react-native';
import Video from 'react-native-video';
import Orientation from 'react-native-orientation-locker';
import Icon from 'react-native-vector-icons/FontAwesome';

const VideoPlayer = ({ route }) => {
  const { videoUrl } = route.params;
  const videoRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleEnterFullscreen = () => {
    Orientation.lockToLandscape();
    setIsFullscreen(true);
  };

  const handleExitFullscreen = () => {
    Orientation.lockToPortrait();
    setIsFullscreen(false);
  };

  const handleEnd = () => {
    Orientation.lockToPortrait();
    setIsFullscreen(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden={isFullscreen} />
      <Video
        source={{ uri: videoUrl }}
        ref={videoRef}
        controls
        resizeMode="contain"
        style={styles.video}
        onEnd={handleEnd}
      />
      {!isFullscreen && (
        <TouchableOpacity style={styles.fullscreenButton} onPress={handleEnterFullscreen}>
          <Icon name="expand" size={30} color="white" />
        </TouchableOpacity>
      )}
      {isFullscreen && (
        <TouchableOpacity style={styles.exitFullscreenButton} onPress={handleExitFullscreen}>
          <Icon name="compress" size={30} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  video: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  fullscreenButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  exitFullscreenButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
});

export default VideoPlayer;
