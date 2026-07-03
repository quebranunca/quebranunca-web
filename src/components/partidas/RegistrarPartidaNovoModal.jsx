import { Fragment, useEffect, useRef, useState } from 'react';
import {
  FaArrowRight,
  FaChartBar,
  FaCheck,
  FaChevronLeft,
  FaClipboardCheck,
  FaEllipsisH,
  FaLayerGroup,
  FaTimes,
  FaTrophy,
  FaUserFriends
} from 'react-icons/fa';
import { AvatarUsuario, obterFotoPerfilAvatar } from '../AvatarUsuario';
import { AvatarGrupo } from '../grupos/AvatarGrupo';
import { CompartilharPartidaBotao } from './CompartilharPartidaBotao';
import { SeletorGrupoPartida } from './SeletorGrupoPartida';
import {
  aoPressionarEnterParaProximo,
  focusCampoSemPular,
  focusNextField,
  scrollFocusedInputIntoView
} from '../../utils/tecladoMobile';

function obterValorCampo(dados, campo) {
  return campo.split('.').reduce((valor, parte) => valor?.[parte], dados) ?? '';
}

function limparTermoBuscaAtleta(valor) {
  return String(valor || '').trim();
}

function obterChaveAtletaSugestao(atleta) {
  return atleta?.id || limparTermoBuscaAtleta(atleta?.nome).toLowerCase();
}

function obterNomeExibicaoAtleta(atleta) {
  return limparTermoBuscaAtleta(atleta?.apelido || atleta?.apelidoAtleta || atleta?.nome || atleta?.nomeAtleta);
}

function campoInterativoEstaFocado() {
  const ativo = document.activeElement;

  if (!(ativo instanceof HTMLElement)) {
    return false;
  }

  const tag = ativo.tagName?.toLowerCase();

  return (
    ativo.isContentEditable ||
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select'
  );
}

