import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const GOLD = '#C9A84C';
const BG = '#0a0a0a';
const CARD = '#141414';

export default function BarraNotificacaoEvento({
  notificacao,
  onPress,
  onClose,
  animatedValue,
}) {
  if (!notificacao) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [-150, 0],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.notificationCard}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {}
        {notificacao.foto && (
          <Image
            source={{ uri: notificacao.foto }}
            style={styles.eventImage}
          />
        )}

        {}
        <View style={styles.content}>
          <View style={styles.header}>
            <Icon name="bell" size={16} color={GOLD} />
            <Text style={styles.tipo}>{notificacao.tipo_evento}</Text>
          </View>

          <Text style={styles.titulo} numberOfLines={1}>
            {notificacao.titulo}
          </Text>

          <Text style={styles.mensagem} numberOfLines={1}>
            {notificacao.mensagem}
          </Text>

          <View style={styles.footer}>
            <Icon name="calendar" size={12} color={GOLD} />
            <Text style={styles.dataHora}>
              {notificacao.data} · {notificacao.hora}
            </Text>
          </View>
        </View>

        {}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="x" size={18} color="#999" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 8,
    zIndex: 999,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GOLD + '44',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 10,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  eventImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipo: {
    color: GOLD,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titulo: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  mensagem: {
    color: '#aaa',
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dataHora: {
    color: '#888',
    fontSize: 10,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1d1d1d',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
