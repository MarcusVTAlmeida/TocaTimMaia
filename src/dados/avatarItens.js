const AVATAR_ITENS = [
  { id: 'avatar_tim1',  nome: 'Tim Maia 1',  descricao: 'Personagem completo estilo Tim Maia', custo: 500, imagem: 'avatar_tim1.png' },
  { id: 'avatar_tim2',  nome: 'Tim Maia 2',  descricao: 'Personagem completo estilo Tim Maia', custo: 500, imagem: 'avatar_tim2.png' },
  { id: 'avatar_tim3',  nome: 'Tim Maia 3',  descricao: 'Personagem completo estilo Tim Maia', custo: 500, imagem: 'avatar_tim3.png' },
  { id: 'avatar_tim4',  nome: 'Tim Maia 4',  descricao: 'Personagem completo estilo Tim Maia', custo: 500, imagem: 'avatar_tim4.png' },
  { id: 'avatar_tim5',  nome: 'Tim Maia 5',  descricao: 'Personagem completo estilo Tim Maia', custo: 500, imagem: 'avatar_tim5.png' },
  { id: 'avatar_tim6',  nome: 'Tim Maia 6',  descricao: 'Personagem completo estilo Tim Maia', custo: 500, imagem: 'avatar_tim6.png' },
  { id: 'avatar_tim7',  nome: 'Tim Maia 7',  descricao: 'Personagem completo estilo Tim Maia', custo: 500, imagem: 'avatar_tim7.png' },
  { id: 'avatar_tim8',  nome: 'Tim Maia 8',  descricao: 'Personagem completo estilo Tim Maia', custo: 500, imagem: 'avatar_tim8.png' },
  { id: 'avatar_tim9',  nome: 'Tim Maia 9',  descricao: 'Personagem completo estilo Tim Maia', custo: 500, imagem: 'avatar_tim9.png' },
  { id: 'avatar_tim10', nome: 'Tim Maia 10', descricao: 'Personagem completo estilo Tim Maia', custo: 500, imagem: 'avatar_tim10.png' },
  { id: 'avatar_tim11', nome: 'Tim Maia 11', descricao: 'Personagem completo estilo Tim Maia', custo: 500, imagem: 'avatar_tim11.png' },
];

export const ITEM_PADRAO = null;

export const obterItem = (itemId) => {
  if (!itemId) return null;
  return AVATAR_ITENS.find(i => i.id === itemId) || null;
};

export default AVATAR_ITENS;
