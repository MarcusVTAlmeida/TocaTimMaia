import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Carousel from 'react-native-reanimated-carousel';
import { Icon } from 'react-native-elements';
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from '@react-native-firebase/firestore';
import { buscarAlbunsComMusicas } from '../componentes/albuns';
import { buscarEntrevistas } from '../componentes/entrevistas';
import livros from '../componentes/livros';
import { buscarClips } from '../componentes/clips';
import { obterItem } from '../dados/avatarItens';
import { getImagemUrl } from '../componentes/avatarImagens';
import { useAvatar } from '../componentes/AvatarContext';
import HeaderTim from '../componentes/HeaderTim';

const { width } = Dimensions.get('window');
const db = getFirestore();
const POSTS_NO_CAROUSEL = 10;
const EVENTOS_NO_CAROUSEL = 10;

const obterUriImagemCarousel = (item) => {
  const uri = item?.imagem || item?.foto || item?.imagemUrl || item?.thumbnail;
  return typeof uri === 'string' && uri.trim() ? uri.trim() : null;
};

const obterTituloCarousel = (item) =>
  item?.album || item?.nome || item?.titulo || '';

function CarouselCard({ item, resizeMode, altura }) {
  const [erro, setErro] = useState(false);
  const imagemUri = obterUriImagemCarousel(item);
  const titulo = obterTituloCarousel(item);

  useEffect(() => {
    setErro(false);
  }, [imagemUri]);

  const mostrarFallback = !imagemUri || erro;

  return (
    <View style={styles.carouselCard}>
      <View style={[styles.carouselMidia, { height: altura }]}>
        {mostrarFallback ? (
          <View style={styles.carouselFallback}>
            <Text style={styles.carouselFallbackTexto} numberOfLines={2}>
              {titulo}
            </Text>
          </View>
        ) : (
          <Image
            key={imagemUri}
            source={{ uri: imagemUri }}
            style={styles.carouselImagem}
            resizeMode={resizeMode || 'cover'}
            resizeMethod="resize"
            onError={() => setErro(true)}
          />
        )}
      </View>
      <View style={styles.carouselOverlay}>
        <Text style={styles.carouselNome} numberOfLines={1}>
          {titulo}
        </Text>
      </View>
    </View>
  );
}

