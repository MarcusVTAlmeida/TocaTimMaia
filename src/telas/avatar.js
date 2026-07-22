import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Image, ScrollView,
  SafeAreaView, PanResponder, Platform, Animated,
} from 'react-native';
import RNFS from 'react-native-fs';
import RNShare from 'react-native-share';
import { useAuth } from '../componentes/AuthContext';
import { useAvatar } from '../componentes/AvatarContext';
import AVATAR_ITENS, { obterItem } from '../dados/avatarItens';
import { getImagemUrl } from '../componentes/avatarImagens';

const GOLD   = '#C9A84C';
const BG     = '#0a0a0a';
const CARD   = '#141414';
const BORDER = '#2a2a2a';
const GREEN  = '#22C55E';
const MUTED  = '#555';

const mimePorExtensao = (ext) => {
  const e = (ext || 'png').toLowerCase();
  if (e === 'jpg' || e === 'jpeg') return 'image/jpeg';
  if (e === 'webp') return 'image/webp';
  return 'image/png';
};

function SkeletonBox({ width, height, borderRadius = 8 }) {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: '#2a2a2a',
        opacity: anim,
      }}
    />
  );
}

function AvatarItemCard({
  item, comprado, equipadoAtivo, podeComprar,
  acaoEmAndamento, getUrlItem, registrarUrl,
  onEquipar, onComprar,
}) {
  const [source, setSource]         = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    const urlCache = getUrlItem(item.id);
    if (urlCache) {
      setSource({ uri: urlCache });
      setCarregando(false);
      return;
    }

    getImagemUrl(item.id).then(url => {
      if (!ativo) return;
      if (url) {
        registrarUrl(item.id, url);
        setSource({ uri: url });
      }
      setCarregando(false);
    });

    return () => { ativo = false; };
  }, [item.id]);

  return (
    <View style={[styles.itemCard, equipadoAtivo && styles.itemCardAtivo]}>
      <View style={styles.itemIconBox}>
        {carregando ? (
          <SkeletonBox width={60} height={80} borderRadius={8} />
        ) : source ? (
          <Image
            source={source}
            style={styles.itemImagem}
            resizeMode="contain"
            resizeMethod="resize"
          />
        ) : (
          <Text style={styles.erroImagemSmall}>?</Text>
        )}
      </View>

      <View style={styles.itemInfo}>
        <Text style={styles.itemNome}>{item.nome}</Text>
        <Text style={styles.itemDesc}>{item.descricao}</Text>
        <View style={styles.itemCusto}>
          <Text style={styles.moedaIcone}>🪙</Text>
          <Text
            style={[
              styles.itemCustoTexto,
              !comprado && !podeComprar && styles.custoInsuficiente,
            ]}
          >
            {item.custo}
          </Text>
        </View>
      </View>

      <View style={styles.itemAcao}>
        {comprado ? (
          equipadoAtivo ? (
            <View style={styles.equipadoBadge}>
              <Text style={styles.equipadoBadgeTexto}>Equipado</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.btnEquipar}
              onPress={() => onEquipar(item.id)}
              disabled={acaoEmAndamento}
            >
              <Text style={styles.btnEquiparTexto}>Equipar</Text>
            </TouchableOpacity>
          )
        ) : (
          <TouchableOpacity
            style={[styles.btnComprar, !podeComprar && styles.btnComprarDisabled]}
            onPress={() => onComprar(item)}
            disabled={!podeComprar || acaoEmAndamento}
          >
            <Text
              style={[
                styles.btnComprarTexto,
                !podeComprar && styles.btnComprarTextoDisabled,
              ]}
            >
              Comprar
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function AvatarScreen({ navigation }) {
  const { usuario } = useAuth();
  const {
    avatarCoins,
    equipado,
    carregandoAvatar,
    getUrlItem,
    registrarUrl,
    comprarItem,
    equiparItem,
    itemComprado,
    itemEquipado,
  } = useAvatar();

  const [acaoEmAndamento, setAcaoEmAndamento] = useState(false);
  const [compartilhando, setCompartilhando]   = useState(false);

  const [zoom, setZoom]                       = useState(0.85);
  const [pan, setPan]                         = useState({ x: 0, y: 0 });

  const [previewSource, setPreviewSource]   = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const panRef  = useRef({ x: 0, y: 0 });
  const panBase = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(0.85);

  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  useEffect(() => {
    if (!equipado) {
      setPreviewSource(null);
      setPreviewLoading(false);
      return;
    }

    const urlCache = getUrlItem(equipado);
    if (urlCache) {

      setPreviewSource({ uri: urlCache });
      setPreviewLoading(false);
      return;
    }

    setPreviewLoading(true);
    let ativo = true;
    getImagemUrl(equipado).then(url => {
      if (!ativo) return;
      if (url) {
        registrarUrl(equipado, url);
        setPreviewSource({ uri: url });
      } else {
        setPreviewSource(null);
      }
      setPreviewLoading(false);
    });
    return () => { ativo = false; };
  }, [equipado]);

  useEffect(() => {
    setZoom(0.85);
    setPan({ x: 0, y: 0 });
    panRef.current  = { x: 0, y: 0 };
    panBase.current = { x: 0, y: 0 };
  }, [equipado]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => zoomRef.current > 1,
      onMoveShouldSetPanResponder:  () => zoomRef.current > 1,
      onPanResponderGrant: () => {
        panBase.current = { ...panRef.current };
      },
      onPanResponderMove: (_, g) => {
        const novo = { x: panBase.current.x + g.dx, y: panBase.current.y + g.dy };
        panRef.current = novo;
        setPan(novo);
      },
      onPanResponderRelease: () => {
        panBase.current = { ...panRef.current };
      },
    })
  ).current;

  const resolverUrlItem = useCallback(async (itemId) => {
    if (!itemId) return null;
    const urlCache = getUrlItem(itemId);
    if (urlCache) return urlCache;
    return getImagemUrl(itemId);
  }, [getUrlItem]);

  const baixarAvatarLocal = useCallback(async (itemId) => {
    const url = await resolverUrlItem(itemId);
    if (!url) return null;

    if (url.startsWith('res:/') || url.startsWith('resource:/')) {
      const item = obterItem(itemId);
      const nomeSemExt = item?.imagem?.replace(/\.[^/.]+$/, '');
      if (nomeSemExt) {
        return `android.resource://com.queniabr.TocaTimMaia/drawable/${nomeSemExt}`;
      }
    }

    const ext       = url.split('.').pop()?.split('?')[0] || 'png';
    const localPath = `${RNFS.CachesDirectoryPath}/avatar_${itemId}.${ext}`;
    if (await RNFS.exists(localPath)) return localPath;

    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const result = await RNFS.downloadFile({ fromUrl: url, toFile: localPath }).promise;
        if (result.statusCode === 200) return localPath;
      } catch {}
    }

    return null;
  }, [resolverUrlItem]);

  const handleComprar = async (item) => {
    if (acaoEmAndamento) return;
    setAcaoEmAndamento(true);
    try {
      await comprarItem(item.id);
      Alert.alert('Item adquirido!', `"${item.nome}" foi adicionado ao seu inventário.`);
    } catch (e) {
      Alert.alert('Erro', e.message || 'Não foi possível comprar o item.');
    } finally {
      setAcaoEmAndamento(false);
    }
  };

  const handleEquipar = async (itemId) => {
    if (acaoEmAndamento) return;
    setAcaoEmAndamento(true);
    try {
      await equiparItem(itemId);
    } catch (e) {
      Alert.alert('Erro', e.message || 'Não foi possível equipar o item.');
    } finally {
      setAcaoEmAndamento(false);
    }
  };

  const handleCompartilhar = async (itemId) => {
    if (!itemId || compartilhando) return;
    setCompartilhando(true);
    try {
      const localPath = await baixarAvatarLocal(itemId);
      if (!localPath) {
        Alert.alert('Erro', 'Não foi possível preparar a imagem do avatar.');
        return;
      }
      const item    = obterItem(itemId);
      const legenda = `Meu avatar do TocaTimMaia — ${item?.nome || 'Tim Maia'}!`;
      const ext     = localPath.split('.').pop()?.toLowerCase() || 'png';
      const fileUrl = localPath.startsWith('file://') ? localPath : `file://${localPath}`;
      await RNShare.open({
        url: fileUrl,
        type: mimePorExtensao(ext),
        message: legenda,
        title: 'Meu avatar do TocaTimMaia',
        failOnCancel: false,
      });
    } catch (e) {
      const cancelado =
        e?.message === 'User did not share' ||
        e?.message?.includes('User did not share') ||
        e?.dismissedAction === true;
      if (!cancelado) {
        Alert.alert('Erro', 'Não foi possível compartilhar o avatar.');
      }
    } finally {
      setCompartilhando(false);
    }
  };

  const handleBaixar = async (itemId) => {
    const url = await resolverUrlItem(itemId);
    if (!url) {
      Alert.alert('Erro', 'URL da imagem não disponível.');
      return;
    }
    try {
      const ext     = url.split('.').pop()?.split('?')[0] || 'png';
      const nome    = `avatar_${itemId}_${Date.now()}.${ext}`;
      const destino = `${RNFS.DownloadDirectoryPath}/${nome}`;
      const result  = await RNFS.downloadFile({ fromUrl: url, toFile: destino }).promise;
      if (result.statusCode === 200) {
        if (Platform.OS === 'android') RNFS.scanFile(destino);
        Alert.alert('Sucesso', `Avatar salvo em Downloads/${nome}`);
      } else {
        Alert.alert('Erro', 'Falha ao baixar o avatar.');
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível baixar o avatar.');
    }
  };

  if (carregandoAvatar) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centralizado}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={styles.loadingTexto}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!usuario) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centralizado}>
          <Text style={styles.emptyTitulo}>Faça login</Text>
          <Text style={styles.emptySub}>
            Crie uma conta ou entre para personalizar seu avatar.
          </Text>
          <TouchableOpacity
            style={styles.btnIrConta}
            onPress={() => navigation?.navigate?.('Conta')}
          >
            <Text style={styles.btnIrContaTexto}>Entrar / Criar conta</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const avatarEquipado = equipado ? obterItem(equipado) : null;
  const exibirPreview  = Boolean(avatarEquipado);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {exibirPreview && (
          <View style={styles.previewArea}>
            <View style={styles.previewMoldura} {...panResponder.panHandlers}>
              {previewLoading ? (
                <SkeletonBox width={160} height={280} borderRadius={16} />
              ) : previewSource ? (
                <Image
                  key={equipado}
                  source={previewSource}
                  style={[
                    styles.previewImagem,
                    {
                      transform: [
                        { scale: zoom },
                        { translateX: pan.x },
                        { translateY: pan.y },
                      ],
                    },
                  ]}
                  resizeMode="contain"
                  resizeMethod="resize"
                />
              ) : (
                <Text style={styles.erroImagem}>Imagem indisponível</Text>
              )}
            </View>

            <View style={styles.zoomRow}>
              <TouchableOpacity
                style={styles.zoomBtn}
                onPress={() => setZoom(z => Math.max(0.5, z - 0.15))}
              >
                <Text style={styles.zoomBtnTexto}>Zoom -</Text>
              </TouchableOpacity>

              <Text style={styles.zoomValor}>{Math.round(zoom * 100)}%</Text>

              <TouchableOpacity
                style={styles.zoomBtn}
                onPress={() => setZoom(z => Math.min(3, z + 0.15))}
              >
                <Text style={styles.zoomBtnTexto}>Zoom +</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setZoom(0.85);
                  setPan({ x: 0, y: 0 });
                  panRef.current  = { x: 0, y: 0 };
                  panBase.current = { x: 0, y: 0 };
                }}
              >
                <Text style={styles.resetBtnTexto}>↺</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.previewName}>Tim Maia</Text>
            <Text style={styles.previewItemNome}>{avatarEquipado?.nome || ''}</Text>

            <View style={styles.acaoRow}>
              <TouchableOpacity
                style={[styles.btnAcao, compartilhando && styles.btnAcaoDisabled]}
                onPress={() => handleCompartilhar(equipado)}
                disabled={compartilhando}
              >
                {compartilhando ? (
                  <ActivityIndicator size="small" color={BG} />
                ) : (
                  <Text style={styles.btnAcaoTexto}>Compartilhar</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnAcao}
                onPress={() => handleBaixar(equipado)}
              >
                <Text style={styles.btnAcaoTexto}>Baixar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.coinBar}>
          <Text style={styles.coinLabel}>Suas moedas</Text>
          <View style={styles.coinValue}>
            <Text style={styles.coinIcone}>🪙</Text>
            <Text style={styles.coinTexto}>{avatarCoins}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Escolha seu Avatar</Text>

        <View style={styles.itensGrid}>
          {AVATAR_ITENS.map((item) => (
            <AvatarItemCard
              key={item.id}
              item={item}
              comprado={itemComprado(item.id)}
              equipadoAtivo={itemEquipado(item.id)}
              podeComprar={avatarCoins >= item.custo}
              acaoEmAndamento={acaoEmAndamento}
              getUrlItem={getUrlItem}
              registrarUrl={registrarUrl}
              onEquipar={handleEquipar}
              onComprar={handleComprar}
            />
          ))}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>🪙 Como ganhar moedas</Text>
          <Text style={styles.infoText}>
            Jogue o quiz e acerte as perguntas para acumular pontos. Cada jogo
            completo rende 50 moedas + bônus por pontuação. Use as moedas para
            comprar novos avatares!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll: { padding: 16, paddingBottom: 40 },
  centralizado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingTexto: { color: '#888', fontSize: 13, marginTop: 12 },
  emptyTitulo: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  emptySub: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  btnIrConta: {
    backgroundColor: GOLD,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  btnIrContaTexto: { color: BG, fontWeight: '800', fontSize: 15 },

  previewArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewMoldura: {
    width: 160,
    height: 280,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  previewImagem: {
    width: 220,
    height: 260,
  },
  erroImagem: {
    color: MUTED,
    fontSize: 12,
    textAlign: 'center',
  },
  erroImagemSmall: {
    color: MUTED,
    fontSize: 20,
    fontWeight: '900',
  },

  zoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  zoomBtn: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
  },
  zoomBtnTexto: { color: '#fff', fontSize: 12, fontWeight: '700' },
  zoomValor: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '800',
    minWidth: 44,
    textAlign: 'center',
  },

  resetBtn: {
    marginLeft: 4,
    backgroundColor: '#222',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
  },
  resetBtnTexto: { color: '#fff', fontSize: 12, fontWeight: '700' },

  dragHint: {
    color: MUTED,
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  previewName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 10,
  },
  previewItemNome: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },

  coinBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 16,
  },
  coinLabel: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  coinValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coinIcone: { fontSize: 18 },
  coinTexto: {
    color: GOLD,
    fontSize: 20,
    fontWeight: '900',
  },

  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  itensGrid: {
    gap: 12,
    marginBottom: 20,
  },
  itemCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  itemCardAtivo: {
    borderColor: GOLD,
    backgroundColor: '#1a1500',
  },
  itemIconBox: {
    width: 60,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  itemImagem: {
    width: 60,
    height: 80,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemNome: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  itemDesc: {
    color: '#666',
    fontSize: 11,
  },
  itemCusto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  moedaIcone: { fontSize: 13 },
  itemCustoTexto: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  custoInsuficiente: {
    color: '#E53935',
  },
  itemAcao: {
    justifyContent: 'center',
  },
  btnComprar: {
    backgroundColor: GOLD,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnComprarDisabled: {
    backgroundColor: '#333',
  },
  btnComprarTexto: {
    color: BG,
    fontSize: 13,
    fontWeight: '800',
  },
  btnComprarTextoDisabled: {
    color: '#666',
  },
  btnEquipar: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GOLD,
  },
  btnEquiparTexto: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '800',
  },
  equipadoBadge: {
    backgroundColor: '#14532d',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GREEN,
  },
  equipadoBadgeTexto: {
    color: GREEN,
    fontSize: 12,
    fontWeight: '800',
  },
  acaoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 4,
  },
  btnAcao: {
    backgroundColor: GOLD,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  btnAcaoDisabled: {
    opacity: 0.7,
  },
  btnAcaoTexto: {
    color: BG,
    fontWeight: '700',
    fontSize: 13,
  },
  infoBox: {
    backgroundColor: '#111',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    gap: 8,
  },
  infoTitle: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '800',
  },
  infoText: {
    color: '#666',
    fontSize: 12,
    lineHeight: 18,
  },
});