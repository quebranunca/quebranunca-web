import { AvatarGrupo } from '../grupos/AvatarGrupo';
import { obterNomeGrupoPartidaExibicao } from '../../utils/partidas';

function formatarQuantidadeAtletas(valor) {
  const quantidade = Number(valor);

  if (!Number.isFinite(quantidade)) {
    return 'Atletas';
  }

  return `${quantidade} ${quantidade === 1 ? 'atleta' : 'atletas'}`;
}

function GrupoAvatar({ grupo }) {
  return <AvatarGrupo grupo={grupo} tamanho="md" className="grupo-contexto-partida-avatar" alt="" />;
}

export function GrupoContextoPartida({
  grupo,
  onSelecionarGrupo,
  carregando
}) {
  const possuiGrupo = Boolean(grupo?.id);

  return (
    <section className="grupo-contexto-partida" aria-label="Contexto de grupo da partida">
      <div className="grupo-contexto-partida-principal">
        <GrupoAvatar grupo={grupo} />

        <div className="grupo-contexto-partida-info">
          {carregando ? (
            <>
              <strong>Carregando grupo...</strong>
              <span>Buscando contexto da partida.</span>
            </>
          ) : possuiGrupo ? (
            <>
              <strong>{obterNomeGrupoPartidaExibicao(grupo, 'Grupo selecionado')}</strong>
              <span>{formatarQuantidadeAtletas(grupo.quantidadeAtletas)} • {grupo.privacidade || 'Privado'}</span>
            </>
          ) : (
            <>
              <strong>Partidas avulsas</strong>
              <span>Registrar sem grupo</span>
              <small>Partida sem vínculo com grupo.</small>
            </>
          )}
        </div>

        <button
          type="button"
          className="grupo-contexto-partida-botao"
          onClick={onSelecionarGrupo}
          disabled={carregando}
        >
          {possuiGrupo ? 'Trocar' : 'Selecionar'}
        </button>
      </div>
    </section>
  );
}
