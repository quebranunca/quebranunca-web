import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacao } from './useAutenticacao';
import { montarRotaPerfilAtleta } from '../utils/perfilAtleta';

export function useNavegacaoPerfilAtleta() {
  const navegar = useNavigate();
  const { usuario } = useAutenticacao();

  const obterRotaPerfilAtleta = useCallback(
    (atletaOuId) => montarRotaPerfilAtleta(atletaOuId, usuario),
    [usuario]
  );

  const navegarParaPerfilAtleta = useCallback(
    (atletaOuId, opcoes = {}) => {
      const destino = montarRotaPerfilAtleta(atletaOuId, usuario);

      if (!destino) {
        return false;
      }

      navegar(destino, opcoes);
      return true;
    },
    [navegar, usuario]
  );

  return {
    obterRotaPerfilAtleta,
    navegarParaPerfilAtleta
  };
}
