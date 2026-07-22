import { env } from '../config/env';

const FOLDER_ENTREVISTAS_ID = '1nllaBwAfSigHZ-cPkE7syWLT0LchZVy6';

export async function buscarEntrevistas() {
  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ENTREVISTAS_ID}'+in+parents+and+mimeType+contains+'video/'&fields=files(id,name,mimeType,thumbnailLink,videoMediaMetadata)&key=${env.googleDriveApiKey}`
    );
    const data = await res.json();

    if (!data.files || data.files.length === 0) {
      console.warn('Nenhum vídeo encontrado na pasta.');
      return [];
    }

    const entrevistas = data.files.map((video) => {
      const thumbnail = video.thumbnailLink
        ? video.thumbnailLink.replace('=s220', '=s400')
        : `https://drive.google.com/thumbnail?id=${video.id}&sz=w400`;

      return {
        nome: video.name.replace(/\.[^/.]+$/, ''),
        imagem: thumbnail,
        video: `https://drive.google.com/file/d/${video.id}/view`
      };
    });

    return entrevistas;
  } catch (error) {
    console.error('Erro ao buscar entrevistas:', error);
    return [];
  }
}
