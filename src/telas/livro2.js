import React from 'react';
import { StyleSheet, Text, Image, View, ScrollView } from 'react-native';
import Admob from '../../admob'

const App = ({ route }) => {
  const { nome, imagem, resumo } = route.params;
  return (
    <View style={styles.container}>
      <ScrollView>
      <View style={{ flex: 1 }}>
        <Image source={{ uri: `${imagem}` }} style={{ width: 200, height: 300, alignSelf: 'center', paddingLeft: 20, paddingRight: 20, marginTop: 50 }}></Image>
        <Text style={{ alignSelf: 'center', paddingTop: 20, fontSize: 24, textAlign: 'justify', color: 'white' }}>{nome}</Text>
        <Text style={styles.title}>{resumo}</Text>
      </View>
      </ScrollView>     
          <Admob />
           </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black'
  },
  title: {
    paddingTop: 20,
    fontSize: 16,
    paddingLeft: 20,
    paddingRight: 20,
    textAlign: 'justify',
    color: 'white',
    marginBottom: 20
  },
});

export default App;