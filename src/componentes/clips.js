import { env } from '../config/env';

const FOLDER_CLIPS_ID = '1SBJ6JShqtdczmDJhx0l7cbodty4Dncmf';

export async function buscarClips() {
  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${FOLDER_CLIPS_ID}'+in+parents+and+mimeType+contains+'video/'&fields=files(id,name,mimeType,thumbnailLink,videoMediaMetadata)&key=${env.googleDriveApiKey}`
    );
    const data = await res.json();

    if (!data.files || data.files.length === 0) {
      console.warn('Nenhum vídeo encontrado na pasta.');
      return [];
    }

    const clips = data.files.map((video) => {
      const thumbnail = video.thumbnailLink
        ? video.thumbnailLink.replace('=s220', '=s400')
        : `https://drive.google.com/thumbnail?id=${video.id}&sz=w400`;

      return {
        nome: video.name.replace(/\.[^/.]+$/, ''),

        imagem: thumbnail,
        video: `https://drive.google.com/file/d/${video.id}/view`,
      };
    });

    return clips;

  } catch (error) {
    console.error('Erro ao buscar clips:', error);
    return [];
  }
}
