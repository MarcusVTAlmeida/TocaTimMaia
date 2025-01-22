import * as React from 'react';
import { Text, View, ScrollView, StyleSheet } from 'react-native';
import { Avatar } from 'react-native-elements';
import Admob from '../../admob'

export default class App extends React.Component {

  render() {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.avatarContainer}>
            <Avatar
              size='xlarge'
              rounded
              source={{ uri: 'https://res.cloudinary.com/dib0twra5/image/upload/v1721696091/Tim%20Maia%20dados/nobody-can-live-forever-tim-maia_ilustra_pkgvay.webp' }} />
          </View>
          <View style={styles.textContainer}>
          <Text style={{ textAlign: 'justify', color: 'white' }}>Tim Maia, nascido Sebastião Rodrigues Maia em 28 de setembro de 1942 no Rio de Janeiro, foi um dos maiores nomes da música brasileira. Conhecido por sua voz potente e inconfundível, ele foi um pioneiro na introdução de soul, funk e disco no Brasil, misturando esses estilos com a música popular brasileira.

Tim Maia começou sua carreira musical nos anos 1960, após uma temporada nos Estados Unidos, onde teve contato com a música negra americana. Ao retornar ao Brasil, lançou seu primeiro álbum solo em 1970, que incluía sucessos como "Primavera" e "Azul da Cor do Mar". Este álbum foi apenas o início de uma carreira recheada de hits, como "Gostava Tanto de Você", "Não Quero Dinheiro (Só Quero Amar)", "Me Dê Motivo" e "Vale Tudo".

Além de cantor e compositor, Tim Maia era conhecido por seu comportamento excêntrico e imprevisível, o que incluía atrasos e cancelamentos de shows, e um estilo de vida hedonista. Apesar dessas controvérsias, sua genialidade musical nunca foi questionada.

Tim Maia faleceu em 15 de março de 1998, mas sua música continua a influenciar e encantar novas gerações. Sua contribuição para a música brasileira é imensurável, deixando um legado de inovação e paixão pela arte.</Text>
          </View>
        </ScrollView>
        <View style={styles.adContainer}>
          <Admob />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingLeft: 20,
    paddingRight: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: 'black',
  },
  textContainer: {
    marginBottom: 20,
  },
  text: {
    color: 'white',
    textAlign: 'justify',
    lineHeight: 22,
  },
  adContainer: {
    bottom: 0,
  },
});
