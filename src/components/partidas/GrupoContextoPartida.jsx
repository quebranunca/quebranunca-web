import { FaVolleyballBall } from 'react-icons/fa';

function formatarQuantidadeAtletas(valor) {
  const quantidade = Number(valor);

  if (!Number.isFinite(quantidade)) {
    return 'Atletas';
  }

  return `${quantidade} ${quantidade === 1 ? 'atleta' : 'atletas'}`;
}

function obterImagemGrupo(grupo) {
  return grupo?.imagemUrl || grupo?.fotoUrl || grupo?.avatarUrl || '';
}

function GrupoAvatar({ grupo }) {
  const imagem = obterImagemGrupo(grupo);

  return (
    <span className="grupo-contexto-partida-avatar" aria-hidden="true">
      {imagem ? <img src={imagem} alt="" /> : <FaVolleyballBall />}
    </span>
  );
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
              <strong>{grupo.nome}</strong>
              <span>{formatarQuantidadeAtletas(grupo.quantidadeAtletas)} • {grupo.privacidade || 'Privado'}</span>
            </>
          ) : (
            <>
              <strong>Grupo (Opcional)</strong>
              <span>Nenhum grupo selecionado</span>
              <small>A partida não será vinculada a um grupo.</small>
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
