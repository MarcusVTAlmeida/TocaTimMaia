import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import {
  DrawerContentScrollView,
  DrawerItem,
  createDrawerNavigator,
} from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Icon } from 'react-native-elements';

import Home from './src/telas/home';
import Album from './src/telas/album';
import Radio from './src/telas/radio';
import Musicas from './src/telas/musicas';
import Livros from './src/telas/livro';
import Livro2 from './src/telas/livro2';
import Frases from './src/telas/frase';
import Entrevistas from './src/telas/entrevista';
import Shows from './src/telas/show';
import Clipes from './src/telas/clip';
import Documentario from './src/telas/documentario';
import Biografia from './src/telas/biografia';
import Social from './src/telas/social';
import QuizGame from './src/telas/quizGame';
import Conta from './src/telas/conta';
import Mural from './src/telas/mural';
import Eventos from './src/telas/eventos';
import Avatar from './src/telas/avatar';

import { QuizProvider } from './src/componentes/QuizContext';
import { AuthProvider, useAuth } from './src/componentes/AuthContext';
import { AvatarProvider, useAvatar } from './src/componentes/AvatarContext';
import { EventosProvider } from './src/componentes/EventosContext';
import {
  configurarForegroundHandler,
  handleNotificationOpenedApp,
  usePermissaoNotificacao,
} from './src/componentes/notificacaoService';
import { preloadVideo } from './src/componentes/videoCacheService';

const Drawer = createDrawerNavigator();
const Stack  = createNativeStackNavigator();

const BANNER_UNIT_ID    = __DEV__ ? TestIds.BANNER      : 'ca-app-pub-2028860531808564/7240712067';
const INTERSTITIAL_ID   = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-2028860531808564/3770088144';
const ROTAS_SEM_BANNER  = new Set(['album', 'musicas', 'radio']);

const LOGO_URI   = 'https://drive.google.com/uc?export=view&id=1Ic7yD5spoHZiVNQ4yQ8xbK9oYcE5LEnw';
const AVATAR_URI = 'https://drive.google.com/uc?export=view&id=1D20DIGZ6kdeNzLsoARG5if6Sb7f-_Gb7';

function LogoHeader() {
  const { usuario }      = useAuth();
  const { avatarFotoUrl } = useAvatar();
  const uri = usuario ? (avatarFotoUrl || LOGO_URI) : LOGO_URI;
  return <Image source={{ uri }} style={s.headerLogo} resizeMode="cover" />;
}

const headerFilha = {
  headerTitle: '',
  headerStyle: { backgroundColor: '#111' },
  headerTintColor: '#fff',
  headerRight: () => <LogoHeader />,
};

function headerOpts(navigation) {
  return {
    headerStyle:      { backgroundColor: '#111' },
    headerTintColor:  '#fff',
    headerTitleAlign: 'center',
    headerTitleStyle: { fontSize: 16 },
    headerTitle:      '',
    headerLeft: () => (
      <TouchableOpacity style={s.headerBtn} onPress={() => navigation.openDrawer()}>
        <Icon name="menu" type="feather" color="#fff" />
      </TouchableOpacity>
    ),
    headerRight: () => <LogoHeader />,
  };
}

function HomeStack({ navigation }) {
  return (
    <Stack.Navigator screenOptions={{ headerTitle: '' }}>
      <Stack.Screen name="home" component={Home} options={headerOpts(navigation)} />
    </Stack.Navigator>
  );
}

function AlbunsStack({ navigation }) {
  return (
    <Stack.Navigator screenOptions={{ headerTitle: '' }}>
      <Stack.Screen name="album"   component={Album}   options={headerOpts(navigation)} />
      <Stack.Screen name="musicas" component={Musicas} options={headerFilha} />
    </Stack.Navigator>
  );
}

function RadioStack({ navigation }) {
  return (
    <Stack.Navigator screenOptions={{ headerTitle: '' }}>
      <Stack.Screen name="radio" component={Radio} options={headerOpts(navigation)} />
    </Stack.Navigator>
  );
}

function LivrosStack({ navigation }) {
  return (
    <Stack.Navigator screenOptions={{ headerTitle: '' }}>
      <Stack.Screen name="livros" component={Livros} options={headerOpts(navigation)} />
      <Stack.Screen name="livro2" component={Livro2} options={headerFilha} />
    </Stack.Navigator>
  );
}

function FrasesStack({ navigation }) {
  return (
    <Stack.Navigator screenOptions={{ headerTitle: '' }}>
      <Stack.Screen name="frases" component={Frases} options={headerOpts(navigation)} />
    </Stack.Navigator>
  );
}

