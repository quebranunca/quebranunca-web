import { useEffect, useMemo, useState } from 'react';
import { gruposServico } from '../services/gruposServico';

export function useGruposSelecao(grupoAtual, habilitado = true) {
  const [grupos, setGrupos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;

    async function carregarGrupos() {
      if (!habilitado) {
        setGrupos([]);
        setCarregando(false);
        setErro('');
        return;
      }

      setCarregando(true);
      setErro('');

      try {
        const lista = await gruposServico.listarParaSelecao();
        if (ativo) {
          setGrupos(Array.isArray(lista) ? lista : []);
        }
      } catch {
        if (ativo) {
          setErro('Não foi possível carregar os grupos.');
          setGrupos([]);
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarGrupos();

    return () => {
      ativo = false;
    };
  }, [habilitado]);

  const gruposDisponiveis = useMemo(() => {
    if (!grupoAtual?.id || grupos.some((grupo) => grupo.id === grupoAtual.id)) {
      return grupos;
    }

    return [grupoAtual, ...grupos];
  }, [grupoAtual, grupos]);

  return {
    grupos: gruposDisponiveis,
    carregando,
    erro
  };
}
