import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usuariosServico } from '../../services/usuariosServico';
import { RegistrarPartidaNovo } from '../partidas/RegistrarPartidaNovo';

export function Atleta({  })
{
  const [resumoLocal, setResumoLocal] = useState();
  const [erroLocal, setErroLocal] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarResumo() {      
      const dados = await usuariosServico.obterResumo();

      console.log('Resumo do usuário:', dados);

      if (!ativo) return;

      setResumoLocal({
        nome: dados?.nome,
        totalPartidas: dados?.totalPartidas,
        totalVitorias: dados?.totalVitorias,
        totalDerrotas: dados?.totalDerrotas,
        percentualAproveitamento: dados?.percentualAproveitamento,
        totalPartidasPendentes: dados?.totalPartidasPendentes,
        pontos: dados?.pontos,
        pontosPendentes: dados?.pontosPendentes
      });       
    }

    carregarResumo();

    return () => {
      ativo = false;
    };
  }, []);

  const textoAtletaResumo = 'Meu perfil';

  const tituloAtletaResumo = 'textoAtletaResumo';

  return (
    <section>
      <article className="cartao-lista">
        <div className="home-usuario-infos">
          <div className="home-usuario-info-item">
            <Link
              to="/app/perfil"
              className="home-usuario-info-link"
              aria-label="Abrir meu perfil"
            >
              <span>Atleta</span>
              <strong className="home-usuario-atleta-nome">
                {resumoLocal?.nome}
              </strong>
            </Link>
          </div>
        </div>        
        <Link
          to="/minhas-partidas?filtro=participei"
          className="home-resumo-usuario-metricas"
          aria-label="Abrir minhas partidas"
        >
          <div className="home-resumo-usuario-pontos">
            <span>Pontos</span>
            <strong>{resumoLocal?.pontos}</strong>
            <small>+{resumoLocal?.pontosPendentes} pend.</small>
          </div>

          <div>
            <span>Jogos</span>
            <strong>{resumoLocal?.totalPartidas}</strong>
          </div>

          <div>
            <span>Vitórias</span>
            <strong>{resumoLocal?.totalVitorias}</strong>
          </div>

          <div>
            <span>Derrotas</span>
            <strong>{resumoLocal?.totalDerrotas}</strong>
          </div>
        </Link>

        <RegistrarPartidaNovo />      
      </article>
    </section>
  );
}
