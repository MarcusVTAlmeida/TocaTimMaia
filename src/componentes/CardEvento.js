import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Share,
  Linking,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const GOLD = '#C9A84C';
const BG = '#0a0a0a';
const CARD = '#141414';
const BORDER = '#2a2a2a';

export default function CardEvento({
  evento,
  onPressFav,
  onPressPresenca,
  onPressComentarios,
  onPress,
  onDelete,
  onDenunciar,
  usuarioAtualId,
}) {
  const dataFormatada = useMemo(() => {
    const data = new Date(evento.dataEvento);
    return {
      dia: data.getDate().toString().padStart(2, '0'),
      mes: data.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase(),
      hora: data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
  }, [evento.dataEvento]);

  const jaCurtido = evento.curtidasPor?.includes(usuarioAtualId) || false;
  const jaPresente = evento.presencasPor?.includes(usuarioAtualId) || false;

  const handleCompartilhar = async () => {
    try {
      await Share.share({
        message: `Confira este evento: ${evento.nome} em ${evento.cidade}! ${evento.linkIngressos || ''}`,
        title: evento.nome,
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {}
      {evento.foto && (
        <Image
          source={{ uri: evento.foto }}
          style={styles.imagem}
          resizeMethod="resize"
        />
      )}

      {}
      <View style={styles.dataContainer}>
        <View style={styles.dataBadge}>
          <Text style={styles.dataDia}>{dataFormatada.dia}</Text>
          <Text style={styles.dataMes}>{dataFormatada.mes}</Text>
        </View>
      </View>

      {}
      {evento.oficial && (
        <View style={styles.selOficial}>
          <Icon name="check-circle" size={20} color={GOLD} />
          <Text style={styles.seloTexto}>Oficial</Text>
        </View>
      )}

      {}
      {evento.passado && (
        <View style={styles.badgePassado}>
          <Text style={styles.textoPassado}>Evento Finalizado</Text>
        </View>
      )}

      {}
      <View style={styles.conteudo}>
        {}
        <View style={styles.criadorRow}>
          <Image
            source={{ uri: evento.criadorFoto || 'https://ui-avatars.com/api/?background=141414&color=C9A84C&name=?' }}
            style={styles.criadorFoto}
          />
          <Text style={styles.criadorNome} numberOfLines={1}>
            {evento.criadorNome || 'Anônimo'}
          </Text>
        </View>

        {}
        <Text style={styles.nome} numberOfLines={2}>
          {evento.nome}
        </Text>

        {}
        {evento.tipo && (
          <View style={styles.tipoBadge}>
            <Text style={styles.tipoTexto}>{evento.tipo}</Text>
          </View>
        )}

        {}
        <View style={styles.localContainer}>
          <Icon name="map-pin" size={14} color={GOLD} />
          <Text style={styles.localTexto} numberOfLines={1}>
            {evento.cidade}
            {evento.estado ? `, ${evento.estado}` : ''}
          </Text>
        </View>

        {}
        <View style={styles.horaContainer}>
          <Icon name="clock" size={14} color="#888" />
          <Text style={styles.horaTexto}>{dataFormatada.hora}</Text>
        </View>

        {}
        {evento.descricao && (
          <Text
            style={styles.descricao}
            numberOfLines={2}
          >
            {evento.descricao}
          </Text>
        )}

{}
<View style={styles.acoesContainer}>

  {}
  {!evento.passado && (
    <TouchableOpacity
      style={[styles.presencaBtn, jaPresente && styles.presencaBtnAtivo]}
      onPress={onPressPresenca}
      activeOpacity={0.8}
    >
      <Icon name={jaPresente ? 'check-circle' : 'user-plus'} size={15} color={jaPresente ? BG : GOLD} />
      <Text style={[styles.presencaBtnTexto, jaPresente && styles.presencaBtnTextoAtivo]}>
        {jaPresente ? 'Confirmado!' : 'Confirmar presença'}
      </Text>
      {(evento.presencas > 0) && (
        <View style={styles.presencaContador}>
          <Text style={styles.presencaContadorTexto}>{evento.presencas}</Text>
        </View>
      )}
    </TouchableOpacity>
  )}

  {}
  <View style={styles.acoesSecundarias}>
    <TouchableOpacity style={styles.acaoBtn} onPress={onPressFav} disabled={evento.passado}>
      <Icon name="heart" size={16} color={jaCurtido ? '#ff6b6b' : '#888'} />
      <Text style={styles.acaoBtnTexto}>{evento.curtidas || 0}</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.acaoBtn} onPress={onPressComentarios}>
      <Icon name="message-circle" size={16} color="#888" />
      <Text style={styles.acaoBtnTexto}>{evento.comentarios?.length || 0}</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.acaoBtn} onPress={handleCompartilhar}>
      <Icon name="share-2" size={16} color="#888" />
    </TouchableOpacity>

    {usuarioAtualId && evento.criadorId === usuarioAtualId && onDelete ? (
      <TouchableOpacity style={styles.acaoBtn} onPress={onDelete}>
        <Icon name="trash-2" size={16} color="#ff6b6b" />
      </TouchableOpacity>
    ) : null}

    {usuarioAtualId && evento.criadorId !== usuarioAtualId && onDenunciar ? (
      <TouchableOpacity style={styles.acaoBtn} onPress={onDenunciar}>
        <Icon name="flag" size={16} color="#888" />
      </TouchableOpacity>
    ) : null}

  {evento.linkIngressos && (
  <TouchableOpacity
    style={[styles.acaoBtn, styles.acaoBtnPrimaria]}
    onPress={() => {
      const url = evento.linkIngressos.startsWith('http')
        ? evento.linkIngressos
        : `https://${evento.linkIngressos}`;
      Linking.openURL(url).catch(() =>
        Alert.alert('Erro', 'Não foi possível abrir o link.')
      );
    }}
  >
    <Icon name="external-link" size={14} color={BG} />
    <Text style={styles.acaoBtnPrimariaTexto}>Ingressos</Text>
  </TouchableOpacity>
)}
  </View>

</View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imagem: {
    width: '100%',
    height: 200,
    backgroundColor: '#1a1a1a',
  },
  dataContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  dataBadge: {
    backgroundColor: GOLD,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  dataDia: {
    fontSize: 16,
    fontWeight: '900',
    color: BG,
  },
  dataMes: {
    fontSize: 11,
    fontWeight: '700',
    color: BG,
  },
  selOficial: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 10, 0.85)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  seloTexto: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '700',
  },
  badgePassado: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  textoPassado: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  conteudo: {
    padding: 16,
    gap: 10,
  },
  criadorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  criadorFoto: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
  },
  criadorNome: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
    flex: 1,
  },
  nome: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  tipoBadge: {
    backgroundColor: 'rgba(201, 168, 76, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  tipoTexto: {
    fontSize: 11,
    fontWeight: '600',
    color: GOLD,
    textTransform: 'capitalize',
  },
  localContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  localTexto: {
    fontSize: 13,
    color: '#aaa',
    flex: 1,
  },
  horaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  horaTexto: {
    fontSize: 13,
    color: '#888',
  },
  descricao: {
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
    marginTop: 4,
  },
  acoesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    flexWrap: 'wrap',
  },
  acaoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  acaoBtnTexto: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  acaoBtnPrimaria: {
    backgroundColor: GOLD,
    marginLeft: 'auto',
  },
  acaoBtnPrimariaTexto: {
    fontSize: 12,
    color: BG,
    fontWeight: '700',
  },
  presencaBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  borderWidth: 1.5,
  borderColor: GOLD,
  borderRadius: 20,
  paddingHorizontal: 14,
  paddingVertical: 8,
  backgroundColor: 'transparent',
},
presencaBtnAtivo: {
  backgroundColor: GOLD,
  borderColor: GOLD,
},
presencaBtnTexto: {
  color: GOLD,
  fontSize: 12,
  fontWeight: '700',
},
presencaBtnTextoAtivo: {
  color: BG,
},
presencaContador: {
  backgroundColor: 'rgba(201,168,76,0.2)',
  borderRadius: 10,
  paddingHorizontal: 6,
  paddingVertical: 1,
  marginLeft: 2,
},
presencaContadorTexto: {
  color: GOLD,
  fontSize: 10,
  fontWeight: '800',
},
acoesSecundarias: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  marginTop: 8,
},
});
