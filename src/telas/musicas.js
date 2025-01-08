import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import axios from 'axios';
import base64 from 'base-64';
import { Icon } from 'react-native-elements';
import Admob from '../../admob';

const cloudName = 'dib0twra5'; // Substitua com seu cloud_name do Cloudinary
const apiKey = '472745782282797'; // Substitua com sua api_key do Cloudinary
const apiSecret = 'lAPoqRdg0lsTVKUAbWnBEdUtyi0'; // Substitua com seu api_secret do Cloudinary

const MusicaScreen = ({ route, navigation }) => {
  const { albumFolder, albumImage } = route.params;
  const [musicas, setMusicas] = useState([]);

  useEffect(() => {
    fetchMusicas();
  }, []);

  const fetchMusicas = async () => {
    try {
      const response = await axios.get(
        `https://api.cloudinary.com/v1_1/${cloudName}/resources/video/upload?prefix=${albumFolder}&type=upload`,
        {
          headers: {
            'Authorization': `Basic ${base64.encode(`${apiKey}:${apiSecret}`)}`,
          },
        }
      );
      setMusicas(response.data.resources);
    } catch (error) {
      console.error('Erro ao buscar músicas:', error);
    }
  };

  const formatFileName = (fileName) => {
    const baseName = fileName.substring(0, fileName.lastIndexOf('_'));
    return baseName
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  const renderMusica = ({ item }) => {
    const fileName = item.public_id.split('/').pop();
    const formattedName = formatFileName(fileName);

    return (
      <View style={styles.item}>
        <Icon name='musical-note' type="ionicon" />
        <TouchableOpacity onPress={() => navigation.navigate('player', { musicUrl: item.secure_url, albumImage, formattedName })} style={{ padding: 10, alignItems: 'center', flexDirection: 'row' }}>
          <Text style={styles.title}>{formattedName}</Text>
        </TouchableOpacity>
        <Icon name='musical-notes' type="ionicon" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={{ alignItems: 'center', alignSelf: 'center', flex: 1 }}>
        </View>
        <View style={{ alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 30, color: 'white' }}>Músicas</Text>
        </View>
        <FlatList
          data={musicas}
          renderItem={renderMusica}
          keyExtractor={item => item.public_id}
        />
        <View style={{ alignItems: 'center', alignSelf: 'center', flex: 1, bottom: 0 }}>
        </View>
      </ScrollView>
      <Admob />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black'
  },
  item: {
    backgroundColor: '#d3d3d3',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    alignContent: 'center'
  },
  title: {
    fontSize: 18,
    width: 250,
    color: 'black'
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'white'
  },
});

export default MusicaScreen;
