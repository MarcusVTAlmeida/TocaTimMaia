import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

const CACHE_DIR = `${RNFS.DocumentDirectoryPath}/video_cache`;
const VIDEO_FILENAME = 'background_video.mp4';
const VIDEO_URL =
  'https://www.youtube.com/watch?v=sQb7KH03xLc';

const MIN_VALID_BYTES = 512 * 1024;

let isPreloading = false;
let preloadPromise = null;

const ensureCacheDir = async () => {
  try {
    const exists = await RNFS.exists(CACHE_DIR);
    if (!exists) {
      await RNFS.mkdir(CACHE_DIR, { NSURLIsExcludedFromBackupKey: true });
    }
  } catch (e) {
    console.warn('Erro ao criar cache dir:', e);
  }
};

const getCachePath = () => `${CACHE_DIR}/${VIDEO_FILENAME}`;

const getLocalUri = () => {
  const path = getCachePath();
  return Platform.OS === 'android' ? `file://${path}` : path;
};

const arquivoCacheValido = async () => {
  try {
    const path = getCachePath();
    if (!(await RNFS.exists(path))) return false;
    const stat = await RNFS.stat(path);
    return stat.size >= MIN_VALID_BYTES;
  } catch {
    return false;
  }
};

const removerCacheInvalido = async () => {
  try {
    const path = getCachePath();
    if (await RNFS.exists(path)) {
      await RNFS.unlink(path);
    }
  } catch (e) {
    console.warn('Erro ao remover cache inválido:', e);
  }
};

const downloadVideo = async () => {
  await ensureCacheDir();
  const cachePath = getCachePath();

  if (await arquivoCacheValido()) {
    return getLocalUri();
  }

  await removerCacheInvalido();

  try {
    const result = await RNFS.downloadFile({
      fromUrl: VIDEO_URL,
      toFile: cachePath,
      background: true,
      progressDivider: 5,
    }).promise;

    if (result.statusCode !== 200) {
      await removerCacheInvalido();
      return VIDEO_URL;
    }

    if (!(await arquivoCacheValido())) {
      await removerCacheInvalido();
      return VIDEO_URL;
    }

    return getLocalUri();
  } catch (e) {
    console.warn('Erro ao baixar vídeo:', e);
    await removerCacheInvalido();
    return VIDEO_URL;
  }
};

export const preloadVideo = async () => {
  if (isPreloading) return preloadPromise;

  isPreloading = true;
  preloadPromise = downloadVideo();

  try {
    return await preloadPromise;
  } catch (e) {
    console.warn('Erro no pré-carregamento:', e);
    return VIDEO_URL;
  } finally {
    isPreloading = false;
  }
};

export const getVideoUri = async () => {
  try {
    if (await arquivoCacheValido()) {
      return getLocalUri();
    }
    return await downloadVideo();
  } catch (e) {
    console.warn('Erro ao obter URI do vídeo:', e);
    return VIDEO_URL;
  }
};

export const clearVideoCache = async () => {
  await removerCacheInvalido();
};

export { VIDEO_URL };