function EntrevistasStack({ navigation }) {
  return (
    <Stack.Navigator screenOptions={{ headerTitle: '' }}>
      <Stack.Screen name="entrevistas" component={Entrevistas} options={headerOpts(navigation)} />
    </Stack.Navigator>
  );
}

function ShowStack({ navigation }) {
  return (
    <Stack.Navigator screenOptions={{ headerTitle: '' }}>
      <Stack.Screen name="shows" component={Shows} options={headerOpts(navigation)} />
    </Stack.Navigator>
  );
}

function ClipStack({ navigation }) {
  return (
    <Stack.Navigator screenOptions={{ headerTitle: '' }}>
      <Stack.Screen name="clipes" component={Clipes} options={headerOpts(navigation)} />
    </Stack.Navigator>
  );
}

function DocumentarioStack({ navigation }) {
  return (
    <Stack.Navigator screenOptions={{ headerTitle: '', contentStyle: { backgroundColor: '#111111' } }}>
      <Stack.Screen name="documentario" component={Documentario} options={headerOpts(navigation)} />
    </Stack.Navigator>
  );
}

function QuizGameStack({ navigation }) {
  return (
    <Stack.Navigator screenOptions={{ headerTitle: '' }}>
      <Stack.Screen name="quizGame" component={QuizGame} options={headerOpts(navigation)} />
    </Stack.Navigator>
  );
}

function ContaStack({ navigation }) {
  return (
    <Stack.Navigator screenOptions={{ headerTitle: '', contentStyle: { backgroundColor: '#0a0a0a' } }}>
      <Stack.Screen name="conta" component={Conta} options={headerOpts(navigation)} />
    </Stack.Navigator>
  );
}

function BiografiaStack({ navigation }) {
  return (
    <Stack.Navigator screenOptions={{ headerTitle: '' }}>
      <Stack.Screen name="biografia" component={Biografia} options={headerOpts(navigation)} />
    </Stack.Navigator>
  );
}

function SocialStack({ navigation }) {
  return (
    <Stack.Navigator screenOptions={{ headerTitle: '' }}>
      <Stack.Screen name="social" component={Social} options={headerOpts(navigation)} />
    </Stack.Navigator>
  );
}

function MuralStack({ navigation }) {
  return (
    <Stack.Navigator screenOptions={{ headerTitle: '' }}>
      <Stack.Screen name="mural" component={Mural} options={headerOpts(navigation)} />
    </Stack.Navigator>
  );
}

function EventosStack({ navigation }) {
  return (
    <EventosProvider>
      <Stack.Navigator screenOptions={{ headerTitle: '' }}>
        <Stack.Screen name="eventos" component={Eventos} options={headerOpts(navigation)} />
      </Stack.Navigator>
    </EventosProvider>
  );
}

function AvatarStack({ navigation }) {
  return (
    <Stack.Navigator screenOptions={{ headerTitle: '' }}>
      <Stack.Screen name="avatar" component={Avatar} options={headerOpts(navigation)} />
    </Stack.Navigator>
  );
}

function DrawerSeparator({ label }) {
  return (
    <View style={s.separatorContainer}>
      <Text style={s.separatorLabel}>{label}</Text>
      <View style={s.separatorLinha} />
    </View>
  );
}

function CustomDrawer(props) {
  const { navigation } = props;
  const { usuario }    = useAuth();

  const item = (label, iconName, iconType, roteName) => (
    <DrawerItem
      label={label}
      labelStyle={s.drawerLabel}
      onPress={() => navigation.navigate(roteName)}
      icon={() => <Icon name={iconName} type={iconType} color="#aaa" size={20} />}
    />
  );

  return (
    <SafeAreaView style={s.drawerContainer}>
      <View style={s.drawerHeader}>
        <Image source={{ uri: AVATAR_URI }} style={s.drawerAvatar} />
        <Text style={s.drawerNome}>Tim Maia</Text>
        <Text style={s.drawerAnos}>O Rei do Soul</Text>
        <Text style={s.drawerAnos}>1943 – 1998</Text>
      </View>

      <DrawerContentScrollView
        {...props}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 0 }}
      >
        <DrawerSeparator label="GERAL" />
        {item('Tela Inicial',                             'home',             'material-community', 'Home')}
        {item('Mural',                                    'message-circle',   'feather',            'Mural')}
        {item('Eventos',                                  'calendar',         'feather',            'Eventos')}
        {item(usuario ? 'Meu Perfil' : 'Entrar / Criar conta', 'user', 'feather', 'Conta')}
        {item('Biografia',                                'text-document',    'entypo',             'Biografia')}
        {item('Frases',                                   'text',             'entypo',             'Frases')}
        {item('Social',                                   'share-social-sharp','ionicon',           'Social')}
        {item('Quiz',                                     'quiz',             'material',           'Quiz')}
        {item('Avatar',                                   'user',             'feather',            'Avatar')}

        <DrawerSeparator label="MÚSICA" />
        {item('Álbuns', 'albums',  'ionicon',  'Álbuns')}
        {item('Rádio',  'radio',   'material', 'Rádio')}

        <DrawerSeparator label="VÍDEOS" />
        {item('Clipes',       'video',        'feather',            'Clip')}
        {item('Shows',        'music-circle', 'material-community', 'Show')}
        {item('Entrevistas',  'microphone',   'font-awesome',       'Entrevistas')}
        {item('Documentário', 'film',         'feather',            'Documentário')}

        <DrawerSeparator label="LEITURA" />
        {item('Livros', 'bookshelf', 'material-community', 'Livros')}

       <View style={s.drawerRodape}>
  <Text style={s.drawerRodapeTexto}>
    "De repente a dor de esperar terminou e o amor veio, enfim."
  </Text>
