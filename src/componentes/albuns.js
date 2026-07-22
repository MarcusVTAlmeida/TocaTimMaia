import { env } from '../config/env';

const FOLDER_ID = '1hF1Cdx_gfJapCOES5L1AKF7l5IuBxgiA';

export async function buscarAlbunsComMusicas() {
  try {
    const albunsRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents+and+mimeType='application/vnd.google-apps.folder'&key=${env.googleDriveApiKey}`
    );
    const albunsData = await albunsRes.json();

    const albunsComMusicas = await Promise.all(
      albunsData.files.map(async (album) => {
        const musicasRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q='${album.id}'+in+parents&key=${env.googleDriveApiKey}`
        );
        const musicasData = await musicasRes.json();

        const capa = musicasData.files.find((f) => f.mimeType.startsWith('image/'));
        const imagemUrl = capa
          ? `https://drive.google.com/thumbnail?id=${capa.id}&sz=w400`
          : 'https://via.placeholder.com/300';

        const musicas = musicasData.files
          .filter((f) => !f.mimeType.startsWith('image/'))
          .map((f) => ({
            nome: f.name,
            url: `https://drive.google.com/uc?export=download&id=${f.id}`,
          }));

        return {
          album: album.name,
          imagem: imagemUrl,
          resumo: `${musicas.length} músicas`,
          musicas,
        };
      })
    );

    return albunsComMusicas;
  } catch (error) {
    console.error('Erro ao buscar álbuns:', error);
    return [];
  }
}
