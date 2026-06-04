import { FaChevronRight, FaTimes } from 'react-icons/fa';
import { AvatarGrupo } from '../grupos/AvatarGrupo';

function formatarQuantidadeAtletas(valor) {
  const quantidade = Number(valor);

  if (!Number.isFinite(quantidade)) {
    return 'Atletas';
  }

  return `${quantidade} ${quantidade === 1 ? 'atleta' : 'atletas'}`;
}

function GrupoAvatar({ grupo }) {
  return <AvatarGrupo grupo={grupo} tamanho="md" className="seletor-grupo-partida-avatar" alt="" />;
}

export function SeletorGrupoPartida({
  aberto,
  grupos = [],
  grupoSelecionado,
  carregando,
  erro,
  onSelecionarGrupo,
  onRemoverGrupo,
  onFechar
}) {
  if (!aberto) {
    return null;
  }

  return (
    <div className="seletor-grupo-partida-sobreposicao" role="presentation" onClick={onFechar}>
      <section
        className="seletor-grupo-partida"
        role="dialog"
        aria-modal="true"
        aria-labelledby="seletor-grupo-partida-titulo"
        onClick={(evento) => evento.stopPropagation()}
      >
        <header className="seletor-grupo-partida-header">
          <div>
            <strong id="seletor-grupo-partida-titulo">Selecionar grupo</strong>
            <span>Mantenha a partida no fluxo atual.</span>
          </div>
          <button type="button" className="registrar-partida-novo-icone-botao" onClick={onFechar} aria-label="Fechar seletor de grupo">
            <FaTimes aria-hidden="true" />
          </button>
        </header>

        <div className="seletor-grupo-partida-lista">
          <button
            type="button"
            className={`seletor-grupo-partida-item ${!grupoSelecionado?.id ? 'ativo' : ''}`}
            onClick={onRemoverGrupo}
          >
            <span className="seletor-grupo-partida-avatar">
              <FaTimes aria-hidden="true" />
            </span>
            <span>
              <strong>Registrar sem grupo</strong>
              <small>A partida será registrada como avulsa.</small>
            </span>
            <FaChevronRight aria-hidden="true" />
          </button>

          {carregando && (
            <span className="seletor-grupo-partida-estado">Carregando grupos...</span>
          )}

          {!carregando && erro && (
            <span className="seletor-grupo-partida-estado">Não foi possível carregar os grupos agora.</span>
          )}

          {!carregando && !erro && grupos.length === 0 && (
            <span className="seletor-grupo-partida-estado">Nenhum grupo disponível.</span>
          )}

          {!carregando && !erro && grupos.map((grupo) => (
            <button
              type="button"
              key={grupo.id}
              className={`seletor-grupo-partida-item ${grupoSelecionado?.id === grupo.id ? 'ativo' : ''}`}
              onClick={() => onSelecionarGrupo?.(grupo)}
            >
              <GrupoAvatar grupo={grupo} />
              <span>
                <strong>{grupo.nome}</strong>
                <small>{formatarQuantidadeAtletas(grupo.quantidadeAtletas)} • {grupo.privacidade || 'Privado'}</small>
              </span>
              <FaChevronRight aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
