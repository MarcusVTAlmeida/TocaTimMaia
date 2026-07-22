import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  increment,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { useAuth } from './AuthContext';
import { ITEM_PADRAO, obterItem } from '../dados/avatarItens';
import {
  getImagemUrl,
  precarregarImagens,
  carregarItemPrioritario,
  getUrlSincrona,
} from './avatarImagens';

const AvatarContext = createContext(null);
const db = getFirestore();
const COLECAO = 'users';

export function AvatarProvider({ children }) {
  const { usuario } = useAuth();
  const uid = usuario?.uid;

  const [avatarCoins, setAvatarCoins]       = useState(0);
  const [itensComprados, setItensComprados] = useState([]);
  const [equipado, setEquipado]             = useState(null);
  const [avatarFotoUrl, setAvatarFotoUrl]   = useState(null);
  const [carregandoAvatar, setCarregandoAvatar] = useState(true);

  const [urlsCatalogo, setUrlsCatalogo] = useState({});

  const registrarUrl = useCallback((itemId, url) => {
    if (!itemId || !url) return;
    setUrlsCatalogo(prev => {
      if (prev[itemId] === url) return prev;
      return { ...prev, [itemId]: url };
    });
  }, []);

  useEffect(() => {
    let ativo = true;
    setCarregandoAvatar(true);

    const carregarUsuario = uid
      ? getDoc(doc(collection(db, COLECAO), uid))
      : Promise.resolve(null);

    carregarUsuario
      .then(async (snap) => {
        if (!ativo) return;

        let itemEquipado = null;

        if (uid && snap && snap.exists()) {
          const dados = snap.data();
          setAvatarCoins(dados?.avatarCoins ?? 0);
          setItensComprados(dados?.itensComprados ?? []);
          const eq = dados?.avatarEquipado;
          itemEquipado = eq && obterItem(eq) ? eq : null;
          setEquipado(itemEquipado);
        } else {
          setAvatarCoins(0);
          setItensComprados([]);
          setEquipado(null);
        }

        if (itemEquipado) {
          const url = await carregarItemPrioritario(itemEquipado);
          if (ativo && url) {
            setAvatarFotoUrl(url);
            setUrlsCatalogo(prev => ({ ...prev, [itemEquipado]: url }));
          }
        }
      })
      .catch((e) => {
        console.warn('Erro ao carregar dados do usuário:', e);
      })
      .finally(() => {
        if (ativo) setCarregandoAvatar(false);
      });

    return () => { ativo = false; };
  }, [uid]);

  useEffect(() => {
    if (!equipado) {
      setAvatarFotoUrl(null);
      return;
    }
    const urlCache = getUrlSincrona(equipado);
    if (urlCache) {
      setAvatarFotoUrl(urlCache);
      return;
    }
    let ativo = true;
    getImagemUrl(equipado).then((url) => {
      if (ativo && url) setAvatarFotoUrl(url);
    });
    return () => { ativo = false; };
  }, [equipado]);

  useEffect(() => {
    if (itensComprados.length === 0) return;
    const ids = equipado
      ? itensComprados.filter(id => id !== equipado).slice(0, 5)
      : itensComprados.slice(0, 5);
    if (ids.length > 0) {
      precarregarImagens(ids).catch(() => {});
    }
  }, [equipado, itensComprados]);

  const adicionarMoedas = useCallback(async (quantia) => {
    if (!uid || quantia <= 0) return;
    await setDoc(
      doc(collection(db, COLECAO), uid),
      { avatarCoins: increment(quantia), atualizadoEm: serverTimestamp() },
      { merge: true },
    );
    setAvatarCoins(prev => prev + quantia);
  }, [uid]);

  const comprarItem = useCallback(async (itemId) => {
    if (!uid) throw new Error('Faça login para comprar itens.');
    const item = obterItem(itemId);
    if (!item) throw new Error('Item não encontrado.');
    if (itensComprados.includes(itemId)) throw new Error('Você já possui este item.');
    if (avatarCoins < item.custo) throw new Error('Moedas insuficientes.');

    const novosItens = [...itensComprados, itemId];
    await setDoc(
      doc(collection(db, COLECAO), uid),
      {
        avatarCoins: increment(-item.custo),
        itensComprados: novosItens,
        atualizadoEm: serverTimestamp(),
      },
      { merge: true },
    );
    setAvatarCoins(prev => prev - item.custo);
    setItensComprados(novosItens);
    return item;
  }, [uid, avatarCoins, itensComprados]);

  const equiparItem = useCallback(async (itemId) => {
    if (!uid) throw new Error('Faça login para equipar itens.');
    const item = obterItem(itemId);
    if (!item) throw new Error('Item não encontrado.');
    if (item.custo > 0 && !itensComprados.includes(itemId)) {
      throw new Error('Você não possui este item.');
    }
    await setDoc(
      doc(collection(db, COLECAO), uid),
      { avatarEquipado: itemId, atualizadoEm: serverTimestamp() },
      { merge: true },
    );
    setEquipado(itemId);
  }, [uid, itensComprados]);

  const resetarEquipamento = useCallback(async () => {
    if (!uid) return;
    await setDoc(
      doc(collection(db, COLECAO), uid),
      { avatarEquipado: ITEM_PADRAO, atualizadoEm: serverTimestamp() },
      { merge: true },
    );
    setEquipado(ITEM_PADRAO);
  }, [uid]);

  const getUrlItem = useCallback(
    (itemId) => urlsCatalogo[itemId] || getUrlSincrona(itemId),
    [urlsCatalogo],
  );

  const value = useMemo(() => ({
    avatarCoins,
    itensComprados,
    equipado,
    avatarFotoUrl,
    carregandoAvatar,
    getUrlItem,
    registrarUrl,
    adicionarMoedas,
    comprarItem,
    equiparItem,
    resetarEquipamento,
    itemComprado: (itemId) => itensComprados.includes(itemId),
    itemEquipado: (itemId) => equipado === itemId,
  }), [
    avatarCoins, itensComprados, equipado, avatarFotoUrl,
    carregandoAvatar, getUrlItem, registrarUrl,
    adicionarMoedas, comprarItem, equiparItem, resetarEquipamento,
  ]);

  return (
    <AvatarContext.Provider value={value}>
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatar() {
  const context = useContext(AvatarContext);
  if (!context) {
    throw new Error('useAvatar precisa estar dentro de AvatarProvider.');
  }
  return context;
}