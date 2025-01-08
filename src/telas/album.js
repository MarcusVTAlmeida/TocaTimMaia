import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, FlatList, StyleSheet, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import base64 from 'base-64';

// Substitua com seu cloud_name, api_key, e api_secret do Cloudinary
const cloudName = 'dib0twra5';
const apiKey = '472745782282797';
const apiSecret = 'lAPoqRdg0lsTVKUAbWnBEdUtyi0';

const App = () => {
  const navigation = useNavigation();
  const [albums, setAlbums] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async (cursor = null) => {
    setLoading(true);
    try {
      let url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload?prefix=Tim Maia/`;
      if (cursor) {
        url += `&next_cursor=${cursor}`;
      }

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Basic ${base64.encode(`${apiKey}:${apiSecret}`)}`,
        },
      });

      const newAlbums = response.data.resources.map(item => ({
        public_id: item.public_id,
        secure_url: item.secure_url,
      }));
      setAlbums(prevAlbums => {
        const albumMap = new Map();
        [...prevAlbums, ...newAlbums].forEach(album => {
          albumMap.set(album.public_id, album);
        });
        return Array.from(albumMap.values());
      });

      if (response.data.next_cursor) {
        setNextCursor(response.data.next_cursor);
      } else {
        setNextCursor(null);
      }

      console.log('Álbuns:', newAlbums);
      console.log('Próximo cursor:', response.data.next_cursor);

    } catch (error) {
      console.error('Erro ao buscar álbuns:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAlbum = (album) => {
    const albumFolder = album.public_id.split('/').slice(0, -1).join('/');
    const albumImage = album.secure_url;
    navigation.navigate('musicas', { albumFolder, albumImage });
  };

  const renderItem = ({ item }) => {
    const albumPathParts = item.public_id.split('/');
    const albumName = albumPathParts.slice(1, 2).join('');
    return (
      <View style={styles.item}>
        <TouchableOpacity onPress={() => openAlbum(item)} style={{ flexDirection: 'column', alignItems: 'center' }}>
          <Image source={{ uri: item.secure_url }} style={styles.albumImage} />
          <Text style={styles.title}>{albumName}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const loadMoreAlbums = () => {
    if (nextCursor) {
      fetchAlbums(nextCursor);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading && albums.length === 0 ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : (
        <FlatList
          data={albums}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.public_id}_${index}`}
          onEndReached={loadMoreAlbums}
          onEndReachedThreshold={0.10}
          ListFooterComponent={loading ? <ActivityIndicator size="small" color="#fff" /> : null}
        />
      )}
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
  albumImage: {
    width: 300,
    height: 300,
    borderRadius: 10,
  },
});

export default App;