function Secao({ titulo, data, onPress, carregando, altura = 200, resizeMode }) {
  if (carregando) {
    return (
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>{titulo}</Text>
        <View style={[styles.carouselPlaceholder, { height: altura }]}>
          <ActivityIndicator color="#8B0000" />
        </View>
      </View>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <View style={styles.secao}>
        <View style={styles.secaoHeader}>
          <Text style={styles.secaoTitulo}>{titulo}</Text>
          <Text style={styles.secaoVerMais}>Ver todos →</Text>
        </View>
        <Carousel
          loop
          autoPlay
          autoPlayInterval={10000}
          width={width - 32}
          height={altura}
          data={data}
          scrollAnimationDuration={800}
          renderItem={({ item }) => <CarouselCard item={item} resizeMode={resizeMode} altura={altura} />}
        />
      </View>
    </TouchableOpacity>
  );
}

function BotaoAtalho({ iconName, iconType, label, onPress }) {
  return (
    <TouchableOpacity style={styles.atalho} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.atalhoIcone}>
        <Icon name={iconName} type={iconType} size={28} color="#8B0000" />
      </View>
      <Text style={styles.atalhoLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function Home({ navigation }) {
  const { itensComprados } = useAvatar();
  const [albuns, setAlbuns] = useState([]);
  const [entrevistas, setEntrevistas] = useState([]);
  const [clips, setClips] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [postsMural, setPostsMural] = useState([]);
  const [avatarsHome, setAvatarsHome] = useState([]);
  const [carregandoAvatarsHome, setCarregandoAvatarsHome] = useState(true);
  const [carregandoAlbuns, setCarregandoAlbuns] = useState(true);
  const [carregandoEntrevistas, setCarregandoEntrevistas] = useState(true);
  const [carregandoClips, setCarregandoClips] = useState(true);
  const [carregandoEventos, setCarregandoEventos] = useState(true);
  const [carregandoPostsMural, setCarregandoPostsMural] = useState(true);

  useEffect(() => {
    buscarAlbunsComMusicas()
      .then(setAlbuns)
      .finally(() => setCarregandoAlbuns(false));

    buscarEntrevistas()
      .then(setEntrevistas)
      .finally(() => setCarregandoEntrevistas(false));

    buscarClips()
      .then(setClips)
      .finally(() => setCarregandoClips(false));

    const eventosQuery = query(
      collection(db, 'eventos'),
      orderBy('dataEvento', 'asc'),
      limit(EVENTOS_NO_CAROUSEL)
    );

    const unsubEventos = onSnapshot(
      eventosQuery,
      (snapshot) => {
        const eventosLista = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((evento) => evento.foto);

        setEventos(eventosLista);
        setCarregandoEventos(false);
      },
      (error) => {
        console.error('Erro ao escutar eventos na home:', error);
        setEventos([]);
        setCarregandoEventos(false);
      }
    );

    const muralQuery = query(
      collection(db, 'mural'),
      where('denuncias', '<', 3),
      where('aprovado', '==', true),
      orderBy('denuncias'),
      orderBy('curtidas', 'desc'),
      limit(POSTS_NO_CAROUSEL)
    );

    const unsubMural = onSnapshot(
      muralQuery,
      (snapshot) => {
        const posts = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            nome: doc.data().nome || 'Fa anônimo',
            imagem: doc.data().imagemUrl,
            texto: doc.data().texto || '',
            curtidas: doc.data().curtidas || 0,
            criadoEm: doc.data().criadoEm,
          }))
          .filter((post) => post.imagem);

        setPostsMural(posts);
        setCarregandoPostsMural(false);
      },
      (error) => {
        console.error('Erro ao escutar mural na home:', error);
        setPostsMural([]);
        setCarregandoPostsMural(false);
      }
    );

    return () => {
      unsubEventos();
      unsubMural();
    };
  }, []);

  useEffect(() => {
    const carregarAvatars = async () => {
      if (!itensComprados || itensComprados.length === 0) {
        setCarregandoAvatarsHome(false);
        return;
      }
      const results = await Promise.allSettled(
        itensComprados.map(id => getImagemUrl(id))
      );
      const items = [];
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value) {
          const item = obterItem(itensComprados[i]);
          if (item) items.push({ ...item, imagem: r.value });
        }
      });
      setAvatarsHome(items);
      setCarregandoAvatarsHome(false);
    };
    carregarAvatars();
  }, [itensComprados]);

  const navegar = useCallback(
    (tela) => navigation.navigate(tela),
    [navigation]
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <ScrollView showsVerticalScrollIndicator={false}>

        <HeaderTim />

        {}
        <TouchableOpacity
          style={styles.bioCard}
          onPress={() => navegar('Biografia')}
          activeOpacity={0.85}
        >
          <Text style={styles.bioTexto} numberOfLines={4}>
            Tim Maia (1942-1998) foi um icônico cantor e compositor brasileiro, famoso por sua voz poderosa e mistura única de soul, funk, jazz e rock. Nascido no Rio de Janeiro, ele começou sua carreira nos anos 1960 e alcançou grande sucesso na década de 1970 com hits como "Primavera" e "Azul da Cor do Mar". Conhecido tanto por seu talento quanto por seu comportamento excêntrico, Tim Maia deixou um legado duradouro com músicas como "Gostava Tanto de Você" e "Vale Tudo", tornando-se um dos maiores nomes da música brasileira.
          </Text>
          <Text style={styles.bioVerMais}>Ler biografia completa →</Text>
        </TouchableOpacity>

        {}
        <View style={styles.secoes}>
          <Secao
            titulo="Álbuns"
            data={albuns}
            carregando={carregandoAlbuns}
            onPress={() => navegar('Álbuns')}
          />
          <Secao
            titulo="Entrevistas"
            data={entrevistas}
            carregando={carregandoEntrevistas}
            onPress={() => navegar('Entrevistas')}
          />
          <Secao
            titulo="Livros"
            data={livros}
            carregando={false}
            onPress={() => navegar('Livros')}
          />
            <Secao
            titulo="Clipes"
            data={clips}
            carregando={carregandoClips}
            onPress={() => navegar('Clip')}
          />
          <Secao
            titulo="Eventos"
            data={eventos}
            carregando={carregandoEventos}
            onPress={() => navegar('Eventos')}
          />
          <Secao
            titulo="Mural de Fãs"
            data={postsMural}
            carregando={carregandoPostsMural}
            onPress={() => navegar('Mural')}
          />
          <Secao
            titulo="Seu Avatar"
            data={avatarsHome}
            carregando={carregandoAvatarsHome}
            onPress={() => navegar('Avatar')}
            altura={250}
            resizeMode="contain"
          />
        </View>

        {}
        <View style={styles.atalhoContainer}>
          <Text style={[styles.secaoTitulo, styles.atalhosTitulo]}>
            Acesso rápido
          </Text>
          <View style={styles.atalhoLinha}>
            <BotaoAtalho
              iconName="radio"
              iconType="material"
              label="Rádio"
              onPress={() => navegar('Rádio')}
            />
            <BotaoAtalho
              iconName="text"
              iconType="entypo"
              label="Frases"
              onPress={() => navegar('Frases')}
            />
            <BotaoAtalho
              iconName="film"
              iconType="feather"
              label="Documentário"
              onPress={() => navegar('Documentário')}
            />
          </View>
          <View style={styles.atalhoLinha}>
            <BotaoAtalho
              iconName="music-circle"
              iconType="material-community"
              label="Shows"
              onPress={() => navegar('Show')}
            />
            <BotaoAtalho
              iconName="share-social-sharp"
              iconType="ionicon"
              label="Social"
              onPress={() => navegar('Social')}
            />
             <BotaoAtalho
              iconName="quiz"
              iconType="material"
              label="Quiz"
              onPress={() => navegar('Quiz')}
            />
          </View>
          {(!carregandoEventos && eventos.length === 0) ||
          (!carregandoPostsMural && postsMural.length === 0) ||
          (!carregandoAvatarsHome && avatarsHome.length === 0) ? (
            <View style={styles.atalhoLinha}>
              {!carregandoEventos && eventos.length === 0 && (
                <BotaoAtalho
                  iconName="calendar"
                  iconType="feather"
                  label="Eventos"
                  onPress={() => navegar('Eventos')}
                />
              )}
              {!carregandoPostsMural && postsMural.length === 0 && (
                <BotaoAtalho
                  iconName="message-circle"
                  iconType="feather"
                  label="Mural"
                  onPress={() => navegar('Mural')}
                />
              )}
              {!carregandoAvatarsHome && avatarsHome.length === 0 && (
                <BotaoAtalho
                  iconName="face-man"
                  iconType="material-community"
                  label="Criar Avatar"
                  onPress={() => navegar('Avatar')}
                />
              )}
            </View>
          ) : null}
        </View>

        {}
        <View style={styles.rodape}>
          <Text style={styles.rodapeTexto}>
            "Não fumo, não bebo e não cheiro. Só minto um pouco."
          </Text>
          <Text style={styles.rodapeAutor}>— Tim Maia</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },

  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f1f',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#8B0000',
    marginBottom: 12,
  },
  nome: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 1,
  },
  anos: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  alcunha: {
    fontSize: 13,
    color: '#8B0000',
    marginTop: 6,
    letterSpacing: 2,
  },

  bioCard: {
    margin: 16,
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  bioTexto: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'justify',
  },
  bioVerMais: {
    color: '#8B0000',
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
  },

  secoes: {
    paddingHorizontal: 16,
    gap: 8,
  },
  secao: {
    marginBottom: 16,
  },
  secaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  secaoTitulo: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secaoVerMais: {
    color: '#8B0000',
    fontSize: 13,
  },
  carouselPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 12,
  },

  carouselCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    flex: 1,
  },
  carouselMidia: {
    width: '100%',
    backgroundColor: '#1a1a1a',
  },
  carouselImagem: {
    width: '100%',
    height: '100%',
  },
  carouselFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
  },
  carouselFallbackTexto: {
    color: '#555',
    fontSize: 13,
    textAlign: 'center',
  },

  carouselOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  carouselNome: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  atalhoContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  atalhosTitulo: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  atalhoLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  atalho: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  atalhoIcone: {
    marginBottom: 6,
  },
  atalhoLabel: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '500',
  },

  rodape: {
    padding: 24,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    marginTop: 8,
  },
  rodapeTexto: {
    color: '#555',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  rodapeAutor: {
    color: '#8B0000',
    fontSize: 12,
    marginTop: 4,
  },
});
