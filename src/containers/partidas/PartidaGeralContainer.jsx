import { useEffect, useState } from 'react';
import { gruposServico } from '../../services/gruposServico';
import { PartidaGeral } from '../../components/partidas/PartidaGeral';

export function PartidaGeralContainer() {
  const [partida, setPartida] = useState(null);

  useEffect(() => {
    async function carregarPartida() {
      try {
        const resumo = await gruposServico.obterResumoUsuario();
        setPartida(resumo);
      } catch (erro) {
        console.error('Erro ao carregar partida.', erro);
        setPartida(null);
      }
    }

    carregarPartida();
  }, []);

  return <PartidaGeral partida={partida} />;
}