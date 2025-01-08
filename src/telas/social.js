import React from 'react';
import { SafeAreaView, StyleSheet, ScrollView, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { SocialIcon, Icon } from 'react-native-elements';
import Admob from '../../admob'

const App = () => {
  function linkingYoutube() {
    Linking.openURL('https://www.youtube.com/channel/UCQm7LSEuBoLHVIjWnDctW2Q');
  };
  function linkingFacebook() {
    Linking.openURL('https://www.facebook.com/TimMaiaOfficial');
  };
  function linkingInstagram() {
    Linking.openURL('https://www.instagram.com/timmaia.oficial');
  };
  function linkingSpotify() {
    Linking.openURL('https://open.spotify.com/intl-pt/artist/0jOs0wnXCu1bGGP7kh5uIu?si=vYfGBUHgR16EKS6-Je6mUw');
  };
  function linkingTwitter() {
    Linking.openURL('https://x.com/OficialTimMaia');
  };
  function linkingEmail() {
    Linking.openURL('mailto:carmelo@timmaia.com.br');
  };
  function linkingAmazonMusic() {
    Linking.openURL('https://music.amazon.com.br/artists/B000QJNPWU/tim-maia');
  };
  function linkingWeb() {
    Linking.openURL('http://www.timmaia.com.br/');
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
      <View style={{ alignItems: 'center', alignSelf: 'center' }}>
      </View>
      <ScrollView>
        <View style={styles.container}>
          <Text style={styles.heading} >
            Redes sociais oficiais
          </Text>
          <Text style={styles.textStyle}>TOCA TIM MAIA</Text>
          <View
            style={{
              flex: 1,
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
          </View>
          <View style={{ width: '100%', flexDirection: 'column' }}>
            <SocialIcon
              title="Siga no Youtube"
              button
              iconSize={40}
              type="youtube"
              onPress={() => {
                linkingYoutube()
              }}
            />
          </View>
          <View style={{ width: '100%', flexDirection: 'column' }}>
            <SocialIcon
              title="Siga no Facebook"
              button
              iconSize={40}
              type="facebook"
              onPress={() => {
                linkingFacebook()
              }}
            />
          </View>
          <View style={{ width: '100%', flexDirection: 'column' }}>
            <SocialIcon
              title="Siga no Instagram"
              button
              iconSize={40}
              type="instagram"
              onPress={() => {
                linkingInstagram()
              }}
            />
          </View>
          <View style={{ width: '100%', flexDirection: 'column' }}>
            <SocialIcon
              title="Siga no Twitter"
              button
              iconSize={40}
              type="twitter"
              onPress={() => {
                linkingTwitter()
              }}
            />
          </View>
          <View style={{ width: '100%', flexDirection: 'row' }}>
            <Icon
              name='spotify'
              type='font-awesome'
              reverse
              raised
              color='green'
              size={37}
              onPress={() => linkingSpotify()} />
            <Icon
              name='envelope'
              type='font-awesome'
              reverse
              raised
              color='#A9A9A9'
              size={37}
              onPress={() => linkingEmail()} />
            <Icon
              name='amazon'
              type='font-awesome'
              reverse
              raised
              color='#363636'
              size={37}
              onPress={() => linkingAmazonMusic()} />
            <Icon
              name='web'
              type='material-community'
              raised
              color='black'
              size={37}
              onPress={() => linkingWeb()} />
          </View>
        </View>
      </ScrollView>
      <Admob />
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  heading: {
    fontSize: 20,
    textAlign: 'center',
    color: 'white'
  },
  textStyle: {
    fontSize: 16,
    textAlign: 'center',
    color: 'grey',
    marginVertical: 16,
  },
});

export default App;