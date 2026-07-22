import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  SafeAreaView,
  Modal,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { getStorage, ref, getDownloadURL } from '@react-native-firebase/storage';
import RNFS from 'react-native-fs';
import { useAuth } from '../componentes/AuthContext';
import { useEventos } from '../componentes/EventosContext';
import { buscarCidadeUsuario, verificarEventosProximos } from '../componentes/eventosService';
import CardEvento from '../componentes/CardEvento';
import BarraNotificacaoEvento from '../componentes/BarraNotificacaoEvento';
import DateTimePicker from '@react-native-community/datetimepicker';
import { states, cities } from 'estados-cidades';

const storageInstance = getStorage();

const GOLD = '#C9A84C';
const BG = '#0a0a0a';
const BORDER = '#2a2a2a';

const TIPOS_EVENTO = [
  'Show',
  'Tributo',
  'Festival',
  'Aniversário',
  'Encontro de fãs',
  'Outro',
];

const ESTADOS_LISTA = states();

export default function EventosTela({ navigation }) {
  const { usuario } = useAuth();
  const {
    eventos,
    eventosCarregando,
    criarEvento,
    marcarPresenca,
    curtirEvento,
    adicionarComentario,
    buscarEventosPorCidade,
    deletarEvento,
    denunciarEvento,
    notificacaoExibida,
    marcarNotificacaoLida,
  } = useEventos();

  const [modalCriarVisivel, setModalCriarVisivel] = useState(false);
  const [nomeEvento, setNomeEvento] = useState('');
  const [descricaoEvento, setDescricaoEvento] = useState('');
  const [tipoEvento, setTipoEvento] = useState('Show');
  const [dataEvento, setDataEvento] = useState(new Date());
  const [horaEvento, setHoraEvento] = useState(() => {
    const agora = new Date();
    return `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
  });
  const [cidadeEvento, setCidadeEvento] = useState('');
  const [estadoEvento, setEstadoEvento] = useState('');
  const [cidadesDisponiveis, setCidadesDisponiveis] = useState([]);
  const [cidadesFiltradas, setCidadesFiltradas] = useState([]);
  const [buscaCidade, setBuscaCidade] = useState('');
  const [enderecoEvento, setEnderecoEvento] = useState('');
  const [linkIngresso, setLinkIngresso] = useState('');
  const [fotoEvento, setFotoEvento] = useState(null);
  const [criandoEvento, setCriandoEvento] = useState(false);
  const [mostrarDatePicker, setMostrarDatePicker] = useState(false);
  const [mostrarTimePicker, setMostrarTimePicker] = useState(false);
  const [modalDropdownEstado, setModalDropdownEstado] = useState(false);
  const [modalDropdownCidade, setModalDropdownCidade] = useState(false);

  const [modalFiltrosVisivel, setModalFiltrosVisivel] = useState(false);
  const [cidadeFiltro, setCidadeFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [buscaTexto, setBuscaTexto] = useState('');
  const [cidadeUsuario, setCidadeUsuario] = useState(null);

  const [modalDetalhesVisivel, setModalDetalhesVisivel] = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);
  const [comentarioTexto, setComentarioTexto] = useState('');
  const [adicionandoComentario, setAdicionandoComentario] = useState(false);
  const [modalDenunciaVisivel, setModalDenunciaVisivel] = useState(false);
  const [eventoDenunciar, setEventoDenunciar] = useState(null);
  const [motivoDenuncia, setMotivoDenuncia] = useState('');

  const animatedNotifValue = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const carregarCidadeUsuario = async () => {
      if (usuario?.uid) {
        const cidade = await buscarCidadeUsuario(usuario.uid);
        setCidadeUsuario(cidade);
        if (cidade?.cidade) {
          await verificarEventosProximos(cidade.cidade);
        }
      }
    };

    carregarCidadeUsuario();
  }, [usuario?.uid]);

  useEffect(() => {
    if (notificacaoExibida) {
      Animated.timing(animatedNotifValue, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(animatedNotifValue, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }).start();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notificacaoExibida, animatedNotifValue]);

  useEffect(() => {
    if (estadoEvento) {
      try {
        const cidadesDoEstado = cities(estadoEvento);
        setCidadesDisponiveis(cidadesDoEstado || []);
        setCidadesFiltradas(cidadesDoEstado || []);
        setCidadeEvento('');
        setBuscaCidade('');
      } catch (error) {

        setCidadesDisponiveis([]);
        setCidadesFiltradas([]);
      }
    } else {
      setCidadesDisponiveis([]);
      setCidadesFiltradas([]);
      setCidadeEvento('');
    }
  }, [estadoEvento]);

  useEffect(() => {
    if (buscaCidade.trim()) {
      const filtradas = cidadesDisponiveis.filter(cidade =>
        cidade.toLowerCase().includes(buscaCidade.toLowerCase())
      );
      setCidadesFiltradas(filtradas);
    } else {
      setCidadesFiltradas(cidadesDisponiveis);
    }
  }, [buscaCidade, cidadesDisponiveis]);

  const selecionarFoto = useCallback(async (usarCamera = false) => {
    const opcoes = {
      mediaType: 'photo',
      maxWidth: 800,
      maxHeight: 800,
    };

    try {
      const resultado = usarCamera
        ? await launchCamera(opcoes)
        : await launchImageLibrary(opcoes);

      if (!resultado.didCancel && resultado.assets?.length > 0) {
        const asset = resultado.assets[0];
        if (asset.uri) {
          try {
            const destino = `${RNFS.CachesDirectoryPath}/evento_${Date.now()}.jpg`;
            await RNFS.copyFile(asset.uri, destino);
            const uriDestino = Platform.OS === 'android' ? `file://${destino}` : destino;
            setFotoEvento({ ...asset, uri: uriDestino });
          } catch (copyErr) {
            setFotoEvento(asset);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao selecionar foto:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a foto');
    }
  }, []);

  const fazerUploadFoto = useCallback(async (fotoInfo) => {
    if (!fotoInfo?.uri) return null;

    try {
      const uploadUri = fotoInfo.uri.replace(/^file:\/\//, '');

      const filename = `eventos/${usuario.uid}_${Date.now()}.jpg`;
      const storageRef = ref(storageInstance, filename);

      await storageRef.putFile(uploadUri);

      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Erro ao fazer upload de foto:', error);
      throw error;
    }
  }, [usuario?.uid]);

  const resetarFormularioEvento = useCallback(() => {
    setNomeEvento('');
    setDescricaoEvento('');
    setTipoEvento('Show');
    setDataEvento(new Date());
    setHoraEvento(() => {
      const agora = new Date();
      return `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
    });
    setCidadeEvento(cidadeUsuario?.cidade || '');
    setEstadoEvento(cidadeUsuario?.estado || '');
    setEnderecoEvento('');
    setLinkIngresso('');
    setFotoEvento(null);
    setBuscaCidade('');
    setModalDropdownEstado(false);
    setModalDropdownCidade(false);
  }, [cidadeUsuario?.cidade, cidadeUsuario?.estado]);

  useEffect(() => {
    if (!criandoEvento) return;
    const timer = setTimeout(() => {
      setCriandoEvento(false);
      Alert.alert('Tempo limite', 'O upload parece estar demorando muito. Tente novamente.');
    }, 30000);
    return () => clearTimeout(timer);
  }, [criandoEvento]);

  const handleCriarEvento = useCallback(async () => {
    if (!usuario) {
      Alert.alert('Login necessário', 'Entre na sua conta para criar eventos.');
      return;
    }
    if (!nomeEvento.trim()) {
      Alert.alert('Atenção', 'Informe o nome do evento');
      return;
    }

    if (!dataEvento) {
      Alert.alert('Atenção', 'Informe a data do evento');
      return;
    }

    if (!horaEvento.trim()) {
      Alert.alert('Atenção', 'Informe o horário do evento');
      return;
    }

    if (!estadoEvento.trim()) {
      Alert.alert('Atenção', 'Informe o estado do evento');
      return;
    }

    if (!cidadeEvento.trim()) {
      Alert.alert('Atenção', 'Informe a cidade do evento');
      return;
    }

    try {
      setCriandoEvento(true);

      let fotoUrl = null;
      if (fotoEvento?.uri) {
        fotoUrl = await fazerUploadFoto(fotoEvento);
      }

      const [hora, minuto] = horaEvento.split(':');
      const dataComHora = new Date(dataEvento);
      dataComHora.setHours(parseInt(hora, 10), parseInt(minuto, 10));

      await criarEvento({
        nome: nomeEvento,
        descricao: descricaoEvento,
        tipo: tipoEvento,
        dataEvento: dataComHora,
        cidade: cidadeEvento,
        estado: estadoEvento,
        endereco: enderecoEvento,
        linkIngressos: linkIngresso,
        foto: fotoUrl,
      });

      Alert.alert('Sucesso', 'Evento criado com sucesso!');
      resetarFormularioEvento();
      setModalCriarVisivel(false);
    } catch (error) {
      Alert.alert('Erro', error.message || 'Erro ao criar evento');
    } finally {
      setCriandoEvento(false);
    }
  }, [
    nomeEvento,
    descricaoEvento,
    tipoEvento,
    dataEvento,
    horaEvento,
    cidadeEvento,
    estadoEvento,
    enderecoEvento,
    linkIngresso,
    fotoEvento,
    criarEvento,
    fazerUploadFoto,
    resetarFormularioEvento,
  ]);

  const handleDeletarEvento = useCallback(async (eventoId) => {
    Alert.alert(
      'Deletar evento?',
      'Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletarEvento(eventoId);
              Alert.alert('Sucesso', 'Evento deletado');
            } catch (error) {
              Alert.alert('Erro', error.message || 'Erro ao deletar evento');
            }
          },
        },
      ],
    );
  }, [deletarEvento]);

  const handleDenunciarEvento = useCallback((evento) => {
    setEventoDenunciar(evento);
    setMotivoDenuncia('');
    setModalDenunciaVisivel(true);
  }, []);

  const handleEnviarDenuncia = useCallback(async () => {
    if (!eventoDenunciar?.id) {
      Alert.alert('Erro', 'Evento não encontrado para denúncia');
      return;
    }

    if (!motivoDenuncia.trim()) {
      Alert.alert('Atenção', 'Informe o motivo da denúncia');
      return;
    }

    try {
      await denunciarEvento(eventoDenunciar.id, motivoDenuncia);
      Alert.alert('Sucesso', 'Denúncia enviada. Obrigado por ajudar a manter a comunidade segura!');
      setModalDenunciaVisivel(false);
      setMotivoDenuncia('');
      setEventoDenunciar(null);
    } catch (error) {
      Alert.alert('Erro', error.message || 'Erro ao denunciar evento');
    }
  }, [eventoDenunciar, motivoDenuncia, denunciarEvento]);

  const eventosFiltrados = useMemo(() => eventos.filter(evento => {
    let corresponde = true;

    if (cidadeFiltro && evento.cidade !== cidadeFiltro) {
      corresponde = false;
    }

    if (tipoFiltro && evento.tipo !== tipoFiltro) {
      corresponde = false;
    }

    if (buscaTexto) {
      const termo = buscaTexto.toLowerCase();
      const nomeCorresponde = evento.nome.toLowerCase().includes(termo);
      const descricaoCorresponde = evento.descricao?.toLowerCase().includes(termo);
      corresponde = corresponde && (nomeCorresponde || descricaoCorresponde);
    }

    return corresponde;
  }), [eventos, cidadeFiltro, tipoFiltro, buscaTexto]);

  const eventosFuturos = useMemo(
    () => eventosFiltrados.filter(e => !e.passado),
    [eventosFiltrados]
  );
  const eventosPassados = useMemo(
    () => eventosFiltrados.filter(e => e.passado),
    [eventosFiltrados]
  );

  const cidades = useMemo(() => [...new Set(eventos.map(e => e.cidade))], [eventos]);

  const ListHeader = () => (
    <View style={styles.listHeader}>
      {}
      <View style={styles.banner}>
        <View style={styles.bannerAccent} />
        <View style={styles.bannerContent}>
          <Text style={styles.bannerEmoji}>📅</Text>
          <View style={styles.bannerTextos}>
            <Text style={styles.bannerTitulo}>Eventos</Text>
            <Text style={styles.bannerSub}>Shows, tributos, festivais e encontros de fãs</Text>
          </View>
          {usuario && (
            <TouchableOpacity
              style={styles.botaoCriar}
              onPress={() => {
                resetarFormularioEvento();
                setModalCriarVisivel(true);
              }}
            >
              <Icon name="plus" size={20} color={BG} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {}
      <View style={styles.divisorRow}>
        <View style={styles.divisorLinha} />
        <View style={styles.losango} />
        <View style={styles.divisorLinha} />
      </View>

      {}
      <View style={styles.barraAcoes}>
        <View style={styles.inputBusca}>
          <Icon name="search" size={16} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Buscar eventos..."
            placeholderTextColor="#666"
            value={buscaTexto}
            onChangeText={setBuscaTexto}
          />
        </View>

        <TouchableOpacity
          style={styles.botaoFiltro}
          onPress={() => setModalFiltrosVisivel(true)}
        >
          <Icon name="filter" size={18} color={GOLD} />
        </TouchableOpacity>
      </View>

      {}
      {!usuario ? (
        <View style={styles.ctaLogin}>
          <Icon name="lock" size={18} color={GOLD} />
          <Text style={styles.ctaLoginTexto}>Entre na sua conta para criar eventos e interagir</Text>
        </View>
      ) : null}
    </View>
  );

  return (

    <SafeAreaView style={styles.container}>
      <BarraNotificacaoEvento
        notificacao={notificacaoExibida}
        animatedValue={animatedNotifValue}
        onPress={() => {
          if (notificacaoExibida?.eventoId) {
            const evento = eventos.find(e => e.id === notificacaoExibida.eventoId);
            if (evento) {
              setEventoSelecionado(evento);
              setModalDetalhesVisivel(true);
              if (notificacaoExibida?.id) {
                marcarNotificacaoLida(notificacaoExibida.id);
              }
            }
          }
        }}
        onClose={() => {
          Animated.timing(animatedNotifValue, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }).start();
          if (notificacaoExibida?.id) {
            marcarNotificacaoLida(notificacaoExibida.id);
          }
        }}
      />

      {}
      {eventosCarregando ? (
        <View style={styles.centralizador}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      ) : (
        <FlatList
          data={[
            ...(eventosFuturos.length > 0 ? [{ tipo: 'header', label: 'Próximos eventos' }, ...eventosFuturos] : []),
            ...(eventosPassados.length > 0 ? [{ tipo: 'header', label: 'Eventos passados' }, ...eventosPassados] : []),
          ]}
          keyExtractor={(item, index) =>
            item.tipo === 'header' ? `header-${index}` : item.id
          }
          renderItem={({ item }) => {
            if (item.tipo === 'header') {
              return (
                <Text style={styles.headerSecao}>
                  {item.label}
                </Text>
              );
            }

            return (
              <View style={styles.cardContainer}>
                <CardEvento
                  evento={item}
                  onPressFav={() => {
                    if (!usuario) { Alert.alert('Login necessário', 'Entre na sua conta para curtir eventos.'); return; }
                    curtirEvento(item.id);
                  }}
                  onPressPresenca={() => {
                    if (!usuario) { Alert.alert('Login necessário', 'Entre na sua conta para confirmar presença.'); return; }
                    marcarPresenca(item.id);
                  }}
                  onPressComentarios={() => {
                    setEventoSelecionado(item);
                    setModalDetalhesVisivel(true);
                  }}
                  onPress={() => {
                    setEventoSelecionado(item);
                    setModalDetalhesVisivel(true);
                  }}
                  onDelete={() => handleDeletarEvento(item.id)}
                  onDenunciar={() => handleDenunciarEvento(item)}
                  usuarioAtualId={usuario?.uid}
                />
              </View>
            );
          }}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={() => (
            <View style={styles.centralizador}>
              <Icon name="calendar" size={48} color={BORDER} />
              <Text style={styles.textoVazio}>Nenhum evento encontrado</Text>
            </View>
          )}
          contentContainerStyle={styles.lista}
          scrollEnabled={true}
        />
      )}

      {}
      <Modal
        visible={modalCriarVisivel}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalCriarVisivel(false)}
      >
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.flex}
          >
            <ScrollView
              style={styles.modalConteudo}
              contentContainerStyle={styles.modalScroll}
            >
              {}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setModalCriarVisivel(false)}
                >
                  <Icon name="x" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.modalTitulo}>Criar evento</Text>
                <View style={{ width: 24 }} />
              </View>

              {}
              <View style={styles.fotosecao}>
                {fotoEvento?.uri ? (
                  <Image
                    source={{ uri: fotoEvento.uri }}
                    style={styles.fotoPreview}
                    resizeMethod="resize"
                  />
                ) : (
                  <View style={styles.fotoPlaceholder}>
                    <Icon name="image" size={48} color={BORDER} />
                  </View>
                )}

                <View style={styles.botoesFoto}>
                  <TouchableOpacity
                    style={styles.botaoFotoSecundario}
                    onPress={() => selecionarFoto(false)}
                  >
                    <Icon name="upload" size={18} color={GOLD} />
                    <Text style={styles.botaoTextoSecundario}>Galeria</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.botaoFotoSecundario}
                    onPress={() => selecionarFoto(true)}
                  >
                    <Icon name="camera" size={18} color={GOLD} />
                    <Text style={styles.botaoTextoSecundario}>Câmera</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {}
              <View style={styles.formulario}>
                {}
                <View style={styles.grupoInput}>
                  <Text style={styles.labelInput}>Nome do evento *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ex: Show Tributo Tim Maia"
                    placeholderTextColor="#666"
                    value={nomeEvento}
                    onChangeText={setNomeEvento}
                  />
                </View>

                {}
                <View style={styles.grupoInput}>
                  <Text style={styles.labelInput}>Tipo de evento *</Text>
                  <ScrollView
                    horizontal
                    style={styles.tiposScroll}
                    showsHorizontalScrollIndicator={false}
                  >
                    {TIPOS_EVENTO.map(tipo => (
                      <TouchableOpacity
                        key={tipo}
                        style={[
                          styles.tipoBotao,
                          tipoEvento === tipo && styles.tipoBotaoAtivo,
                        ]}
                        onPress={() => setTipoEvento(tipo)}
                      >
                        <Text
                          style={[
                            styles.tipoBotaoTexto,
                            tipoEvento === tipo && styles.tipoBotaoTextoAtivo,
                          ]}
                        >
                          {tipo}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {}
                <View style={styles.grupoInput}>
                  <Text style={styles.labelInput}>Data do evento *</Text>

                  <TouchableOpacity
                    style={styles.textInput}
                    onPress={() => setMostrarDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: '#fff' }}>
                      {dataEvento instanceof Date ? dataEvento.toLocaleDateString('pt-BR') : 'Selecione a data'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.grupoInput}>
                  <Text style={styles.labelInput}>Horário *</Text>

                  <TouchableOpacity
                    style={styles.textInput}
                    onPress={() => setMostrarTimePicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: '#fff' }}>{horaEvento}</Text>
                  </TouchableOpacity>
                </View>

                {}
                <View style={styles.grupoInput}>
                  <Text style={styles.labelInput}>Estado *</Text>
                  <TouchableOpacity
                    style={[styles.textInput, styles.dropdownTrigger]}
                    onPress={() => setModalDropdownEstado(true)}
                  >
                    <Text style={[
                      estadoEvento ? { color: '#fff' } : { color: '#666' }
                    ]}>
                      {estadoEvento || 'Selecione o estado'}
                    </Text>
                    <Icon name="chevron-down" size={18} color={GOLD} />
                  </TouchableOpacity>
                </View>

                {}
                <View style={styles.grupoInput}>
                  <Text style={styles.labelInput}>Cidade * {estadoEvento && `(${estadoEvento})`}</Text>
                  <TouchableOpacity
                    style={[styles.textInput, styles.dropdownTrigger]}
                    onPress={() => {
                      if (estadoEvento) {
                        setModalDropdownCidade(true);
                      } else {
                        Alert.alert('Atenção', 'Selecione um estado primeiro');
                      }
                    }}
                  >
                    <Text style={[
                      cidadeEvento ? { color: '#fff' } : { color: '#666' }
                    ]}>
                      {cidadeEvento || 'Selecione a cidade'}
                    </Text>
                    <Icon name="chevron-down" size={18} color={GOLD} />
                  </TouchableOpacity>
                </View>

                {}
                <View style={styles.grupoInput}>
                  <Text style={styles.labelInput}>Endereço *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ex: Rua Jesus Trujilo, 682 - Jardim Alvorada"
                    placeholderTextColor="#666"
                    value={enderecoEvento}
                    onChangeText={setEnderecoEvento}
                  />
                </View>

                {}
                <View style={styles.grupoInput}>
                  <Text style={styles.labelInput}>Descrição</Text>
                  <TextInput
                    style={[styles.textInput, styles.textAreaInput]}
                    placeholder="Descreva seu evento..."
                    placeholderTextColor="#666"
                    value={descricaoEvento}
                    onChangeText={setDescricaoEvento}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                {}
                <View style={styles.grupoInput}>
                  <Text style={styles.labelInput}>Link de ingressos</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="https://..."
                    placeholderTextColor="#666"
                    value={linkIngresso}
                    onChangeText={setLinkIngresso}
                  />
                </View>
              </View>

              {}
              <TouchableOpacity
                style={[
                  styles.botaoPrimario,
                  criandoEvento && styles.botaoDesabilitado,
                ]}
                onPress={handleCriarEvento}
                disabled={criandoEvento}
              >
                {criandoEvento ? (
                  <ActivityIndicator color={BG} />
                ) : (
                  <>
                    <Icon name="plus" size={18} color={BG} />
                    <Text style={styles.botaoPrimarioTexto}>Criar evento</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
          {mostrarDatePicker && (
            <DateTimePicker
              value={dataEvento instanceof Date ? dataEvento : new Date()}
              mode="date"
              locale="pt-BR"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                if (event.type === 'set' && selectedDate) {
                  setDataEvento(selectedDate);
                }
                setMostrarDatePicker(false);
              }}
            />
          )}

          {mostrarTimePicker && (
            <DateTimePicker
              value={dataEvento instanceof Date ? dataEvento : new Date()}
              mode="time"
              locale="pt-BR"
              is24Hour
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                if (event.type === 'set' && selectedDate) {
                  const h = selectedDate.getHours().toString().padStart(2, '0');
                  const m = selectedDate.getMinutes().toString().padStart(2, '0');
                  setHoraEvento(`${h}:${m}`);
                }
                setMostrarTimePicker(false);
              }}
            />
          )}
        </SafeAreaView>
      </Modal>

      {}
      <Modal
        visible={modalFiltrosVisivel}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalFiltrosVisivel(false)}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalFiltrosVisivel(false)}>
              <Icon name="x" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitulo}>Filtros</Text>
            <TouchableOpacity
              onPress={() => {
                setCidadeFiltro('');
                setTipoFiltro('');
              }}
            >
              <Text style={styles.limparFiltros}>Limpar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalConteudo}>
            {}
            <View style={styles.secaoFiltro}>
              <Text style={styles.titloFiltro}>Cidade</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filtrosScroll}
              >
                {cidades.map(cidade => (
                  <TouchableOpacity
                    key={cidade}
                    style={[
                      styles.filtroChip,
                      cidadeFiltro === cidade && styles.filtroChipAtivo,
                    ]}
                    onPress={() => setCidadeFiltro(cidadeFiltro === cidade ? '' : cidade)}
                  >
                    <Text
                      style={[
                        styles.filtroChipTexto,
                        cidadeFiltro === cidade && styles.filtroChipTextoAtivo,
                      ]}
                    >
                      {cidade}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {}
            <View style={styles.secaoFiltro}>
              <Text style={styles.titloFiltro}>Tipo de evento</Text>
              <View style={styles.filtrosContainer}>
                {TIPOS_EVENTO.map(tipo => (
                  <TouchableOpacity
                    key={tipo}
                    style={[
                      styles.filtroChip,
                      tipoFiltro === tipo && styles.filtroChipAtivo,
                    ]}
                    onPress={() => setTipoFiltro(tipoFiltro === tipo ? '' : tipo)}
                  >
                    <Text
                      style={[
                        styles.filtroChipTexto,
                        tipoFiltro === tipo && styles.filtroChipTextoAtivo,
                      ]}
                    >
                      {tipo}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.botaoPrimario}
            onPress={() => setModalFiltrosVisivel(false)}
          >
            <Text style={styles.botaoPrimarioTexto}>Aplicar filtros</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      {}
      <Modal
        visible={modalDetalhesVisivel && !!eventoSelecionado}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalDetalhesVisivel(false)}
      >
        {eventoSelecionado && (
          <SafeAreaView style={styles.container}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalDetalhesVisivel(false)}>
                <Icon name="x" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.modalTitulo}>Detalhes do evento</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalConteudo}>
              {eventoSelecionado.foto && (
                <Image
                  source={{ uri: eventoSelecionado.foto }}
                  style={styles.fotoDetalhes}
                  resizeMethod="resize"
                />
              )}

              <View style={styles.detalheConteudo}>
                <View style={styles.detalheCriadorRow}>
                  <Image
                    source={{ uri: eventoSelecionado.criadorFoto || 'https://ui-avatars.com/api/?background=141414&color=C9A84C&name=?' }}
                    style={styles.detalheCriadorFoto}
                  />
                  <Text style={styles.detalheCriadorNome}>
                    {eventoSelecionado.criadorNome || 'Anônimo'}
                  </Text>
                </View>

                <Text style={styles.detalheTitulo}>
                  {eventoSelecionado.nome}
                </Text>

                {}
                <View style={styles.detalheInfo}>
                  {eventoSelecionado.dataEvento && (
                    <>
                      <View style={styles.detalheItem}>
                        <Icon name="calendar" size={18} color={GOLD} />
                        <Text style={styles.detalheTexto}>
                          {new Date(eventoSelecionado.dataEvento).toLocaleDateString('pt-BR')}
                        </Text>
                      </View>

                      <View style={styles.detalheItem}>
                        <Icon name="clock" size={18} color={GOLD} />
                        <Text style={styles.detalheTexto}>
                          {new Date(eventoSelecionado.dataEvento).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    </>
                  )}

                  <View style={styles.detalheItem}>
                    <Icon name="map-pin" size={18} color={GOLD} />
                    <Text style={styles.detalheTexto}>
                      {eventoSelecionado.cidade}
                      {eventoSelecionado.estado && `, ${eventoSelecionado.estado}`}
                    </Text>
                  </View>
                </View>

                {}
                {eventoSelecionado.descricao && (
                  <View style={styles.detalheSecao}>
                    <Text style={styles.detalheSubtitulo}>Sobre o evento</Text>
                    <Text style={styles.detalheTextoLongo}>
                      {eventoSelecionado.descricao}
                    </Text>
                  </View>
                )}

                {}
                <View style={styles.detalheSecao}>
                  <Text style={styles.detalheSubtitulo}>Comentários</Text>

                  {eventoSelecionado.comentarios?.map(comentario => (
                    <View
                      key={comentario.id}
                      style={styles.comentarioCard}
                    >
                      <Text style={styles.comentarioTexto}>
                        {comentario.texto}
                      </Text>
                      <Text style={styles.comentarioData}>
                        {new Date(comentario.criadoEm).toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                  ))}

                  {}
                  <View style={styles.adicionarComentarioContainer}>
                    <TextInput
                      style={styles.comentarioInput}
                      placeholder="Adicione um comentário..."
                      placeholderTextColor="#666"
                      value={comentarioTexto}
                      onChangeText={setComentarioTexto}
                      multiline
                    />

                    <TouchableOpacity
                      style={styles.botaoComentario}
                      onPress={async () => {
                        if (!usuario) { Alert.alert('Login necessário', 'Entre na sua conta para comentar.'); return; }
                        if (comentarioTexto.trim()) {
                          setAdicionandoComentario(true);
                          try {
                            await adicionarComentario(
                              eventoSelecionado.id,
                              comentarioTexto.trim(),
                            );
                            setComentarioTexto('');
                            Alert.alert('Sucesso', 'Comentário adicionado!');
                          } catch (error) {
                            Alert.alert('Erro', 'Não foi possível adicionar o comentário');
                          } finally {
                            setAdicionandoComentario(false);
                          }
                        }
                      }}
                      disabled={adicionandoComentario}
                    >
                      <Icon name="send" size={18} color={BG} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

      {}
      <Modal
        visible={modalDenunciaVisivel}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalDenunciaVisivel(false)}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalDenunciaVisivel(false)}>
              <Icon name="x" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitulo}>Denunciar evento</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalConteudo}>
            <View style={styles.denunciaContainer}>
              <Icon name="alert-circle" size={48} color="#ff6b6b" />
              <Text style={styles.denunciaTitulo}>Por que denunciar?</Text>

              <TextInput
                style={styles.denunciaInput}
                placeholder="Descreva o motivo da denúncia..."
                placeholderTextColor="#666"
                value={motivoDenuncia}
                onChangeText={setMotivoDenuncia}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              <Text style={styles.denunciaAviso}>
                Sua denúncia é importante. Se este evento receber 3 denúncias, será removido automaticamente.
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.botaoPrimario}
            onPress={handleEnviarDenuncia}
          >
            <Icon name="send" size={18} color={BG} />
            <Text style={styles.botaoPrimarioTexto}>Enviar denúncia</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      {}
      <Modal
        visible={modalDropdownEstado}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalDropdownEstado(false)}
      >
        <TouchableOpacity
          style={styles.overlayModal}
          activeOpacity={1}
          onPress={() => setModalDropdownEstado(false)}
        >
          <View style={styles.dropdownModalContent}>
            <FlatList
              data={ESTADOS_LISTA}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    estadoEvento === item && styles.dropdownItemAtivo,
                  ]}
                  onPress={() => {
                    setEstadoEvento(item);
                    setModalDropdownEstado(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemTexto,
                    estadoEvento === item && styles.dropdownItemTextoAtivo,
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              scrollEnabled
              nestedScrollEnabled
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {}
      <Modal
        visible={modalDropdownCidade}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalDropdownCidade(false)}
      >
        <TouchableOpacity
          style={styles.overlayModal}
          activeOpacity={1}
          onPress={() => setModalDropdownCidade(false)}
        >
          <View style={styles.dropdownModalContent}>
            <View style={styles.dropdownSearchContainer}>
              <Icon name="search" size={16} color="#666" />
              <TextInput
                style={styles.dropdownSearchInput}
                placeholder="Digite a cidade..."
                placeholderTextColor="#666"
                value={buscaCidade}
                onChangeText={setBuscaCidade}
                autoFocus
              />
              {buscaCidade && (
                <TouchableOpacity onPress={() => setBuscaCidade('')}>
                  <Icon name="x" size={16} color="#666" />
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={cidadesFiltradas}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    cidadeEvento === item && styles.dropdownItemAtivo,
                  ]}
                  onPress={() => {
                    setCidadeEvento(item);
                    setModalDropdownCidade(false);
                    setBuscaCidade('');
                  }}
                >
                  <Text style={[
                    styles.dropdownItemTexto,
                    cidadeEvento === item && styles.dropdownItemTextoAtivo,
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              scrollEnabled
              nestedScrollEnabled
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
  },
  botaoCriar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },

  listHeader: {
    paddingTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  banner: {
    backgroundColor: '#141414',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    marginBottom: 20,
  },
  bannerAccent: { height: 3, backgroundColor: GOLD },
  bannerContent: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  bannerEmoji: { fontSize: 32 },
  bannerTextos: { flex: 1 },
  bannerTitulo: { color: '#fff', fontSize: 18, fontWeight: '900' },
  bannerSub: { color: '#888', fontSize: 12, marginTop: 3, lineHeight: 18 },

  divisorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  divisorLinha: { flex: 1, height: 1, backgroundColor: BORDER },
  losango: {
    width: 8,
    height: 8,
    backgroundColor: GOLD,
    transform: [{ rotate: '45deg' }],
  },

  barraAcoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  inputBusca: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  botaoFiltro: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },

  ctaLogin: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a0e00', borderRadius: 12,
    borderWidth: 1, borderColor: '#3a2a00',
    padding: 14, gap: 10, marginBottom: 8,
  },
  ctaLoginTexto: { color: GOLD, fontSize: 13, fontWeight: '600', flex: 1 },

  centralizador: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  textoVazio: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
  },
  lista: {
    paddingHorizontal: 0,
    paddingVertical: 12,
  },
  cardContainer: {
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  headerSecao: {
    fontSize: 14,
    fontWeight: '700',
    color: GOLD,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  limparFiltros: {
    color: GOLD,
    fontWeight: '700',
  },
  modalConteudo: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalScroll: {
    paddingBottom: 80,
  },
  fotosecao: {
    marginBottom: 24,
  },
  fotoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  fotoPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#141414',
    borderWidth: 2,
    borderColor: BORDER,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  botoesFoto: {
    flexDirection: 'row',
    gap: 12,
  },
  botaoFotoSecundario: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 10,
    paddingVertical: 10,
    gap: 8,
  },
  botaoTextoSecundario: {
    color: GOLD,
    fontWeight: '700',
    fontSize: 14,
  },
  formulario: {
    gap: 16,
    marginBottom: 16,
  },
  grupoInput: {
    gap: 8,
  },
  labelInput: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  textInput: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
  },
  textAreaInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  tiposScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  tipoBotao: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    marginRight: 8,
  },
  tipoBotaoAtivo: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  tipoBotaoTexto: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  tipoBotaoTextoAtivo: {
    color: BG,
  },
  estadosScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  estadosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  estadoBotao: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  estadoBotaoAtivo: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  estadoBotaoTexto: {
    color: '#888',
    fontSize: 11,
    fontWeight: '600',
  },
  estadoBotaoTextoAtivo: {
    color: BG,
  },
  cidadesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  cidadesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cidadeBotao: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cidadeBotaoAtivo: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  cidadeBotaoTexto: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  cidadeBotaoTextoAtivo: {
    color: BG,
  },
  mensagemVazia: {
    backgroundColor: '#141414',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mensagemVaziaTexto: {
    color: '#666',
    fontSize: 12,
  },
  botaoPrimario: {
    backgroundColor: GOLD,
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  botaoPrimarioTexto: {
    color: BG,
    fontWeight: '900',
    fontSize: 15,
  },
  secaoFiltro: {
    marginBottom: 24,
  },
  titloFiltro: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 12,
  },
  filtrosScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  filtrosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filtroChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#141414',
    marginRight: 8,
  },
  filtroChipAtivo: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  filtroChipTexto: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  filtroChipTextoAtivo: {
    color: BG,
  },
  fotoDetalhes: {
    width: '100%',
    height: 250,
    marginBottom: 16,
  },
  detalheConteudo: {
    paddingBottom: 80,
  },
  detalheCriadorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    backgroundColor: '#141414',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 10,
  },
  detalheCriadorFoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
  },
  detalheCriadorNome: {
    fontSize: 13,
    color: '#aaa',
    fontWeight: '600',
    flex: 1,
  },
  detalheTitulo: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 16,
  },
  detalheInfo: {
    backgroundColor: '#141414',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    gap: 12,
    marginBottom: 16,
  },
  detalheItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detalheTexto: {
    color: '#aaa',
    fontSize: 14,
    flex: 1,
  },
  detalheSecao: {
    marginBottom: 16,
  },
  detalheSubtitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: GOLD,
    marginBottom: 12,
  },
  detalheTextoLongo: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
  },
  comentarioCard: {
    backgroundColor: '#141414',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    marginBottom: 8,
  },
  comentarioTexto: {
    color: '#fff',
    fontSize: 13,
    marginBottom: 6,
  },
  comentarioData: {
    color: '#666',
    fontSize: 11,
  },
  adicionarComentarioContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  comentarioInput: {
    flex: 1,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    maxHeight: 100,
  },
  botaoComentario: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  denunciaContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 16,
  },
  denunciaTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
  },
  denunciaInput: {
    width: '100%',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
    minHeight: 120,
  },
  denunciaAviso: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 12,
  },
  overlayModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModalContent: {
    backgroundColor: '#141414',
    borderRadius: 12,
    maxHeight: '70%',
    width: '85%',
    borderWidth: 1,
    borderColor: BORDER,
  },
  dropdownSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  dropdownSearchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  dropdownItemAtivo: {
    backgroundColor: GOLD,
  },
  dropdownItemTexto: {
    color: '#aaa',
    fontSize: 14,
  },
  dropdownItemTextoAtivo: {
    color: BG,
    fontWeight: '700',
  },
});
