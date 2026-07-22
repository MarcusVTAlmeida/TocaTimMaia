import { env } from '../config/env';

const FOLDER_SHOWS_ID = '1IJcbE79_mcF1pyTKbankcoNv5sT7Ur-g';

export async function buscarShows() {
  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${FOLDER_SHOWS_ID}'+in+parents&fields=files(id,name,mimeType,thumbnailLink,videoMediaMetadata)&key=${env.googleDriveApiKey}`
    );
    const data = await res.json();

    if (!data.files || data.files.length === 0) return [];

    const imagens = data.files.filter((f) => f.mimeType.startsWith('image/'));
    const videos = data.files.filter((f) => f.mimeType.startsWith('video/'));

    const shows = videos.map((video) => {
      const nomeBase = video.name.replace(/\.[^/.]+$/, '');

      const capaManual = imagens.find((img) =>
        img.name.replace(/\.[^/.]+$/, '') === `${nomeBase}_thumb`
      );

      const thumbnail = capaManual
        ? `https://drive.google.com/thumbnail?id=${capaManual.id}&sz=w400`
        : video.thumbnailLink
        ? video.thumbnailLink.replace('=s220', '=s400')
        : `https://drive.google.com/thumbnail?id=${video.id}&sz=w400`;

      const duracaoMs = video.videoMediaMetadata?.durationMillis;
      const duracaoSeg = duracaoMs ? Math.round(parseInt(duracaoMs, 10) / 1000) : null;

      return {
        id: video.id,
        nome: nomeBase,
        tipo: video.mimeType,
        imagem: thumbnail,
        video: `https://drive.google.com/file/d/${video.id}/preview`,
        downloadUrl: `https://drive.usercontent.google.com/download?id=${video.id}&export=download&confirm=t`,
        duracao: duracaoSeg,
      };
    });

    console.warn(`[shows] ${shows.length} shows carregados`, shows.map(s => ({ nome: s.nome, tipo: s.tipo })));
    return shows;
  } catch (error) {
    console.error('Erro ao buscar shows:', error);
    return [];
  }
}
