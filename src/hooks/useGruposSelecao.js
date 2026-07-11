import { useEffect, useMemo, useState } from 'react';
import { gruposServico } from '../services/gruposServico';

function obterChaveGrupo(grupo) {
  return grupo?.id || grupo?.grupoId || grupo?.nome || grupo?.nomeGrupo || '';
}

function deduplicarGruposPorId(grupos) {
  const vistos = new Set();

  return (grupos || []).filter((grupo) => {
    const chave = obterChaveGrupo(grupo);
    if (!chave) {
      return true;
    }

    if (vistos.has(chave)) {
      return false;
    }

    vistos.add(chave);
    return true;
  });
}

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
    const gruposUnicos = deduplicarGruposPorId(grupos);
    const chaveGrupoAtual = obterChaveGrupo(grupoAtual);

    if (!chaveGrupoAtual || gruposUnicos.some((grupo) => obterChaveGrupo(grupo) === chaveGrupoAtual)) {
      return gruposUnicos;
    }

    return [grupoAtual, ...gruposUnicos];
  }, [grupoAtual, grupos]);

  return {
    grupos: gruposDisponiveis,
    carregando,
    erro
  };
}
