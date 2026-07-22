import { Image } from 'react-native';
import AVATAR_ITENS from '../dados/avatarItens';

const REQUIRES_MAP = {};
AVATAR_ITENS.forEach((item) => {
  REQUIRES_MAP[item.id] = item.imagem;
});

const cache = {};
const prefetchCache = new Set();

const getRequire = (itemId) => {
  const nome = REQUIRES_MAP[itemId];
  if (!nome) return null;
  switch (nome) {
    case 'avatar_tim1.png':
      return require('../../assets/avatares/avatar_tim1.png');
    case 'avatar_tim2.png':
      return require('../../assets/avatares/avatar_tim2.png');
    case 'avatar_tim3.png':
      return require('../../assets/avatares/avatar_tim3.png');
    case 'avatar_tim4.png':
      return require('../../assets/avatares/avatar_tim4.png');
    case 'avatar_tim5.png':
      return require('../../assets/avatares/avatar_tim5.png');
    case 'avatar_tim6.png':
      return require('../../assets/avatares/avatar_tim6.png');
    case 'avatar_tim7.png':
      return require('../../assets/avatares/avatar_tim7.png');
    case 'avatar_tim8.png':
      return require('../../assets/avatares/avatar_tim8.png');
    case 'avatar_tim9.png':
      return require('../../assets/avatares/avatar_tim9.png');
    case 'avatar_tim10.png':
      return require('../../assets/avatares/avatar_tim10.png');
    case 'avatar_tim11.png':
      return require('../../assets/avatares/avatar_tim11.png');
    default:
      return null;
  }
};

export const getImagemUrl = (itemId) => {
  if (cache[itemId]) return Promise.resolve(cache[itemId]);
  const req = getRequire(itemId);
  if (!req) return Promise.resolve(null);
  const asset = Image.resolveAssetSource(req);
  cache[itemId] = asset.uri;
  return Promise.resolve(asset.uri);
};

export const getUrlSincrona = (itemId) => {
  if (cache[itemId]) return cache[itemId];
  const req = getRequire(itemId);
  if (!req) return null;
  const asset = Image.resolveAssetSource(req);
  cache[itemId] = asset.uri;
  return asset.uri;
};

export const precarregarImagens = async (ids) => {
  ids.forEach((id) => {
    const url = getUrlSincrona(id);
    if (url && !prefetchCache.has(url)) {
      prefetchCache.add(url);
      Image.prefetch(url).catch(() => prefetchCache.delete(url));
    }
  });
};

export const carregarItemPrioritario = (itemId) => {
  return getImagemUrl(itemId);
};

export const garantirCatalogoCarregado = () => {
  return Promise.resolve({});
};