function formatarData(data) {
  if (!data) {
    return '';
  }

  const dataFormatada = data instanceof Date ? data : new Date(data);

  if (Number.isNaN(dataFormatada.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dataFormatada);
}

function formatarIdPartida(partida) {
  const id = partida?.id || partida?.partidaId;
  return id ? `#QNB-${String(id).slice(0, 8).toUpperCase()}` : '#QNB';
}

function obterVencedora(dados) {
  if (dados.resultado?.modo === 'ApenasResultado') {
    return dados.resultado.duplaVencedora === '1' || dados.resultado.duplaVencedora === 1 ? 'dupla1' :
      dados.resultado.duplaVencedora === '2' || dados.resultado.duplaVencedora === 2 ? 'dupla2' : '';
  }

  const pontos1 = Number(dados.dupla1.pontos);
  const pontos2 = Number(dados.dupla2.pontos);

  if (dados.dupla1.pontos === '' || dados.dupla2.pontos === '' || pontos1 === pontos2) {
    return '';
  }

  return pontos1 > pontos2 ? 'dupla1' : 'dupla2';
}

function obterNumeroRegra(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function montarValidacoesPlacar(dados, regraPartida) {
  if (dados.resultado?.modo === 'ApenasResultado') {
    return [
      {
        id: 'vencedora',
        texto: 'Dupla vencedora informada',
        ok: Boolean(dados.resultado.duplaVencedora)
      },
      {
        id: 'sem-placar',
        texto: 'Resultado sem placar detalhado',
        ok: true
      }
    ];
  }

  const placarA = Number(dados.dupla1.pontos);
  const placarB = Number(dados.dupla2.pontos);
  const temPlacar = dados.dupla1.pontos !== '' && dados.dupla2.pontos !== '';
  const pontosMinimos = obterNumeroRegra(regraPartida?.pontosMinimosPartida);
  const diferencaMinima = obterNumeroRegra(regraPartida?.diferencaMinimaPartida);
  return [
    pontosMinimos !== null && {
      id: 'minimo',
      texto: `Mínimo ${pontosMinimos} pontos`,
      ok: temPlacar && Math.max(placarA, placarB) >= pontosMinimos
    },
    diferencaMinima !== null && {
      id: 'diferenca',
      texto: `Diferença mínima ${diferencaMinima}`,
      ok: temPlacar && Math.abs(placarA - placarB) >= diferencaMinima
    }
  ].filter(Boolean);
}

function placarDetalhadoEstaValido(dados, regraPartida) {
  const placarA = Number(dados.dupla1.pontos);
  const placarB = Number(dados.dupla2.pontos);
  const pontosMinimos = obterNumeroRegra(regraPartida?.pontosMinimosPartida);
  const diferencaMinima = obterNumeroRegra(regraPartida?.diferencaMinimaPartida);
  const permiteEmpate = regraPartida?.permiteEmpate === true;

  if (dados.dupla1.pontos === '' || dados.dupla2.pontos === '') {
    return false;
  }

  if (!Number.isFinite(placarA) || !Number.isFinite(placarB) || placarA < 0 || placarB < 0) {
    return false;
  }

  if (!permiteEmpate && placarA === placarB) {
    return false;
  }

  if (pontosMinimos !== null && Math.max(placarA, placarB) < pontosMinimos) {
    return false;
  }

  if (diferencaMinima !== null && Math.abs(placarA - placarB) < diferencaMinima) {
    return false;
  }

  return true;
}

function limparTexto(valor) {
  return String(valor || '').trim().replace(/\s+/g, ' ');
}

function montarValidacoesRevisao(dados, regraPartida) {
  const nomes = [
    limparTexto(dados.dupla1.atletaDireita),
    limparTexto(dados.dupla1.atletaEsquerda),
    limparTexto(dados.dupla2.atletaDireita),
    limparTexto(dados.dupla2.atletaEsquerda)
  ];
  const nomesNormalizados = nomes.map((nome) => nome.toLowerCase()).filter(Boolean);
  const placarA = Number(dados.dupla1.pontos);
  const placarB = Number(dados.dupla2.pontos);
  const temPlacar = dados.dupla1.pontos !== '' && dados.dupla2.pontos !== '';
  const placarNumerico = temPlacar && Number.isFinite(placarA) && Number.isFinite(placarB) && placarA >= 0 && placarB >= 0;
  const apenasResultado = dados.resultado?.modo === 'ApenasResultado';

  return [
    {
      id: 'atletas',
      ok: nomes.every(Boolean)
    },
    {
      id: 'sem-repeticao',
      ok: nomesNormalizados.length === 4 && new Set(nomesNormalizados).size === nomesNormalizados.length
    },
    {
      id: 'placar',
      ok: apenasResultado ? Boolean(dados.resultado.duplaVencedora) : placarNumerico
    },
    ...montarValidacoesPlacar(dados, regraPartida).map((validacao) => ({
      id: validacao.id,
      ok: validacao.ok
    }))
  ];
}

function revisaoPossuiInconsistencia(dados, regraPartida) {
  return montarValidacoesRevisao(dados, regraPartida).some((validacao) => !validacao.ok) ||
    (dados.resultado?.modo === 'PlacarDetalhado' && !placarDetalhadoEstaValido(dados, regraPartida));
}

function IconeEtapa({ tipo }) {
  if (tipo === 'group') {
    return <FaLayerGroup aria-hidden="true" />;
  }

  if (tipo === 'score') {
    return <FaChartBar aria-hidden="true" />;
  }

  if (tipo === 'summary') {
    return <FaClipboardCheck aria-hidden="true" />;
  }

  return <FaUserFriends aria-hidden="true" />;
}

function Progresso({ etapas, indiceEtapa }) {
  return (
    <div className="registrar-partida-novo-progresso" aria-label={`Momento ${indiceEtapa + 1} de ${etapas.length}`}>
      <div className="registrar-partida-novo-pontos" aria-hidden="true">
        {etapas.map((etapa, indice) => (
          <span key={etapa.id} className={indice <= indiceEtapa ? 'ativo' : ''} />
        ))}
      </div>
      <small>{indiceEtapa + 1} de {etapas.length}</small>
    </div>
  );
}

function HeaderModal({
  etapas,
  indiceEtapa,
  etapaAtual,
  salvando,
  onVoltar,
  onFechar,
  sucesso,
  fluxoSimplificado = false,
  titulo = 'Registrar partida',
  ariaFechar = 'Fechar registro de partida'
}) {
  const primeiraEtapa = indiceEtapa <= 0;
  const podeVoltar = fluxoSimplificado ? !salvando : !salvando && !sucesso;
  const acaoVoltar = fluxoSimplificado || primeiraEtapa ? onFechar : onVoltar;

  return (
    <header className="registrar-partida-novo-header">
      <button
        type="button"
        className="registrar-partida-novo-icone-botao"
        onClick={acaoVoltar}
        disabled={!podeVoltar}
        aria-label={fluxoSimplificado ? ariaFechar : 'Voltar'}
      >
        <FaChevronLeft aria-hidden="true" />
      </button>

      <div className="registrar-partida-novo-header-centro">
        <strong id="registrar-partida-novo-titulo">{titulo}</strong>
        {!sucesso && !fluxoSimplificado && (
          <>
            <span>{etapaAtual.titulo}</span>
            <Progresso etapas={etapas} indiceEtapa={indiceEtapa} />
          </>
        )}
      </div>

      <button
        type="button"
        className="registrar-partida-novo-icone-botao"
        onClick={onFechar}
        disabled={salvando}
        aria-label={ariaFechar}
      >
        <FaTimes aria-hidden="true" />
      </button>
    </header>
  );
}

function montarDetalhesAtleta(atleta) {
  const detalhes = [];

  if (atleta?.apelido) {
    detalhes.push(`@${atleta.apelido}`);
  }

  if (atleta?.categoria) {
    detalhes.push(atleta.categoria);
  }

  if (atleta?.nomeCategoria) {
    detalhes.push(atleta.nomeCategoria);
  }

  if (atleta?.grupo) {
    detalhes.push(atleta.grupo);
  }

  if (atleta?.nomeGrupo) {
    detalhes.push(atleta.nomeGrupo);
  }

  if (atleta?.cidade || atleta?.estado) {
    detalhes.push([atleta.cidade, atleta.estado].filter(Boolean).join('/'));
  }

  if (Number.isFinite(atleta?.posicaoRanking)) {
    detalhes.push(`${atleta.posicaoRanking}º ranking`);
  }

  if (Number.isFinite(atleta?.quantidadeJogos)) {
    detalhes.push(`${atleta.quantidadeJogos} jogos`);
  }

  return detalhes.length > 0 ? detalhes.join(' • ') : 'Atleta QuebraNunca';
}

function obterSecaoSugestaoAtleta(atleta) {
  if (atleta?.origemSugestao === 'grupo') {
    return 'Membros do grupo';
  }

  if (atleta?.origemSugestao === 'externo') {
    return 'Outros atletas';
  }

  return '';
}

function formatarQuantidadeAtletasGrupo(valor) {
  const quantidade = Number(valor);

  if (!Number.isFinite(quantidade)) {
    return 'Atletas';
  }

  return `${quantidade} ${quantidade === 1 ? 'atleta' : 'atletas'}`;
}

function GrupoOpcaoAvatar({ grupo, semGrupo = false }) {
  if (semGrupo) {
    return (
      <span className="registrar-partida-novo-grupo-opcao-avatar" aria-hidden="true">
        <FaTimes />
      </span>
    );
  }

  return <AvatarGrupo grupo={grupo} tamanho="md" className="registrar-partida-novo-grupo-opcao-avatar" alt="" />;
}

function obterNomeInputAtleta(campo) {
  const nomes = {
    'dupla1.atletaDireita': 'atleta1Dupla1',
    'dupla1.atletaEsquerda': 'atleta2Dupla1',
    'dupla2.atletaDireita': 'atleta1Dupla2',
    'dupla2.atletaEsquerda': 'atleta2Dupla2'
  };

  return nomes[campo] || 'atletaPartida';
}

const LIMITE_SUGESTOES_ATLETA_VISIVEIS = 3;

function AutocompleteAtleta({
  campo,
  rotulo,
  placeholder,
  dados,
  selecao,
  sugestoes,
  sugestoesRapidas,
  buscando,
  inputRef,
  campoAtivo,
  onAlterarCampo,
  onSelecionarAtleta,
  onLimparSelecao
}) {
  const valor = obterValorCampo(dados, campo);
  const sugestoesCampoTodas = sugestoes[campo] || [];
  const sugestoesCampo = sugestoesCampoTodas.slice(0, LIMITE_SUGESTOES_ATLETA_VISIVEIS);
  const buscaAtiva = limparTermoBuscaAtleta(valor).length >= 2;
  const idsResultados = new Set(sugestoesCampoTodas.map(obterChaveAtletaSugestao).filter(Boolean));
  const sugestoesRapidasCampo = (sugestoesRapidas?.atletas || [])
    .filter((atleta) => !idsResultados.has(obterChaveAtletaSugestao(atleta)))
    .slice(0, LIMITE_SUGESTOES_ATLETA_VISIVEIS);
  const temSelecao = Boolean(selecao?.id);
  const nomeSelecao = obterNomeExibicaoAtleta(selecao);
  const campoEstaAtivo = campoAtivo === campo;
  const exibirSugestoesRapidas = campoEstaAtivo && !temSelecao && !buscaAtiva && sugestoesRapidasCampo.length > 0;
  const exibirListaResultados = campoEstaAtivo && !temSelecao && (buscaAtiva || sugestoesCampoTodas.length > 0 || buscando);

  function selecionarComPonteiro(evento, atleta) {
    evento.preventDefault();
    onSelecionarAtleta(campo, atleta);
  }

  return (
    <label
      className={`registrar-partida-novo-campo ${campoAtivo === campo ? 'ativo' : ''}`}
      data-testid={`campo-${obterNomeInputAtleta(campo)}`}
    >
      <span>{rotulo}</span>

      {!temSelecao && (
        <input
          ref={inputRef}
          data-campo-registro-partida={campo}
          type="text"
          inputMode="text"
          name={obterNomeInputAtleta(campo)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="done"
          value={valor}
          onChange={(evento) => onAlterarCampo(campo, evento.target.value)}
          onFocus={scrollFocusedInputIntoView}
          onKeyDown={(evento) => {
            if (evento.key === 'Enter') {
              evento.preventDefault();
            }
          }}
          placeholder={placeholder}
        />
      )}

      {temSelecao && (
        <div className="registrar-partida-novo-chip-selecao">
          <AvatarUsuario
            nome={nomeSelecao}
            fotoPerfilUrl={obterFotoPerfilAvatar(selecao)}
            tamanho="sm"
            className="registrar-partida-novo-avatar"
          />
          <span>
            <strong>{nomeSelecao}</strong>
            <small>{montarDetalhesAtleta(selecao)}</small>
          </span>
          <button
            type="button"
            className="registrar-partida-novo-chip-remover"
            onPointerDown={(evento) => evento.preventDefault()}
            onMouseDown={(evento) => evento.preventDefault()}
            onClick={() => {
              onLimparSelecao?.(campo);
              window.setTimeout(() => inputRef?.current?.focus(), 0);
            }}
            aria-label={`Remover ${nomeSelecao}`}
            title="Remover atleta"
          >
            <FaTimes aria-hidden="true" />
          </button>
        </div>
      )}

      {exibirListaResultados && (
        <div className="registrar-partida-novo-sugestoes" role="listbox">
          {buscaAtiva && (
            <span className="registrar-partida-novo-sugestao-secao">
              Resultados encontrados
            </span>
          )}
          {buscando && <span className="registrar-partida-novo-sugestao-status carregando">Buscando atletas...</span>}
          {buscaAtiva && !buscando && sugestoesCampoTodas.length === 0 && (
            <span className="registrar-partida-novo-sugestao-status vazio">Nenhum atleta encontrado</span>
          )}
          {sugestoesCampo.map((atleta, indice) => {
            const secaoAtual = obterSecaoSugestaoAtleta(atleta);
            const secaoAnterior = obterSecaoSugestaoAtleta(sugestoesCampo[indice - 1]);
            const exibirSecao = !buscaAtiva && secaoAtual && secaoAtual !== secaoAnterior;

            return (
              <Fragment key={`${campo}-${atleta.id}`}>
                {exibirSecao && (
                  <span className="registrar-partida-novo-sugestao-secao">
                    {secaoAtual}
                  </span>
                )}
                <button
                  type="button"
                  className="registrar-partida-novo-sugestao"
                  onPointerDown={(evento) => selecionarComPonteiro(evento, atleta)}
                  onClick={() => onSelecionarAtleta(campo, atleta)}
                >
                  <AvatarUsuario
                    nome={obterNomeExibicaoAtleta(atleta)}
                    fotoPerfilUrl={obterFotoPerfilAvatar(atleta)}
                    tamanho="sm"
                    className="registrar-partida-novo-avatar"
                  />
                  <span>
                    <strong>{obterNomeExibicaoAtleta(atleta)}</strong>
                    <small>{montarDetalhesAtleta(atleta)}</small>
                  </span>
                </button>
              </Fragment>
            );
          })}
        </div>
      )}

      {exibirSugestoesRapidas && (
        <div className="registrar-partida-novo-sugestoes-rapidas">
          <span>{sugestoesRapidas.titulo}</span>
          <div>
            {sugestoesRapidasCampo.map((atleta) => (
              <button
                type="button"
                key={`${campo}-rapida-${atleta.id}`}
                className="registrar-partida-novo-sugestao-rapida"
                onPointerDown={(evento) => selecionarComPonteiro(evento, atleta)}
                onClick={() => onSelecionarAtleta(campo, atleta)}
              >
                <AvatarUsuario
                  nome={obterNomeExibicaoAtleta(atleta)}
                  fotoPerfilUrl={obterFotoPerfilAvatar(atleta)}
                  tamanho="sm"
                  className="registrar-partida-novo-sugestao-rapida-avatar"
                />
                <span>{obterNomeExibicaoAtleta(atleta)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </label>
  );
}

function DuplaRegistro({
  numero,
  dados,
  selecoes,
  sugestoes,
  sugestoesRapidas,
  campoBuscando,
  inputRef,
  inputRef2,
  vencedora,
  campoAtivo,
  onAlterarCampo,
  onSelecionarAtleta,
  onLimparSelecao
}) {
  const prefixo = numero === 1 ? 'dupla1' : 'dupla2';
  const ganhou = vencedora === prefixo;

  return (
    <section
      className={`registrar-partida-novo-dupla-card ${ganhou ? 'vencedora' : ''}`}
      aria-label={`Dupla ${numero}`}
    >
      <div className="registrar-partida-novo-dupla-topo">
        <span>Dupla {numero}</span>
        {ganhou && <strong><FaTrophy aria-hidden="true" /> Vencendo</strong>}
      </div>
      <div className="registrar-partida-novo-campos">
        <AutocompleteAtleta
          campo={`${prefixo}.atletaDireita`}
          rotulo="Atleta 1"
          placeholder="Nome ou apelido"
          dados={dados}
          selecao={selecoes[`${prefixo}.atletaDireita`]}
          sugestoes={sugestoes}
          sugestoesRapidas={sugestoesRapidas?.[`${prefixo}.atletaDireita`]}
          buscando={campoBuscando === `${prefixo}.atletaDireita`}
          inputRef={inputRef}
          campoAtivo={campoAtivo}
          onAlterarCampo={onAlterarCampo}
          onSelecionarAtleta={onSelecionarAtleta}
          onLimparSelecao={onLimparSelecao}
        />
        <AutocompleteAtleta
          campo={`${prefixo}.atletaEsquerda`}
          rotulo="Atleta 2"
          placeholder="Nome ou apelido"
          dados={dados}
          selecao={selecoes[`${prefixo}.atletaEsquerda`]}
          sugestoes={sugestoes}
          sugestoesRapidas={sugestoesRapidas?.[`${prefixo}.atletaEsquerda`]}
          buscando={campoBuscando === `${prefixo}.atletaEsquerda`}
          inputRef={inputRef2}
          campoAtivo={campoAtivo}
          onAlterarCampo={onAlterarCampo}
          onSelecionarAtleta={onSelecionarAtleta}
          onLimparSelecao={onLimparSelecao}
        />
      </div>
    </section>
  );
}

function PlacarCentral({
  dados,
  placar1Ref,
  placar2Ref,
  regraPartida,
  carregandoRegraPartida,
  erroRegraPartida,
  onAlterarCampo,
  onRevisar
}) {
  const validacoes = montarValidacoesPlacar(dados, regraPartida);
  const possuiRegraCompeticao = Boolean(regraPartida);

  function alterarPlacar(campo, valor) {
    onAlterarCampo(campo, valor);

    const valorLimpo = String(valor || '').replace(/\D/g, '').slice(0, 2);
    if (valorLimpo.length === 2) {
      const campoAtualRef = campo === 'dupla1.pontos' ? placar1Ref : placar2Ref;
      window.setTimeout(() => campoAtualRef.current?.blur(), 0);
    }
  }

  return (
    <section className="registrar-partida-novo-placar-central" aria-label="Placar da partida">      
      <div className="registrar-partida-novo-placar">
        <label>
          <small>Dupla 1</small>
          <input
            ref={placar1Ref}
            data-campo-registro-partida="dupla1.pontos"
            type="text"
            name="placarDupla1"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={2}
            enterKeyHint="next"
            value={dados.dupla1.pontos}
            onChange={(evento) => alterarPlacar('dupla1.pontos', evento.target.value)}
            onFocus={scrollFocusedInputIntoView}
            onKeyDown={(evento) => aoPressionarEnterParaProximo(evento, () => focusNextField(placar2Ref))}
            placeholder="0"
            aria-label="Pontos da Dupla 1"
          />
        </label>
        <strong aria-hidden="true">x</strong>
        <label>
          <small>Dupla 2</small>
          <input
            ref={placar2Ref}
            data-campo-registro-partida="dupla2.pontos"
            type="text"
            name="placarDupla2"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={2}
            enterKeyHint="done"
            value={dados.dupla2.pontos}
            onChange={(evento) => alterarPlacar('dupla2.pontos', evento.target.value)}
            onFocus={scrollFocusedInputIntoView}
            onKeyDown={(evento) => aoPressionarEnterParaProximo(evento, onRevisar)}
            placeholder="0"
            aria-label="Pontos da Dupla 2"
          />
        </label>
      </div>

      <div className="registrar-partida-novo-validacoes-placar" aria-live="polite">
        {validacoes.map((validacao) => (
          <span
            key={validacao.id}
            className={validacao.ok ? 'ok' : ''}
          >
            <FaCheck aria-hidden="true" />
            {validacao.texto}
          </span>
        ))}
      </div>
    </section>
  );
}

function montarAtletasDuplaVencedora(dados, selecoes, prefixo) {
  const campos = [`${prefixo}.atletaDireita`, `${prefixo}.atletaEsquerda`];

  return campos.map((campo) => {
    const selecao = selecoes?.[campo];
    const nomeDigitado = limparTexto(obterValorCampo(dados, campo));
    const nome = selecao?.apelido || selecao?.nome || nomeDigitado || 'Atleta pendente';

    return {
      nome,
      fotoPerfilUrl: obterFotoPerfilAvatar(selecao)
    };
  });
}

function DuplaVencedoraCard({ numero, atletas, selecionada, onSelecionar }) {
  return (
    <button
      type="button"
      className={`registrar-partida-novo-vencedora-card ${selecionada ? 'selecionada' : ''}`}
      onClick={onSelecionar}
      aria-pressed={selecionada}
    >
      <span className="registrar-partida-novo-vencedora-topo">
        <strong>Dupla {numero}</strong>
        {selecionada ? (
          <span className="registrar-partida-novo-vencedora-badge">
            <FaTrophy aria-hidden="true" />
            Vencedora
          </span>
        ) : (
          <small>Toque para selecionar</small>
        )}
      </span>

      <span className="registrar-partida-novo-vencedora-atletas">
        {atletas.map((atleta, indice) => (
          <span key={`dupla-${numero}-vencedora-atleta-${indice}`} className="registrar-partida-novo-vencedora-atleta">
            <AvatarUsuario
              nome={atleta.nome}
              fotoPerfilUrl={atleta.fotoPerfilUrl}
              tamanho="sm"
              className="registrar-partida-novo-vencedora-avatar"
            />
            <strong>{atleta.nome}</strong>
          </span>
        ))}
      </span>

      {selecionada && <FaCheck className="registrar-partida-novo-vencedora-check" aria-hidden="true" />}
    </button>
  );
}

function EtapaGrupo({
  grupo,
  carregandoGrupo,
  gruposDisponiveis,
  carregandoGruposDisponiveis,
  erroGruposDisponiveis,
  permitirRemoverGrupo = true,
  onCarregarGrupos,
  onSelecionarGrupo,
  onEscolherGrupo,
  onRemoverGrupo
}) {
  const gruposVisiveis = (gruposDisponiveis || []).slice(0, 3);
  const grupoSelecionadoId = grupo?.id || null;
  const solicitouGruposRef = useRef(false);

  useEffect(() => {
    if (solicitouGruposRef.current) {
      return;
    }

    solicitouGruposRef.current = true;
    onCarregarGrupos?.();
  }, [onCarregarGrupos]);

  return (
    <section className="registrar-partida-novo-etapa registrar-partida-novo-etapa-grupo">
      <div className="registrar-partida-novo-intro">
        <h3>Em qual grupo foi a partida?</h3>
        <p>Escolha onde a partida será registrada.</p>
      </div>

      <div className="registrar-partida-novo-grupo-escolha">
        {!grupoSelecionadoId && (
          <button
            type="button"
            className="registrar-partida-novo-grupo-opcao"
            onClick={onSelecionarGrupo}
            aria-pressed="false"
          >
            <GrupoOpcaoAvatar semGrupo />
            <span>
              <strong>Escolha um grupo</strong>
              <small>Toque para selecionar onde a partida será registrada</small>
            </span>
            <FaEllipsisH aria-hidden="true" />
          </button>
        )}

        {grupoSelecionadoId && (
          <div className="registrar-partida-novo-grupo-selecionado">
            <button
              type="button"
              className="registrar-partida-novo-grupo-opcao selecionada"
              onClick={onSelecionarGrupo}
              aria-pressed="true"
            >
              <GrupoOpcaoAvatar grupo={grupo} />
              <span>
                <strong>{carregandoGrupo ? 'Carregando grupo...' : grupo?.nome || 'Grupo selecionado'}</strong>
              </span>
              <FaEllipsisH aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="registrar-partida-novo-grupo-lista">
          <div className="registrar-partida-novo-grupo-lista-topo">
            <strong>Meus grupos</strong>
            <button type="button" onClick={onSelecionarGrupo}>
              <FaEllipsisH aria-hidden="true" />
              Ver todos
            </button>
          </div>

          {carregandoGruposDisponiveis && (
            <span className="registrar-partida-novo-grupo-estado carregando">Carregando grupos...</span>
          )}

          {!carregandoGruposDisponiveis && erroGruposDisponiveis && (
            <span className="registrar-partida-novo-grupo-estado erro">Não foi possível carregar seus grupos.</span>
          )}

          {!carregandoGruposDisponiveis && !erroGruposDisponiveis && gruposVisiveis.length === 0 && (
            <span className="registrar-partida-novo-grupo-estado vazio">Nenhum grupo disponível.</span>
          )}

          {!carregandoGruposDisponiveis && !erroGruposDisponiveis && gruposVisiveis.map((grupoOpcao) => {
            const selecionada = grupoSelecionadoId === grupoOpcao.id;

            return (
              <button
                type="button"
                key={grupoOpcao.id}
                className={`registrar-partida-novo-grupo-opcao ${selecionada ? 'selecionada' : ''}`}
                onClick={() => (selecionada ? onSelecionarGrupo?.() : onEscolherGrupo?.(grupoOpcao))}
                aria-pressed={selecionada}
              >
                <GrupoOpcaoAvatar grupo={grupoOpcao} />
                <span>
                  <strong>{grupoOpcao.nome}</strong>
                  <small>{formatarQuantidadeAtletasGrupo(grupoOpcao.quantidadeAtletas)} • {grupoOpcao.privacidade || 'Privado'}</small>
                </span>
                {selecionada && <FaCheck aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function EtapaDupla({ numero, propsDupla, onConcluir }) {
  const vencedor = obterVencedora(propsDupla.dados);
  const prefixo = numero === 1 ? 'dupla1' : 'dupla2';
  const refs = numero === 1
    ? {
        inputRef: propsDupla.atletaRefs.dupla1Atleta1,
        inputRef2: propsDupla.atletaRefs.dupla1Atleta2,
        proximoRef1: propsDupla.atletaRefs.dupla1Atleta2,
        proximoRef2: null
      }
    : {
        inputRef: propsDupla.atletaRefs.dupla2Atleta1,
        inputRef2: propsDupla.atletaRefs.dupla2Atleta2,
        proximoRef1: propsDupla.atletaRefs.dupla2Atleta2,
        proximoRef2: null
      };

  return (
    <section className="registrar-partida-novo-etapa registrar-partida-novo-etapa-dupla">
      <div className="registrar-partida-novo-intro">
        <h3>Quem jogou na Dupla {numero}?</h3>
      </div>

      <DuplaRegistro
        numero={numero}
        vencedora={vencedor === prefixo ? vencedor : ''}
        onConcluir={onConcluir}
        {...propsDupla}
        {...refs}
      />
    </section>
  );
}

function ResumoDuplasWizard({ dados, selecoes }) {
  const atletasDupla1 = montarAtletasDuplaVencedora(dados, selecoes, 'dupla1');
  const atletasDupla2 = montarAtletasDuplaVencedora(dados, selecoes, 'dupla2');

  function renderizarDupla(rotulo, atletas) {
    return (
      <div className="registrar-partida-novo-dupla-resumo">
        <span>{rotulo}</span>
        <div className="registrar-partida-novo-dupla-resumo-avatares" aria-hidden="true">
          {atletas.map((atleta, indice) => (
            <AvatarUsuario
              key={`${rotulo}-avatar-${indice}`}
              nome={atleta.nome}
              fotoPerfilUrl={atleta.fotoPerfilUrl}
              tamanho="sm"
              className="registrar-partida-novo-dupla-resumo-avatar"
            />
          ))}
        </div>
        {atletas.map((atleta, indice) => (
          <strong key={`${rotulo}-nome-${indice}`}>{atleta.nome}</strong>
        ))}
      </div>
    );
  }

  return (
    <div className="registrar-partida-novo-confronto-resumo" aria-label="Resumo das duplas">
      {renderizarDupla('Dupla 1', atletasDupla1)}
      <span className="registrar-partida-novo-versus">VS</span>
      {renderizarDupla('Dupla 2', atletasDupla2)}
    </div>
  );
}

function TipoRegistroCard({ selecionado, icone, titulo, descricao, detalhe, onSelecionar }) {
  return (
    <button
      type="button"
      className={`registrar-partida-novo-tipo-card ${selecionado ? 'selecionado' : ''}`}
      onClick={onSelecionar}
      aria-pressed={selecionado}
    >
      <span className="registrar-partida-novo-tipo-icone">{icone}</span>
      <span className="registrar-partida-novo-tipo-conteudo">
        <strong>{titulo}</strong>
        <small>{descricao}</small>
        <em>{detalhe}</em>
      </span>
      {selecionado ? <FaCheck aria-hidden="true" /> : <FaArrowRight aria-hidden="true" />}
    </button>
  );
}

function EtapaTipoRegistro({ dados, selecoes, onAlterarCampo }) {
  const modo = dados.resultado?.modo || '';

  return (
    <section className="registrar-partida-novo-etapa registrar-partida-novo-etapa-tipo">
      <div className="registrar-partida-novo-intro">
        <h3>Como deseja registrar?</h3>
      </div>

      <ResumoDuplasWizard dados={dados} selecoes={selecoes} />

      <div className="registrar-partida-novo-tipo-lista" role="group" aria-label="Como registrar o resultado">
        <TipoRegistroCard
          selecionado={modo === 'PlacarDetalhado'}
          icone={<FaChartBar aria-hidden="true" />}
          titulo="Com placar"
          descricao="Informe o placar completo da partida."
          detalhe="Gera estatísticas completas."
          onSelecionar={() => onAlterarCampo('resultado.modo', 'PlacarDetalhado')}
        />
        <TipoRegistroCard
          selecionado={modo === 'ApenasResultado'}
          icone={<FaTrophy aria-hidden="true" />}
          titulo="Apenas vencedor"
          descricao="Registro mais rápido."
          detalhe="Calcula vitórias, derrotas, ranking e sequência."
          onSelecionar={() => onAlterarCampo('resultado.modo', 'ApenasResultado')}
        />
      </div>
    </section>
  );
}

function EtapaPlacar(props) {
  const modo = props.dados.resultado?.modo || 'PlacarDetalhado';
  const apenasResultado = modo === 'ApenasResultado';
  const duplaVencedora = props.dados.resultado?.duplaVencedora || '';
  const atletasDupla1 = montarAtletasDuplaVencedora(props.dados, props.selecoes, 'dupla1');
  const atletasDupla2 = montarAtletasDuplaVencedora(props.dados, props.selecoes, 'dupla2');

  return (
    <section className="registrar-partida-novo-etapa registrar-partida-novo-etapa-placar">
      <div className="registrar-partida-novo-intro">
        <h3>Resultado</h3>
      </div>

      <div className="registrar-partida-novo-modo-resultado" role="group" aria-label="Como registrar o resultado">
        <button
          type="button"
          className={apenasResultado ? 'selecionado' : ''}
          onClick={() => props.onAlterarCampo('resultado.modo', 'ApenasResultado')}
          aria-pressed={apenasResultado}
        >
          Apenas vencedor
        </button>
        <button
          type="button"
          className={modo === 'PlacarDetalhado' ? 'selecionado' : ''}
          onClick={() => props.onAlterarCampo('resultado.modo', 'PlacarDetalhado')}
          aria-pressed={modo === 'PlacarDetalhado'}
        >
          Informar placar
        </button>
      </div>

      {apenasResultado ? (
        <section className="registrar-partida-novo-apenas-resultado" aria-label="Escolha da dupla vencedora">
          <div className="registrar-partida-novo-apenas-resultado-intro">
            <strong>Quem venceu?</strong>
          </div>

          <div className="registrar-partida-novo-vencedora-lista">
            <DuplaVencedoraCard
              numero={1}
              atletas={atletasDupla1}
              selecionada={String(duplaVencedora) === '1'}
              onSelecionar={() => props.onAlterarCampo('resultado.duplaVencedora', '1')}
            />
            <DuplaVencedoraCard
              numero={2}
              atletas={atletasDupla2}
              selecionada={String(duplaVencedora) === '2'}
              onSelecionar={() => props.onAlterarCampo('resultado.duplaVencedora', '2')}
            />
          </div>

          {!duplaVencedora && (
            <span className="registrar-partida-novo-vencedora-pendente">
              Escolha uma dupla para continuar.
            </span>
          )}

        </section>
      ) : (
        <PlacarCentral
          dados={props.dados}
          placar1Ref={props.placar1Ref}
          placar2Ref={props.placar2Ref}
          regraPartida={props.regraPartida}
          carregandoRegraPartida={props.carregandoRegraPartida}
          erroRegraPartida={props.erroRegraPartida}
          onAlterarCampo={props.onAlterarCampo}
          onRevisar={props.onRevisar}
        />
      )}
    </section>
  );
}

function EtapaResultado(props) {
  const modo = props.dados.resultado?.modo || '';
  const apenasResultado = modo === 'ApenasResultado';
  const duplaVencedora = props.dados.resultado?.duplaVencedora || '';
  const atletasDupla1 = montarAtletasDuplaVencedora(props.dados, props.selecoes, 'dupla1');
  const atletasDupla2 = montarAtletasDuplaVencedora(props.dados, props.selecoes, 'dupla2');

  return (
    <section className="registrar-partida-novo-etapa registrar-partida-novo-etapa-resultado">
      <div className="registrar-partida-novo-intro">
        <h3>Resultado</h3>
      </div>

      {modo === 'PlacarDetalhado' ? (
        <PlacarCentral
          dados={props.dados}
          placar1Ref={props.placar1Ref}
          placar2Ref={props.placar2Ref}
          regraPartida={props.regraPartida}
          carregandoRegraPartida={props.carregandoRegraPartida}
          erroRegraPartida={props.erroRegraPartida}
          onAlterarCampo={props.onAlterarCampo}
          onRevisar={props.onRevisar}
        />
      ) : apenasResultado ? (
        <section className="registrar-partida-novo-apenas-resultado" aria-label="Escolha da dupla vencedora">
          <div className="registrar-partida-novo-apenas-resultado-intro">
            <strong>Quem venceu?</strong>
          </div>

          <div className="registrar-partida-novo-vencedora-lista">
            <DuplaVencedoraCard
              numero={1}
              atletas={atletasDupla1}
              selecionada={String(duplaVencedora) === '1'}
              onSelecionar={() => props.onAlterarCampo('resultado.duplaVencedora', '1')}
            />
            <DuplaVencedoraCard
              numero={2}
              atletas={atletasDupla2}
              selecionada={String(duplaVencedora) === '2'}
              onSelecionar={() => props.onAlterarCampo('resultado.duplaVencedora', '2')}
            />
          </div>

          {!duplaVencedora && (
            <span className="registrar-partida-novo-vencedora-pendente">
              Escolha uma dupla para continuar.
            </span>
          )}
        </section>
      ) : (
        <div className="registrar-partida-novo-estado-pendente">
          <strong>Escolha o tipo de registro antes de informar o resultado.</strong>
        </div>
      )}
    </section>
  );
}

function ResumoDupla({ titulo, atletas, destaque }) {
  return (
    <div className={`registrar-partida-novo-resumo-dupla ${destaque ? 'vencedora' : ''}`}>
      <span>{titulo}</span>
      {atletas.map((atleta, indice) => (
        <strong key={`${titulo}-${indice}`}>{atleta || 'Atleta pendente'}</strong>
      ))}
    </div>
  );
}

function EstatisticaSucesso({ rotulo, valor }) {
  return (
    <div className="registrar-partida-novo-sucesso-stat">
      <span>{rotulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}

function ResultadoSucessoPremium({ resumo, partida }) {
  const vencedora = obterVencedora({
    dupla1: { pontos: resumo?.placar?.dupla1 ?? partida?.placarDuplaA },
    dupla2: { pontos: resumo?.placar?.dupla2 ?? partida?.placarDuplaB },
    resultado: {
      modo: resumo?.tipoRegistroResultado || partida?.tipoRegistroResultado,
      duplaVencedora: resumo?.duplaVencedora || partida?.duplaVencedora
    }
  });
  const grupo = partida?.nomeGrupo || 'Partida avulsa';
  const apenasResultado = resumo?.tipoRegistroResultado === 'ApenasResultado' || partida?.tipoRegistroResultado === 'ApenasResultado';

  return (
    <div className="registrar-partida-novo-sucesso-card">
      <div className="registrar-partida-novo-sucesso-card-topo">
        <span>{grupo}</span>
        {partida?.nomeCategoria && <strong>{partida.nomeCategoria}</strong>}
      </div>

      <div className="registrar-partida-novo-sucesso-resultado">
        <div className={`registrar-partida-novo-sucesso-dupla ${vencedora === 'dupla1' ? 'vencedora' : ''}`}>
          <span>Dupla 1</span>
          {(resumo?.dupla1 || []).map((nome, indice) => (
            <div key={`sucesso-dupla1-${indice}`}>
              <AvatarUsuario nome={nome} tamanho="sm" className="registrar-partida-novo-avatar" />
              <strong>{nome || 'Atleta'}</strong>
            </div>
          ))}
        </div>

        {apenasResultado ? (
          <div className="registrar-partida-novo-sucesso-placar sem-placar">
            <strong>{vencedora === 'dupla1' ? 'Dupla 1' : 'Dupla 2'}</strong>
            <span>venceu</span>
          </div>
        ) : (
          <div className="registrar-partida-novo-sucesso-placar">
            <strong>{resumo?.placar?.dupla1 ?? partida?.placarDuplaA ?? 0}</strong>
            <span>x</span>
            <strong>{resumo?.placar?.dupla2 ?? partida?.placarDuplaB ?? 0}</strong>
          </div>
        )}

        <div className={`registrar-partida-novo-sucesso-dupla ${vencedora === 'dupla2' ? 'vencedora' : ''}`}>
          <span>Dupla 2</span>
          {(resumo?.dupla2 || []).map((nome, indice) => (
            <div key={`sucesso-dupla2-${indice}`}>
              <AvatarUsuario nome={nome} tamanho="sm" className="registrar-partida-novo-avatar" />
              <strong>{nome || 'Atleta'}</strong>
            </div>
          ))}
        </div>
      </div>
      {apenasResultado && (
        <span className="registrar-partida-novo-badge-sem-placar">Resultado informado sem placar detalhado</span>
      )}
    </div>
  );
}

function RevisaoRapida({
  resumo,
  grupo,
  dados,
  salvando,
  duplicidade,
  onCancelarDuplicidade,
  onConfirmarDuplicidade
}) {
  const vencedora = obterVencedora(dados);
  const exibindoDuplicidade = Boolean(duplicidade);
  const nomeVencedora = vencedora === 'dupla1' ? 'Dupla 1' : vencedora === 'dupla2' ? 'Dupla 2' : '';
  const apenasResultado = resumo.tipoRegistroResultado === 'ApenasResultado' || dados.resultado?.modo === 'ApenasResultado';

  return (
    <section className="registrar-partida-novo-revisao" aria-label="Revisão rápida da partida">
      <div className="registrar-partida-novo-sheet">
        <div className="registrar-partida-novo-intro">
          <h3>Conferir partida</h3>
          <p>Confira atletas e resultado antes de confirmar.</p>
        </div>

        {nomeVencedora && (
          <div className="registrar-partida-novo-vencedor">
            <FaTrophy aria-hidden="true" />
            <span>Vencedora</span>
            <strong>{nomeVencedora}</strong>
          </div>
        )}

        <div className="registrar-partida-novo-resumo-card">
          <ResumoDupla titulo="Dupla 1" atletas={resumo.dupla1} destaque={vencedora === 'dupla1'} />
          {apenasResultado ? (
            <div className="registrar-partida-novo-resumo-sem-placar">
              <strong>{nomeVencedora ? `${nomeVencedora} venceu` : 'Resultado sem placar'}</strong>
              <span>Resultado informado sem placar detalhado</span>
            </div>
          ) : (
            <div className="registrar-partida-novo-resumo-placar">
              <strong>{resumo.placar.dupla1 || 0}</strong>
              <span>x</span>
              <strong>{resumo.placar.dupla2 || 0}</strong>
            </div>
          )}
          <ResumoDupla titulo="Dupla 2" atletas={resumo.dupla2} destaque={vencedora === 'dupla2'} />
        </div>

        <div className="registrar-partida-novo-meta-lista">
          <div className="registrar-partida-novo-meta">
            <span>Data e hora</span>
            <strong>{formatarData(resumo.data)}</strong>
          </div>
          {grupo?.id ? (
            <div className="registrar-partida-novo-meta">
              <span>Grupo</span>
              <strong>{grupo.nome || 'Grupo selecionado'}</strong>
            </div>
          ) : (
            <div className="registrar-partida-novo-meta registrar-partida-novo-meta-contexto">
              <strong>Partidas avulsas</strong>
            </div>
          )}
        </div>

        {exibindoDuplicidade && (
          <div className="registrar-partida-novo-alerta-duplicidade" role="alert">
            <strong>Possível partida duplicada</strong>
            <p>
              {duplicidade.mensagem ||
                'Já existe uma partida registrada hoje com os mesmos atletas e o mesmo placar. Isso pode ser uma partida repetida. Deseja registrar mesmo assim?'}
            </p>
            <div className="registrar-partida-novo-acoes registrar-partida-novo-acoes-duplicidade">
              <button type="button" className="botao-secundario" onClick={onCancelarDuplicidade} disabled={salvando}>
                Não, revisar
              </button>
              <button type="button" className="botao-primario" onClick={onConfirmarDuplicidade} disabled={salvando}>
                {salvando ? 'Salvando...' : 'Sim, registrar'}
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

function TelaSucesso({ sucesso, grupo, onFechar }) {
  const partida = sucesso?.partida || {};
  const resumo = sucesso?.resumo || {};
  const partidaId = partida?.id;
  const grupoNome = grupo?.nome || partida?.nomeGrupo || 'Partida avulsa';
  const dataRegistro = formatarData(resumo?.salvoEm || partida?.dataAtualizacao || new Date());
  const modoResultado = partida?.tipoRegistroResultado || resumo?.tipoRegistroResultado;
  const apenasResultado = modoResultado === 'ApenasResultado';
  const duplaVencedora = Number(partida?.duplaVencedora || resumo?.duplaVencedora || 0);
  const placarDupla1 = partida?.placarDuplaA ?? resumo?.placar?.dupla1 ?? 0;
  const placarDupla2 = partida?.placarDuplaB ?? resumo?.placar?.dupla2 ?? 0;
  const nomesDupla1 = [
    partida?.nomeDuplaAAtleta1 || resumo?.dupla1?.[0],
    partida?.nomeDuplaAAtleta2 || resumo?.dupla1?.[1]
  ].filter(Boolean);
  const nomesDupla2 = [
    partida?.nomeDuplaBAtleta1 || resumo?.dupla2?.[0],
    partida?.nomeDuplaBAtleta2 || resumo?.dupla2?.[1]
  ].filter(Boolean);
  const vencedora = duplaVencedora === 1 ? nomesDupla1 : nomesDupla2;
  const perdedora = duplaVencedora === 1 ? nomesDupla2 : nomesDupla1;

  return (
    <section className="registrar-partida-novo-sucesso">
      <div className="registrar-partida-novo-check">
        <FaTrophy aria-hidden="true" />
      </div>

      <h3>🏆 Partida registrada</h3>

      <div className="registrar-partida-novo-sucesso-card">
        <div className="registrar-partida-novo-sucesso-dupla vencedora">
          <span>Venceram</span>
          {vencedora.map((nome, indice) => (
            <strong key={`vencedora-${indice}`}>{nome}</strong>
          ))}
        </div>

        <div className="registrar-partida-novo-sucesso-placar">
          {apenasResultado ? (
            <strong>Venceu</strong>
          ) : (
            <>
              <strong>{placarDupla1}</strong>
              <span>x</span>
              <strong>{placarDupla2}</strong>
            </>
          )}
        </div>

        <div className="registrar-partida-novo-sucesso-dupla">
          <span>Contra</span>
          {perdedora.map((nome, indice) => (
            <strong key={`perdedora-${indice}`}>{nome}</strong>
          ))}
        </div>
      </div>

      <div className="registrar-partida-novo-meta registrar-partida-novo-meta-sucesso">
        <span>Grupo</span>
        <strong>{grupoNome}</strong>
        <span>Data</span>
        <strong>{dataRegistro}</strong>
      </div>

      <div className="registrar-partida-novo-acoes registrar-partida-novo-acoes-sucesso">
        {partidaId && (
          <div className="registrar-partida-novo-compartilhar-principal">
            <CompartilharPartidaBotao
              partidaId={partidaId}
              className="botao-primario registrar-partida-novo-compartilhar-resultado"
              texto="Compartilhar resultado"
              ariaLabel="Compartilhar resultado"
              title="Compartilhar resultado"
            />
          </div>
        )}

        <button type="button" className="botao-secundario registrar-partida-novo-fechar-sucesso" onClick={onFechar}>
          Fechar
        </button>
      </div>
    </section>
  );
}

function TelaSucessoEdicao({ sucesso, onFechar }) {
  const partida = sucesso?.partida || {};
  const resumo = sucesso?.resumo || {};

  return (
    <section className="registrar-partida-novo-sucesso">
      <div className="registrar-partida-novo-check">
        <FaCheck aria-hidden="true" />
      </div>

      <h3>Partida atualizada</h3>
      <p>As alterações foram salvas no histórico QuebraNunca.</p>

      <ResultadoSucessoPremium resumo={resumo} partida={partida} />

      <div className="registrar-partida-novo-acoes registrar-partida-novo-acoes-sucesso">
        <button type="button" className="botao-primario" onClick={onFechar}>
          Concluir
        </button>
      </div>
    </section>
  );
}

function Stepper({ etapas, indiceEtapa }) {
  return (
    <nav className="registrar-partida-novo-stepper" aria-label="Momentos do registro">
      {etapas.map((etapa, indice) => (
        <span
          key={etapa.id}
          className={[
            'registrar-partida-novo-stepper-item',
            indice === indiceEtapa ? 'ativo' : '',
            indice < indiceEtapa ? 'concluido' : ''
          ].filter(Boolean).join(' ')}
        >
          <IconeEtapa tipo={etapa.icone} />
          <small>{etapa.titulo}</small>
        </span>
      ))}
    </nav>
  );
}

function obterRotuloAcao(etapaAtual, salvando) {
  if (salvando) {
    return etapaAtual?.id === 'revisao' ? 'Registrando...' : 'Aguarde...';
  }

  if (etapaAtual?.id === 'grupo') {
    return 'Continuar';
  }

  if (etapaAtual?.id === 'dupla1' || etapaAtual?.id === 'dupla2') {
    return 'Continuar';
  }

  if (etapaAtual?.id === 'tipo' || etapaAtual?.id === 'resultado') {
    return 'Continuar';
  }

  return 'Registrar partida';
}

function obterNomesAtletasWizard(dados) {
  return [
    limparTexto(dados.dupla1.atletaDireita),
    limparTexto(dados.dupla1.atletaEsquerda),
    limparTexto(dados.dupla2.atletaDireita),
    limparTexto(dados.dupla2.atletaEsquerda)
  ];
}

function duplaEstaPreenchida(dados, prefixo) {
  const atleta1 = limparTexto(dados[prefixo].atletaDireita);
  const atleta2 = limparTexto(dados[prefixo].atletaEsquerda);

  return Boolean(atleta1 && atleta2 && atleta1.toLowerCase() !== atleta2.toLowerCase());
}

function atletasEstaoValidosParaWizard(dados) {
  const nomes = obterNomesAtletasWizard(dados);
  const nomesNormalizados = nomes.map((nome) => nome.toLowerCase()).filter(Boolean);

  return nomes.every(Boolean) && new Set(nomesNormalizados).size === nomesNormalizados.length;
}

function resultadoEstaPreenchido(dados, regraPartida) {
  const modo = dados.resultado?.modo || '';

  if (modo === 'ApenasResultado') {
    return Boolean(dados.resultado?.duplaVencedora);
  }

  if (modo === 'PlacarDetalhado') {
    return placarDetalhadoEstaValido(dados, regraPartida) &&
      montarValidacoesPlacar(dados, regraPartida).every((validacao) => validacao.ok);
  }

  return false;
}

function obterAcaoPrincipalDesabilitada({
  etapaAtual,
  dados,
  grupo,
  regraPartida,
  salvando,
  duplicidade,
  revisaoInvalida
}) {
  if (salvando || duplicidade) {
    return true;
  }

  if (etapaAtual?.id === 'grupo') {
    return !grupo?.id;
  }

  if (etapaAtual?.id === 'dupla1') {
    return !duplaEstaPreenchida(dados, 'dupla1');
  }

  if (etapaAtual?.id === 'dupla2') {
    return !duplaEstaPreenchida(dados, 'dupla2') || !atletasEstaoValidosParaWizard(dados);
  }

  if (etapaAtual?.id === 'tipo') {
    return dados.resultado?.modo !== 'PlacarDetalhado' && dados.resultado?.modo !== 'ApenasResultado';
  }

  if (etapaAtual?.id === 'resultado') {
    return !resultadoEstaPreenchido(dados, regraPartida);
  }

  return revisaoInvalida;
}

function RodapeAcoesPartida({
  ctaRef,
  salvando,
  desabilitado,
  textoBotaoPrincipal,
  textoBotaoPrincipalSalvando,
  textoBotaoSecundario = 'Cancelar',
  onAcaoSecundaria,
  exibirSecundario = true
}) {
  return (
    <footer
      ref={ctaRef}
      className="registrar-partida-novo-acoes registrar-partida-novo-cta-sticky"
      data-estado={salvando ? 'loading' : desabilitado ? 'disabled' : 'enabled'}
      aria-busy={salvando}
    >
      {exibirSecundario && (
        <button type="button" className="botao-secundario" onClick={onAcaoSecundaria} disabled={salvando}>
          {textoBotaoSecundario}
        </button>
      )}
      <button type="submit" className="botao-primario" disabled={desabilitado} aria-busy={salvando}>
        {salvando ? textoBotaoPrincipalSalvando : textoBotaoPrincipal}
      </button>
    </footer>
  );
}

function ConteudoEtapa({
  etapaAtual,
  dados,
  selecoes,
  resumo,
  sugestoes,
  sugestoesRapidas,
  campoBuscando,
  duplicidade,
  regraPartida,
  carregandoRegraPartida,
  erroRegraPartida,
  grupo,
  carregandoGrupo,
  gruposDisponiveis,
  carregandoGruposDisponiveis,
  erroGruposDisponiveis,
  salvando,
  atletaRefs,
  placar1Ref,
  placar2Ref,
  campoAtivo,
  onCarregarGrupos,
  onSelecionarGrupo,
  onEscolherGrupo,
  onRemoverGrupo,
  onAlterarCampo,
  onSelecionarAtleta,
  onLimparSelecao,
  onRevisar,
  onConcluirEtapa,
  onCancelarDuplicidade,
  onConfirmarDuplicidade,
  fluxoSimplificado = false
}) {
  const propsRegistro = {
    dados,
    selecoes,
    resumo,
    sugestoes,
    sugestoesRapidas,
    campoBuscando,
    regraPartida,
    carregandoRegraPartida,
    erroRegraPartida,
    atletaRefs,
    placar1Ref,
    placar2Ref,
    campoAtivo,
    onAlterarCampo,
    onSelecionarAtleta,
    onLimparSelecao,
    onRevisar
  };

  if (etapaAtual.id === 'grupo') {
    return (
      <EtapaGrupo
        grupo={grupo}
        carregandoGrupo={carregandoGrupo}
        gruposDisponiveis={gruposDisponiveis}
        carregandoGruposDisponiveis={carregandoGruposDisponiveis}
        erroGruposDisponiveis={erroGruposDisponiveis}
        permitirRemoverGrupo
        onCarregarGrupos={onCarregarGrupos}
        onSelecionarGrupo={onSelecionarGrupo}
        onEscolherGrupo={onEscolherGrupo}
        onRemoverGrupo={onRemoverGrupo}
      />
    );
  }

  if (etapaAtual.id === 'dupla1') {
    return <EtapaDupla numero={1} propsDupla={propsRegistro} onConcluir={onConcluirEtapa} />;
  }

  if (etapaAtual.id === 'dupla2') {
    return <EtapaDupla numero={2} propsDupla={propsRegistro} onConcluir={onConcluirEtapa} />;
  }

  if (etapaAtual.id === 'tipo') {
    return <EtapaTipoRegistro dados={dados} selecoes={selecoes} onAlterarCampo={onAlterarCampo} />;
  }

  if (etapaAtual.id === 'resultado') {
    return <EtapaResultado {...propsRegistro} />;
  }

  return (
    <RevisaoRapida
      resumo={resumo}
      grupo={grupo}
      dados={dados}
      salvando={salvando}
      duplicidade={duplicidade}
      onCancelarDuplicidade={onCancelarDuplicidade}
      onConfirmarDuplicidade={onConfirmarDuplicidade}
    />
  );
}

export function RegistrarPartidaNovoModal({
  aberto,
  etapas,
  etapaAtual,
  indiceEtapa,
  dados,
  selecoes,
  resumo,
  sucesso,
  sugestoes,
  sugestoesRapidas,
  campoBuscando,
  erro,
  salvando,
  duplicidade,
  regraPartida,
  carregandoRegraPartida,
  erroRegraPartida,
  grupo,
  carregandoGrupo,
  gruposDisponiveis,
  carregandoGruposDisponiveis,
  erroGruposDisponiveis,
  seletorGrupoAberto,
  onCarregarGrupos,
  onSelecionarGrupo,
  onEscolherGrupo,
  onRemoverGrupo,
  onFecharSeletorGrupo,
  onAlterarCampo,
  onSelecionarAtleta,
  onLimparSelecao,
  onConfirmarEtapa,
  onVoltar,
  onCancelarDuplicidade,
  onConfirmarDuplicidade,
  onFechar,
  onFecharSucesso,
  onAdicionarMidia,
  onVerPartida,
  onRegistrarRevanche,
  fluxoSimplificado = false,
  titulo = 'Registrar partida',
  ariaFechar = 'Fechar registro de partida',
  rotuloAcaoPrincipal = 'Registrar partida',
  rotuloAcaoPrincipalSalvando = 'Registrando...',
  permitirRemoverGrupo = true,
  sucessoEdicao = false
}) {
  const campoRef = useRef(null);
  const dupla1Atleta2Ref = useRef(null);
  const dupla2Atleta1Ref = useRef(null);
  const dupla2Atleta2Ref = useRef(null);
  const atletaRefs = {
    dupla1Atleta1: campoRef,
    dupla1Atleta2: dupla1Atleta2Ref,
    dupla2Atleta1: dupla2Atleta1Ref,
    dupla2Atleta2: dupla2Atleta2Ref
  };
  const placar1Ref = useRef(null);
  const placar2Ref = useRef(null);
  const formRef = useRef(null);
  const modalRef = useRef(null);
  const ctaRef = useRef(null);
  const corpoRef = useRef(null);
  const alturaViewportBaseRef = useRef(0);
  const [inputEmFoco, setInputEmFoco] = useState(false);
  const [campoAtivo, setCampoAtivo] = useState('');
  const [tecladoAberto, setTecladoAberto] = useState(false);
  const [modoMobile, setModoMobile] = useState(false);
  const revisaoInvalida = revisaoPossuiInconsistencia(dados, regraPartida);
  const acaoFecharAtual = sucesso && !sucessoEdicao ? onFecharSucesso || onFechar : onFechar;
  const acaoPrincipalDesabilitada = fluxoSimplificado
    ? salvando || Boolean(duplicidade) || revisaoInvalida
    : obterAcaoPrincipalDesabilitada({
        etapaAtual,
        dados,
        grupo,
        regraPartida,
        salvando,
        duplicidade,
        revisaoInvalida
      });

  useEffect(() => {
    if (!aberto) {
      return undefined;
    }

    document.body.classList.add('registrar-partida-modal-aberto');

    return () => {
      document.body.classList.remove('registrar-partida-modal-aberto');
    };
  }, [aberto]);

  useEffect(() => {
    if (!aberto || sucesso) {
      return;
    }

    const dispositivoMobile = window.matchMedia?.('(max-width: 720px), (pointer: coarse)').matches;
    if (dispositivoMobile) {
      return;
    }

    const focosPorEtapa = {
      grupo: null,
      dupla1: campoRef,
      dupla2: dupla2Atleta1Ref,
      resultado: placar1Ref
    };

    const foco = Object.prototype.hasOwnProperty.call(focosPorEtapa, etapaAtual?.id)
      ? focosPorEtapa[etapaAtual?.id]
      : campoRef;
    if (foco) {
      focusCampoSemPular(foco);
    }
  }, [aberto, etapaAtual?.id, sucesso]);

  useEffect(() => {
    if (!aberto) {
      return undefined;
    }

    const viewport = window.visualViewport;
    const modal = modalRef.current;
    let rafId = 0;

    function atualizarOffsetTeclado() {
      if (!modal) {
        return;
      }

      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        const alturaVisual = viewport?.height || window.innerHeight;
        alturaViewportBaseRef.current = Math.max(
          alturaViewportBaseRef.current,
          window.innerHeight,
          alturaVisual
        );
        const offset = viewport
          ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
          : 0;
        const reducaoViewport = Math.max(0, alturaViewportBaseRef.current - alturaVisual);
        const tecladoAbertoDetectado = campoInterativoEstaFocado() && (offset > 90 || reducaoViewport > 120);
        const alturaViewport = viewport?.height || window.innerHeight;

        modal.style.setProperty('--registrar-partida-viewport-height', `${Math.round(alturaViewport)}px`);
        modal.dataset.tecladoAberto = tecladoAbertoDetectado ? 'true' : 'false';
        setTecladoAberto(tecladoAbertoDetectado);
      });
    }

    const mediaMobile = window.matchMedia('(max-width: 720px), (pointer: coarse)');

    function atualizarModoMobile() {
      setModoMobile(mediaMobile.matches);
    }

    atualizarModoMobile();
    atualizarOffsetTeclado();
    viewport?.addEventListener('resize', atualizarOffsetTeclado);
    viewport?.addEventListener('scroll', atualizarOffsetTeclado);
    window.addEventListener('orientationchange', atualizarOffsetTeclado);
    if (typeof mediaMobile.addEventListener === 'function') {
      mediaMobile.addEventListener('change', atualizarModoMobile);
    } else {
      mediaMobile.addListener(atualizarModoMobile);
    }

    return () => {
      viewport?.removeEventListener('resize', atualizarOffsetTeclado);
      viewport?.removeEventListener('scroll', atualizarOffsetTeclado);
      window.removeEventListener('orientationchange', atualizarOffsetTeclado);
      if (typeof mediaMobile.removeEventListener === 'function') {
        mediaMobile.removeEventListener('change', atualizarModoMobile);
      } else {
        mediaMobile.removeListener(atualizarModoMobile);
      }
      window.cancelAnimationFrame(rafId);
      modal?.style.removeProperty('--registrar-partida-viewport-height');
      modal?.removeAttribute('data-teclado-aberto');
      setTecladoAberto(false);
    };
  }, [aberto]);

  useEffect(() => {
    if (!aberto || !modalRef.current || !ctaRef.current) {
      return undefined;
    }

    const modal = modalRef.current;
    const cta = ctaRef.current;

    function atualizarAlturaCta() {
      modal.style.setProperty('--registrar-partida-cta-height', `${Math.ceil(cta.getBoundingClientRect().height)}px`);
    }

    atualizarAlturaCta();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', atualizarAlturaCta);
      return () => {
        window.removeEventListener('resize', atualizarAlturaCta);
        modal.style.removeProperty('--registrar-partida-cta-height');
      };
    }

    const observer = new ResizeObserver(atualizarAlturaCta);
    observer.observe(cta);

    return () => {
      observer.disconnect();
      modal.style.removeProperty('--registrar-partida-cta-height');
    };
  }, [aberto, sucesso, indiceEtapa, duplicidade]);

  useEffect(() => {
    if (!aberto || !corpoRef.current) {
      return undefined;
    }

    const container = corpoRef.current;
    let rafCampoAtivo = 0;

    function alinharCampoAtivo(alvo) {
      if (!(alvo instanceof HTMLElement)) {
        return;
      }

      const elemento = alvo.closest('input, textarea, select');
      if (!(elemento instanceof HTMLElement)) {
        return;
      }

      window.cancelAnimationFrame(rafCampoAtivo);
      rafCampoAtivo = window.requestAnimationFrame(() => {
        const areaUtil = container.getBoundingClientRect();
        const campo = elemento.getBoundingClientRect();
        const safeTop = modoMobile ? 16 : 24;
        const destino = container.scrollTop + campo.top - areaUtil.top - safeTop;

        container.scrollTo({
          top: Math.max(0, destino),
          behavior: 'smooth'
        });
      });
    }

    function aoFocar(evento) {
      const elementoFoco = evento.target;
      if (!(elementoFoco instanceof HTMLElement)) {
        return;
      }

      if (!elementoFoco.matches('input, textarea, select')) {
        return;
      }

      setInputEmFoco(true);
      setCampoAtivo(elementoFoco.dataset.campoRegistroPartida || '');
      alinharCampoAtivo(elementoFoco);
    }

    function aoPerderFoco() {
      window.setTimeout(() => {
        const ativo = document.activeElement;
        const segueNoFormulario = ativo instanceof HTMLElement && container.contains(ativo) && ativo.matches('input, textarea, select');
        if (!segueNoFormulario) {
          setInputEmFoco(false);
          setCampoAtivo('');
        }
      }, 40);
    }

    container.addEventListener('focusin', aoFocar);
    container.addEventListener('focusout', aoPerderFoco);

    return () => {
      container.removeEventListener('focusin', aoFocar);
      container.removeEventListener('focusout', aoPerderFoco);
      window.cancelAnimationFrame(rafCampoAtivo);
    };
  }, [aberto, modoMobile]);

  if (!aberto) {
    return null;
  }

  function renderizarConteudoSimplificado() {
    return (
      <form
        ref={formRef}
        className="registrar-partida-novo-formulario registrar-partida-novo-formulario-simples"
        onSubmit={onConfirmarEtapa}
        autoComplete="off"
      >
        <main
          ref={corpoRef}
          className="registrar-partida-novo-corpo registrar-partida-novo-corpo-simples"
          data-testid="registrar-partida-corpo"
        >
          {erro && <p className="texto-erro registrar-partida-novo-erro">{erro}</p>}

          <EtapaGrupo
            grupo={grupo}
            carregandoGrupo={carregandoGrupo}
            gruposDisponiveis={gruposDisponiveis}
            carregandoGruposDisponiveis={carregandoGruposDisponiveis}
            erroGruposDisponiveis={erroGruposDisponiveis}
            permitirRemoverGrupo={permitirRemoverGrupo}
            onCarregarGrupos={onCarregarGrupos}
            onSelecionarGrupo={onSelecionarGrupo}
            onEscolherGrupo={onEscolherGrupo}
            onRemoverGrupo={onRemoverGrupo}
          />

          <section className="registrar-partida-novo-duplas-unicas">
            <DuplaRegistro
              numero={1}
              dados={dados}
              selecoes={selecoes}
              sugestoes={sugestoes}
              sugestoesRapidas={sugestoesRapidas}
              campoBuscando={campoBuscando}
              inputRef={campoRef}
              inputRef2={dupla1Atleta2Ref}
              vencedora=""
              campoAtivo={campoAtivo}
              onAlterarCampo={onAlterarCampo}
              onSelecionarAtleta={onSelecionarAtleta}
              onLimparSelecao={(campo) => onAlterarCampo(campo, '')}
            />

            <DuplaRegistro
              numero={2}
              dados={dados}
              selecoes={selecoes}
              sugestoes={sugestoes}
              sugestoesRapidas={sugestoesRapidas}
              campoBuscando={campoBuscando}
              inputRef={dupla2Atleta1Ref}
              inputRef2={dupla2Atleta2Ref}
              vencedora=""
              campoAtivo={campoAtivo}
              onAlterarCampo={onAlterarCampo}
              onSelecionarAtleta={onSelecionarAtleta}
              onLimparSelecao={(campo) => onAlterarCampo(campo, '')}
            />
          </section>

          <EtapaPlacar
            dados={dados}
            selecoes={selecoes}
            placar1Ref={placar1Ref}
            placar2Ref={placar2Ref}
            regraPartida={regraPartida}
            carregandoRegraPartida={carregandoRegraPartida}
            erroRegraPartida={erroRegraPartida}
            onAlterarCampo={onAlterarCampo}
            onRevisar={() => formRef.current?.requestSubmit()}
          />

          {duplicidade && (
            <div className="registrar-partida-novo-alerta-duplicidade" role="alert">
              <strong>Possível partida duplicada</strong>
              <p>
                {duplicidade.mensagem ||
                  'Já existe uma partida registrada hoje com os mesmos atletas e o mesmo placar. Isso pode ser uma partida repetida. Deseja registrar mesmo assim?'}
              </p>
              <div className="registrar-partida-novo-acoes registrar-partida-novo-acoes-duplicidade">
                <button type="button" className="botao-secundario" onClick={onCancelarDuplicidade} disabled={salvando}>
                  Não, revisar
                </button>
                <button type="button" className="botao-primario" onClick={onConfirmarDuplicidade} disabled={salvando}>
                  {salvando ? 'Salvando...' : `Sim, ${rotuloAcaoPrincipal.toLowerCase()}`}
                </button>
              </div>
            </div>
          )}
        </main>

        <RodapeAcoesPartida
          ctaRef={ctaRef}
          salvando={salvando}
          desabilitado={acaoPrincipalDesabilitada}
          textoBotaoPrincipal={rotuloAcaoPrincipal}
          textoBotaoPrincipalSalvando={rotuloAcaoPrincipalSalvando}
          textoBotaoSecundario="Cancelar"
          onAcaoSecundaria={onFechar}
        />

        <SeletorGrupoPartida
          aberto={seletorGrupoAberto}
          grupos={gruposDisponiveis}
          grupoSelecionado={grupo}
          carregando={carregandoGruposDisponiveis}
          erro={erroGruposDisponiveis}
          permitirRemoverGrupo={permitirRemoverGrupo}
          onSelecionarGrupo={onEscolherGrupo}
          onRemoverGrupo={onRemoverGrupo}
          onFechar={onFecharSeletorGrupo}
        />
      </form>
    );
  }

  return (
    <div className="modal-sobreposicao registrar-partida-novo-sobreposicao" role="presentation">
      <section
        ref={modalRef}
        className={[
          'modal-conteudo',
          'registrar-partida-novo-modal',
          inputEmFoco ? 'keyboard-active' : '',
          tecladoAberto ? 'teclado-aberto' : ''
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="registrar-partida-novo-titulo"
      >
        <HeaderModal
          etapas={etapas}
          indiceEtapa={indiceEtapa}
          etapaAtual={etapaAtual}
          salvando={salvando}
          onVoltar={onVoltar}
          onFechar={acaoFecharAtual}
          sucesso={sucesso}
          fluxoSimplificado={fluxoSimplificado}
          titulo={titulo}
          ariaFechar={ariaFechar}
        />

        {sucesso && sucessoEdicao ? (
          <TelaSucessoEdicao sucesso={sucesso} onFechar={onFechar} />
        ) : sucesso ? (
          <TelaSucesso
            sucesso={sucesso}
            grupo={grupo}
            onFechar={acaoFecharAtual}
          />
        ) : fluxoSimplificado ? (
          renderizarConteudoSimplificado()
        ) : (
          <form
            ref={formRef}
            className="registrar-partida-novo-formulario"
            onSubmit={onConfirmarEtapa}
            autoComplete="off"
          >
            <Stepper etapas={etapas} indiceEtapa={indiceEtapa} />

            <main ref={corpoRef} className="registrar-partida-novo-corpo">
              {erro && <p className="texto-erro registrar-partida-novo-erro">{erro}</p>}
              <ConteudoEtapa
                etapaAtual={etapaAtual}
                dados={dados}
                selecoes={selecoes}
                resumo={resumo}
                sugestoes={sugestoes}
                sugestoesRapidas={sugestoesRapidas}
                campoBuscando={campoBuscando}
                duplicidade={duplicidade}
                regraPartida={regraPartida}
                carregandoRegraPartida={carregandoRegraPartida}
                erroRegraPartida={erroRegraPartida}
                grupo={grupo}
                carregandoGrupo={carregandoGrupo}
                gruposDisponiveis={gruposDisponiveis}
                carregandoGruposDisponiveis={carregandoGruposDisponiveis}
                erroGruposDisponiveis={erroGruposDisponiveis}
                permitirRemoverGrupo={permitirRemoverGrupo}
                salvando={salvando}
                atletaRefs={atletaRefs}
                placar1Ref={placar1Ref}
                placar2Ref={placar2Ref}
                campoAtivo={campoAtivo}
                onCarregarGrupos={onCarregarGrupos}
                onSelecionarGrupo={onSelecionarGrupo}
                onEscolherGrupo={onEscolherGrupo}
                onRemoverGrupo={onRemoverGrupo}
                onAlterarCampo={onAlterarCampo}
                onSelecionarAtleta={onSelecionarAtleta}
                onLimparSelecao={onLimparSelecao}
                onRevisar={() => formRef.current?.requestSubmit()}
                onConcluirEtapa={() => formRef.current?.requestSubmit()}
                onCancelarDuplicidade={onCancelarDuplicidade}
                onConfirmarDuplicidade={onConfirmarDuplicidade}
              />
            </main>

            <RodapeAcoesPartida
              ctaRef={ctaRef}
              salvando={salvando}
              desabilitado={acaoPrincipalDesabilitada}
              textoBotaoPrincipal={obterRotuloAcao(etapaAtual, false)}
              textoBotaoPrincipalSalvando={obterRotuloAcao(etapaAtual, true)}
              textoBotaoSecundario="Voltar"
              onAcaoSecundaria={indiceEtapa > 0 ? onVoltar : onFechar}
              exibirSecundario={!duplicidade}
            />

            <SeletorGrupoPartida
              aberto={seletorGrupoAberto}
              grupos={gruposDisponiveis}
              grupoSelecionado={grupo}
              carregando={carregandoGruposDisponiveis}
              erro={erroGruposDisponiveis}
              permitirRemoverGrupo={permitirRemoverGrupo}
              onSelecionarGrupo={onEscolherGrupo}
              onRemoverGrupo={onRemoverGrupo}
              onFechar={onFecharSeletorGrupo}
            />
          </form>
        )}
      </section>
    </div>
  );
}
