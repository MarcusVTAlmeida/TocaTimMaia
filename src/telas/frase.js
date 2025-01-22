import React, { useState } from 'react';
import { Dimensions, Text, View, Image, Share, TouchableOpacity } from 'react-native';
import frases from '../componentes/frases';
import Admob from '../../admob';

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function App() {
  const [fraseEscolhida, setFraseEscolhida] = useState(frases[Math.floor(Math.random() * 44)]);

  const botaoPressionado = () => {
    const numeroAleatorio = Math.floor(Math.random() * 44);
    setFraseEscolhida(frases[numeroAleatorio]);
  };

  const onShare = async () => {
    try {
      const result = await Share.share({
        message: fraseEscolhida
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
        } else {
        }
      } else if (result.action === Share.dismissedAction) {
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <View style={{ backgroundColor: 'black', flex: 1 }}>
      <Image
    source={{ uri: 'https://res.cloudinary.com/dib0twra5/image/upload/v1736540029/Cazuza%20Dados/estampa_cazuza_ouroboros_2_ysz0vj.jpg' }}
        style={{ width: SCREEN_WIDTH, height: 400, alignSelf: 'center' }}
      />
      <Text style={{ color: 'white', textAlign: 'justify', padding: 10, alignSelf: 'center', fontSize: 20, fontFamily: 'LangarRegular' }}>
        {fraseEscolhida}
      </Text>
      <View style={{ flexDirection: 'row', alignSelf: 'center', position: 'absolute', bottom: 100, justifyContent: 'center' }}>
        <TouchableOpacity style={{ backgroundColor: "#edc482", padding: 10, borderWidth: 1, borderRadius: 50, borderColor: 'white' }} onPress={botaoPressionado}>
          <Text style={{ color: 'black', fontSize: 24 }}>Próximo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ backgroundColor: "#be858b", padding: 10, marginLeft: 50, borderWidth: 1, borderRadius: 50, borderColor: 'white' }} onPress={onShare}>
          <Text style={{ color: 'white', fontSize: 24 }}>Compartilhar</Text>
        </TouchableOpacity>
      </View>
      {/* <View style={{ position: "absolute", bottom: 0 }}>
        <Admob />
      </View> */}
    </View>
  );
}
