import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from '@react-native-firebase/firestore';

const db = getFirestore();
const COLECAO_MURAL = 'mural';
const POSTS_NO_CAROUSEL = 10;

export async function buscarPostsMural() {
  try {
    const q = query(
      collection(db, COLECAO_MURAL),
      where('denuncias', '<', 3),
      where('aprovado', '==', true),
      orderBy('denuncias'),
      orderBy('curtidas', 'desc'),
      limit(POSTS_NO_CAROUSEL)
    );

    const snap = await getDocs(q);
    const posts = snap.docs
      .map(doc => ({
        id: doc.id,
        nome: doc.data().nome || 'Fã anônimo',
        imagem: doc.data().imagemUrl,
        texto: doc.data().texto || '',
        curtidas: doc.data().curtidas || 0,
        criadoEm: doc.data().criadoEm,
      }))
      .filter(post => post.imagem);

    return posts;
  } catch (error) {
    console.error('Erro ao buscar posts do mural:', error);
    return [];
  }
}