</View>
      </DrawerContentScrollView>
    </SafeAreaView>
  );
}

function InicializadorNotificacao() {
  const { usuario } = useAuth();
  usePermissaoNotificacao(usuario?.uid);
  return null;
}

function BannerComSafeArea({ exibir, unitId }) {
  const insets = useSafeAreaInsets();
  if (!exibir) return null;
  return (
    <View style={[s.bannerContainer, { paddingBottom: insets.bottom || 6 }]}>
      <BannerAd unitId={unitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
    </View>
  );
}

function getRotaAtiva(state) {
  if (!state || typeof state.index !== 'number' || !state.routes?.length) return null;
  const rota = state.routes[state.index];
  if (rota?.state) return getRotaAtiva(rota.state);
  return rota?.name || null;
}

export default function App() {
  const navigationRef        = useRef(null);
  const [rotaAtual, setRotaAtual]               = useState('');
  const [notifTitulo, setNotifTitulo]           = useState(null);
  const [notifBody,   setNotifBody]             = useState(null);
  const [notifEventoId, setNotifEventoId]       = useState(null);
  const interstitialExibido = useRef(false);

  useEffect(() => {
    Image.prefetch(LOGO_URI).catch(() => {});
    preloadVideo().catch(() => {});
  }, []);

  useEffect(() => {
    const unsub = configurarForegroundHandler((msg) => {
      const notif = msg?.notification || {};
      const data = msg?.data || {};
      setNotifTitulo(notif.title || null);
      setNotifBody(notif.body || null);
      setNotifEventoId(data?.eventoId || null);
      setTimeout(() => { setNotifTitulo(null); setNotifBody(null); setNotifEventoId(null); }, 5000);
    });
    return unsub;
  }, []);

  useEffect(() => {
    handleNotificationOpenedApp(navigationRef);
  }, []);

  useEffect(() => {
    const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_ID);
    const unsubs = [
      ad.addAdEventListener(AdEventType.LOADED, () => {
        setTimeout(() => {
          if (!interstitialExibido.current) {
            try { ad.show(); } catch {}
            interstitialExibido.current = true;
          }
        }, 8000);
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        InterstitialAd.createForAdRequest(INTERSTITIAL_ID).load();
      }),
    ];
    ad.load();
    return () => unsubs.forEach(fn => fn());
  }, []);

  const exibirBanner = useMemo(
    () => !ROTAS_SEM_BANNER.has(rotaAtual.toLowerCase()),
    [rotaAtual],
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QuizProvider>
          <AuthProvider>
            <InicializadorNotificacao />
            <AvatarProvider>
              <View style={s.appContainer}>
                <NavigationContainer
                  ref={navigationRef}
                  onReady={() => {
                    const rota = navigationRef.current?.getCurrentRoute()?.name || '';
                    setRotaAtual(rota);
                  }}
                  onStateChange={(state) => {
                    setRotaAtual(getRotaAtiva(state) || '');
                  }}
                >
                <Drawer.Navigator
  initialRouteName="Home"
  screenOptions={{
    headerShown:           false,
    drawerStyle:           s.drawer,
    drawerActiveTintColor: '#8B0000',
    drawerInactiveTintColor: '#aaa',
    overlayColor:          'rgba(0,0,0,0.7)',
  }}
  drawerContent={(props) => <CustomDrawer {...props} />}
>
                    <Drawer.Screen name="Home"        component={HomeStack} />
                    <Drawer.Screen name="Frases"      component={FrasesStack} />
                    <Drawer.Screen name="Álbuns"      component={AlbunsStack} />
                    <Drawer.Screen name="Rádio"       component={RadioStack} />
                    <Drawer.Screen name="Livros"      component={LivrosStack} />
                    <Drawer.Screen name="Mural"       component={MuralStack} />
                    <Drawer.Screen name="Eventos"     component={EventosStack} />
                    <Drawer.Screen name="Entrevistas" component={EntrevistasStack} />
                    <Drawer.Screen name="Show"        component={ShowStack} />
                    <Drawer.Screen name="Clip"        component={ClipStack} />
                    <Drawer.Screen name="Documentário" component={DocumentarioStack} />
                    <Drawer.Screen name="Quiz"        component={QuizGameStack} />
                    <Drawer.Screen name="Avatar"      component={AvatarStack} />
                    <Drawer.Screen name="Conta"       component={ContaStack} />
                    <Drawer.Screen name="Biografia"   component={BiografiaStack} />
                    <Drawer.Screen name="Social"      component={SocialStack} />
                  </Drawer.Navigator>
                </NavigationContainer>

                <BannerComSafeArea exibir={exibirBanner} unitId={BANNER_UNIT_ID} />

                {notifTitulo ? (
                  <TouchableOpacity
                    style={s.notifBanner}
                    activeOpacity={0.85}
                    onPress={() => {
                      setNotifTitulo(null);
                      setNotifBody(null);
                      navigationRef.current?.navigate('Eventos', notifEventoId ? { eventoId: notifEventoId } : undefined);
                      setNotifEventoId(null);
                    }}
                  >
                    <View style={s.notifDot} />
                    <View style={s.notifTextos}>
                      <Text style={s.notifTitulo} numberOfLines={1}>{notifTitulo}</Text>
                      {notifBody ? <Text style={s.notifBody} numberOfLines={2}>{notifBody}</Text> : null}
                    </View>
                  </TouchableOpacity>
                ) : null}
              </View>
            </AvatarProvider>
          </AuthProvider>
        </QuizProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  drawer: {
    backgroundColor: '#0d0d0d',
    width: 280,
  },
  bannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#1f1f1f',
  },
  notifBanner: {
    position:        'absolute',
    top:             50,
    left:            16,
    right:           16,
    backgroundColor: '#1A1A1A',
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical:  14,
    paddingHorizontal: 16,
    borderRadius:    14,
    borderLeftWidth: 4,
    borderLeftColor: '#C9A84C',
    zIndex:          9999,
    elevation:       10,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.35,
    shadowRadius:    12,
  },
  notifDot: {
    width:           10,
    height:          10,
    borderRadius:    5,
    backgroundColor: '#C9A84C',
    marginRight:     12,
  },
  notifTextos:  { flex: 1 },
  notifTitulo: {
    color:      '#C9A84C',
    fontSize:   14,
    fontWeight: '700',
    marginBottom: 2,
  },
  notifBody: {
    color:      '#ccc',
    fontSize:   13,
    lineHeight: 18,
  },
  drawerContainer: {
    flex:            1,
    backgroundColor: '#0d0d0d',
  },
  drawerHeader: {
    alignItems:       'center',
    paddingVertical:  10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f1f',
    backgroundColor:  '#111',
  },
  drawerAvatar: {
    width:         150,
    height:        150,
    borderRadius:  80,
    borderWidth:   2,
    borderColor:   '#8B0000',
    marginBottom:  10,
  },
  drawerNome: {
    color:       '#fff',
    fontSize:    18,
    fontWeight:  '700',
    letterSpacing: 0.5,
  },
  drawerAnos: {
    color:    '#888',
    fontSize: 12,
    marginTop: 4,
  },
  separatorContainer: {
    paddingHorizontal: 16,
    paddingTop:        20,
    paddingBottom:     4,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
  },
  separatorLabel: {
    color:         '#8B0000',
    fontSize:      10,
    fontWeight:    '700',
    letterSpacing: 1.5,
  },
  separatorLinha: {
    flex:            1,
    height:          1,
    backgroundColor: '#1f1f1f',
  },
  drawerLabel: {
    color:      '#ccc',
    fontSize:   14,
    fontWeight: '500',
  },
  drawerRodape: {
    padding:         16,
    marginTop:       8,
    borderTopWidth:  1,
    borderTopColor:  '#1a1a1a',
  },
  drawerRodapeTexto: {
    color:      '#444',
    fontSize:   11,
    fontStyle:  'italic',
    textAlign:  'center',
    lineHeight: 18,
  },
  headerBtn: {
    paddingHorizontal: 12,
  },
  headerLogo: {
    width:        40,
    height:       40,
    borderRadius: 50,
    marginRight:  8,
  },
});