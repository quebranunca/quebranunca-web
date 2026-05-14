import { useEffect, useState } from 'react';
import { gruposServico } from '../../services/gruposServico';
import { PartidaGeral } from '../../components/partidas/PartidaGeral';

export function PartidaGeralContainer({  }) {
  const [partida, setPartida] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarPartida() {
      setCarregando(true);
      setErro(false);

      try {
        const resumo = await gruposServico.obterResumoUsuario();
        
        if (ativo) {
          setPartida(resumo || null);
        }
      } catch (falha) {
        if (ativo) {
          console.error('Erro ao carregar resumo da partida.', falha);
          setPartida(null);
          setErro(true);
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarPartida();

    return () => {
      ativo = false;
    };
  }, []);

  if (carregando) {
    return <p>Carregando partida...</p>;
  }

  if (erro) {
    return <p>Não foi possível carregar a partida.</p>;
  }

  if (!partida) {
    return <p>Nenhuma partida encontrada.</p>;
  }

  return <PartidaGeral partida={partida} />;
}