import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, FlatList, StyleSheet, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import base64 from 'base-64';
import Admob from '../../admob'

const cloudName = 'dib0twra5';
const apiKey = '472745782282797';
const apiSecret = 'lAPoqRdg0lsTVKUAbWnBEdUtyi0';

const App = () => {
  const navigation = useNavigation();
  const [videos, setVideos] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async (cursor = null) => {
    setLoading(true);
    try {
      let url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/video/upload?prefix=Tim Maia Dados/Entrevistas/`
      if (cursor) {
        url += `&next_cursor=${cursor}`;
      }

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Basic ${base64.encode(`${apiKey}:${apiSecret}`)}`,
        },
      });

      const newVideos = response.data.resources.map(item => ({
        public_id: item.public_id,
        secure_url: item.secure_url,
        thumbnail_url: `https://res.cloudinary.com/${cloudName}/video/upload/${item.public_id}.jpg`,
      }));

      setVideos(prevVideos => {
        const videoMap = new Map();
        [...prevVideos, ...newVideos].forEach(video => {
          videoMap.set(video.public_id, video);
        });
        return Array.from(videoMap.values());
      });

      if (response.data.next_cursor) {
        setNextCursor(response.data.next_cursor);
      } else {
        setNextCursor(null);
      }

    } catch (error) {
      console.error('Erro ao buscar vídeos:', error);
    } finally {
      setLoading(false);
    }
  };

  const openVideo = (video) => {
    navigation.navigate('entrevista2', { videoUrl: video.secure_url });
  };

  const formatFileName = (fileName) => {
    const baseName = fileName.substring(0, fileName.lastIndexOf('_'));
    return baseName
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  const renderVideoItem = ({ item }) => {
    const videoName = item.public_id.split('/').pop();
    const formattedName = formatFileName(videoName); 
    
    if (!formattedName) {
      return null; 
    }

    return (
      <View style={styles.item}>
        <TouchableOpacity onPress={() => openVideo(item)} style={{ flexDirection: 'column', alignItems: 'center' }}>
          <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} />
          <Text style={styles.title}>{formattedName}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const loadMoreVideos = () => {
    if (nextCursor) {
      fetchVideos(nextCursor);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading && videos.length === 0 ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : (
        <FlatList
          data={videos}
          renderItem={renderVideoItem}
          keyExtractor={(item, index) => `${item.public_id}_${index}`}
          onEndReached={loadMoreVideos}
          onEndReachedThreshold={0.10}
          ListFooterComponent={loading ? <ActivityIndicator size="small" color="#fff" /> : null}
        />
      )}
      <Admob />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  item: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    paddingTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  thumbnail: {
    width: 300,
    height: 300,
    borderRadius: 10,
  },
});

export default App;
