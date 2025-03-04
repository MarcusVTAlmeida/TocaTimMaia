import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Card, Icon } from 'react-native-elements';
import Carousel from 'react-native-snap-carousel';
import axios from 'axios';
import base64 from 'base-64';
import Admob from '../../admob';
import livros from '../componentes/livros';

const cloudName = 'dib0twra5';
const apiKey = '472745782282797';
const apiSecret = 'lAPoqRdg0lsTVKUAbWnBEdUtyi0';

// Função para embaralhar arrays usando o algoritmo de Fisher-Yates
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      albuns: [],
      entrevistas: [],
      loadingAlbuns: true,
      loadingEntrevistas: true,
    };
  }

  componentDidMount() {
    this.fetchAlbuns();
    this.fetchEntrevistas();
  }

  fetchAlbuns = async () => {
    try {
      const response = await axios.get(`https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload?prefix=Tim Maia/`, {
        headers: {
          'Authorization': `Basic ${base64.encode(`${apiKey}:${apiSecret}`)}`,
        },
      });
      let albuns = response.data.resources.map(item => ({
        imagem: item.secure_url,
      }));
      albuns = shuffleArray(albuns); // Embaralhar álbuns
      this.setState({ albuns, loadingAlbuns: false });
    } catch (error) {
      console.error('Erro ao buscar álbuns:', error);
      this.setState({ loadingAlbuns: false });
    }
  };

  fetchEntrevistas = async () => {
    try {
      const response = await axios.get(`https://api.cloudinary.com/v1_1/${cloudName}/resources/video/upload?prefix=Tim Maia Dados/Entrevistas/`, {
        headers: {
          'Authorization': `Basic ${base64.encode(`${apiKey}:${apiSecret}`)}`,
        },
      });
      let entrevistas = response.data.resources.map(item => ({
        imagem: item.secure_url.replace('.mp4', '.jpg'), // Supondo que a imagem de pré-visualização tenha o mesmo nome do vídeo com extensão .jpg
        video: item.secure_url,
      }));
      entrevistas = shuffleArray(entrevistas); // Embaralhar entrevistas
      this.setState({ entrevistas, loadingEntrevistas: false });
    } catch (error) {
      console.error('Erro ao buscar entrevistas:', error);
      this.setState({ loadingEntrevistas: false });
    }
  };

  _renderAlbum = ({ item }) => (
    <View>
      <Image style={{ height: 250, width: 250 }} source={{ uri: item.imagem }} />
    </View>
  );

  _renderEntrevistas = ({ item }) => (
    <View>
      <Image style={{ height: 250, width: 250 }} source={{ uri: item.imagem }} />
    </View>
  );

  render() {
    const { albuns, entrevistas, loadingAlbuns, loadingEntrevistas } = this.state;

    return (
      <View style={{ flex: 1 }}>
        <ScrollView>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Image style={styles.avatar}
                source={{ uri: 'https://res.cloudinary.com/dib0twra5/image/upload/v1721696091/Tim%20Maia%20dados/nobody-can-live-forever-tim-maia_ilustra_pkgvay.webp'}} />
              <Text style={styles.name}>Tim Maia</Text>
              <Text style={styles.userInfo}>1942 - 1998</Text>
            </View>
          </View>
          <View style={styles.body}>
            <TouchableOpacity onPress={() => { const { navigate } = this.props.navigation; navigate('Biografia') }}>
              <Card>
              <Text style={{ marginBottom: 10, color: "#000000" }}>
                  Tim Maia (1942-1998) foi um icônico cantor e compositor brasileiro, famoso por sua voz poderosa e mistura única de soul, funk, jazz e rock. Nascido no Rio de Janeiro, ele começou sua carreira nos anos 1960 e alcançou grande sucesso na década de 1970 com hits como "Primavera" e "Azul da Cor do Mar". Conhecido tanto por seu talento quanto por seu comportamento excêntrico, Tim Maia deixou um legado duradouro com músicas como "Gostava Tanto de Você" e "Vale Tudo", tornando-se um dos maiores nomes da música brasileira.
                </Text>
              </Card>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { const { navigate } = this.props.navigation; navigate('Álbuns') }}>
              <Card>
                <Text style={{ fontSize: 25, alignSelf: 'center', color: "#000000" }}>Álbuns</Text>
                {loadingAlbuns ? (
                  <ActivityIndicator size="large" color="#0000ff" />
                ) : (
                  <Carousel
                    layout={'default'}
                    loop
                    autoplay
                    autoplayInterval={10000}
                    data={albuns}
                    sliderWidth={400}
                    itemWidth={300}
                    renderItem={this._renderAlbum}
                  />
                )}
              </Card>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { const { navigate } = this.props.navigation; navigate('Livros') }}>
              <Card>
                <Text style={{ fontSize: 25, alignSelf: 'center', color: "#000000" }}>Livros</Text>
                <Carousel
                  layout={'default'}
                  loop
                  autoplay
                  autoplayInterval={10000}
                  data={livros}
                  sliderWidth={400}
                  itemWidth={300}
                  renderItem={({ item }) => (
                    <View>
                      <Image style={{ height: 250, width: 250 }} source={{ uri: item.imagem }} />
                    </View>
                  )}
                />
              </Card>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { const { navigate } = this.props.navigation; navigate('Entrevistas') }}>
              <Card>
                <Text style={{ fontSize: 25, alignSelf: 'center', color: "#000000" }}>Entrevistas</Text>
                {loadingEntrevistas ? (
                  <ActivityIndicator size="large" color="#0000ff" />
                ) : (
                  <Carousel
                    layout={'default'}
                    loop
                    autoplay
                    autoplayInterval={10000}
                    data={entrevistas}
                    sliderWidth={400}
                    itemWidth={300}
                    renderItem={this._renderEntrevistas}
                  />
                )}
              </Card>
            </TouchableOpacity>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <TouchableOpacity onPress={() => { const { navigate } = this.props.navigation; navigate('Rádio') }}
                  style={styles.roundButton1}>
                  <Icon
                    name='radio'
                    type="material-community"
                  />
                  <Text style={{ color: 'black' }}>Rádio</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { const { navigate } = this.props.navigation; navigate('Frases') }}
                  style={styles.roundButton1}>
                  <Icon
                    name='text-long' type="material-community" />
                  <Text style={{ color: 'black' }}>Frases</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { const { navigate } = this.props.navigation; navigate('Documentário') }}
                  style={styles.roundButton1}>
                  <Icon
                    name='film' type="font-awesome" />
                  <Text style={{ color: 'black' }}>Documentário</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        </ScrollView>
        <View style={{ bottom: 0 }}>
          <Admob /> 
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#DCDCDC",
    flex: 1
  },
  headerContent: {
    padding: 30,
    alignItems: 'center',
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 63,
    borderWidth: 4,
    borderColor: "white",
    marginBottom: 10,
  },
  name: {
    fontSize: 22,
    color: "#000000",
    fontWeight: '600',
  },
  userInfo: {
    fontSize: 16,
    color: "#778899",
    fontWeight: '600',
  },
  body: {
    backgroundColor: "#778899",
    position: 'relative',
    flex: 1
  },
  item: {
    flexDirection: 'row',
  },
  infoContent: {
    alignItems: 'flex-start',
    paddingLeft: 5
  },
  iconContent: {
    alignItems: 'flex-end',
    paddingRight: 5,
  },
  icon: {
    width: 30,
    height: 30,
    marginTop: 20,
  },
  info: {
    fontSize: 18,
    marginTop: 20,
    color: "#FFFFFF",
  },
  roundButton1: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 100,
    elevation: 20,
  },
});
