import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

export default function HeaderTim() {
  return (
    <View style={styles.header}>
      <Image
        source={{ uri: 'https://drive.google.com/uc?export=view&id=1SvfUZJgTFHKLxIL4tZZziHvUoOx8X9hc' }}
        style={styles.avatar}
      />
      <Text style={styles.nome}>Tim Maia</Text>
      <Text style={styles.anos}>1942 – 1998</Text>
      <Text style={styles.alcunha}>✦ O Rei do Soul Brasileiro ✦</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
