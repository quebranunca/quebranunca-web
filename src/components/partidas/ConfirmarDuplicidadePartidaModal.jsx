export function ConfirmarDuplicidadePartidaModal({
  mensagem,
  duplicidade,
  salvando,
  onCancelar,
  onConfirmar,
  onVerPartida
}) {
  const partida = duplicidade?.partida || null;
  const podeVerPartida = Boolean(onVerPartida && (duplicidade?.partidaId || partida?.id));

  return (
    <div className="modal-sobreposicao" role="presentation">
      <section
        className="modal-conteudo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmar-duplicidade-partida-titulo"
      >
        <div className="modal-cabecalho">
          <div>
            <h3 id="confirmar-duplicidade-partida-titulo">Possível partida duplicada</h3>
            <p>{mensagem || 'Encontramos uma partida muito parecida registrada recentemente. Ela pode ser exatamente esta partida.'}</p>
          </div>
        </div>

        {partida && <DuplicidadePartidaResumo partida={partida} />}

        <div className="acoes-formulario">
          {podeVerPartida && (
            <button type="button" className="botao-secundario" onClick={onVerPartida} disabled={salvando}>
              Ver partida
            </button>
          )}
          <button type="button" className="botao-secundario" onClick={onConfirmar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Registrar mesmo assim'}
          </button>
          <button type="button" className="botao-terciario" onClick={onCancelar} disabled={salvando}>
            Cancelar
          </button>
        </div>
      </section>
    </div>
  );
}

function DuplicidadePartidaResumo({ partida }) {
  const contexto = formatarContexto(partida.nomeGrupo || partida.grupo || partida.grupoNome);
  const data = formatarDataHora(partida.dataPartida || partida.dataCriacao);
  const registrador = partida.nomeCriadoPorUsuario || partida.criadoPorUsuarioNome || 'Usuário QNF';
  const duplaA = formatarDupla(partida.nomeDuplaA, partida.nomeDuplaAAtleta1, partida.nomeDuplaAAtleta2);
  const duplaB = formatarDupla(partida.nomeDuplaB, partida.nomeDuplaBAtleta1, partida.nomeDuplaBAtleta2);
  const resultado = formatarResultado(partida);

  return (
    <article className="confirmar-duplicidade-resumo">
      <dl>
        <div>
          <dt>Grupo</dt>
          <dd>{contexto}</dd>
        </div>
        <div>
          <dt>Data</dt>
          <dd>{data}</dd>
        </div>
        <div>
          <dt>Quem registrou</dt>
          <dd>{registrador}</dd>
        </div>
      </dl>
      <div className="confirmar-duplicidade-duplas">
        <span>{duplaA}</span>
        <strong>VS</strong>
        <span>{duplaB}</span>
      </div>
      <strong className="confirmar-duplicidade-resultado">{resultado}</strong>
    </article>
  );
}

function formatarDupla(nome, atleta1, atleta2) {
  if (nome) {
    return nome;
  }

  return [atleta1, atleta2].filter(Boolean).join(' / ') || 'Dupla a definir';
}

function formatarContexto(valor) {
  const contexto = String(valor || '').trim();
  if (!contexto || contexto.toLowerCase() === 'geral') {
    return 'Partidas avulsas';
  }

  return contexto;
}

function formatarResultado(partida) {
  if (partida.placarDuplaA !== null && partida.placarDuplaA !== undefined &&
    partida.placarDuplaB !== null && partida.placarDuplaB !== undefined) {
    return `${partida.placarDuplaA} x ${partida.placarDuplaB}`;
  }

  if (partida.duplaVencedora === 1) {
    return 'Vencedores: Dupla 1';
  }

  if (partida.duplaVencedora === 2) {
    return 'Vencedores: Dupla 2';
  }

  return 'Resultado informado';
}

function formatarDataHora(valor) {
  if (!valor) {
    return 'Data a confirmar';
  }

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) {
    return 'Data a confirmar';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(data);
}
