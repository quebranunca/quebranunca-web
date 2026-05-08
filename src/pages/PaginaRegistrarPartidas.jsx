import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CompartilharPartidaBotao } from '../components/partidas/CompartilharPartidaBotao';
import { gruposServico } from '../services/gruposServico';
import { partidasServico } from '../services/partidasServico';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { extrairMensagemErro } from '../utils/erros';
import { ehAtleta } from '../utils/perfis';
import { useNotification } from '../contexts/NotificationContext';
import { obterNomeExibicaoAtleta } from '../utils/atletaUtils';
import {
  ajustarDataHoraInputParaIntervalo,
  obterDataHoraPadraoInput,
  STEP_HORA_15_MINUTOS_SEGUNDOS
} from '../utils/formatacao';

const LADOS_ATLETA = {
  direito: 1,
  esquerdo: 2
};

const GRUPO_GERAL_ID = '__grupo-geral__';
const NOME_GRUPO_GERAL = 'Geral';
const MENSAGEM_GRUPO_DUPLICADO = 'Já existe grupo com esse nome. Altere o nome para criar um novo grupo.';

function criarEstadoInicial() {
  return {
    nomeGrupo: '',
    duplaAAtleta1Id: '',
    duplaAAtleta1Nome: '',
    duplaAAtleta2Id: '',
    duplaAAtleta2Nome: '',
    duplaBAtleta1Id: '',
    duplaBAtleta1Nome: '',
    duplaBAtleta2Id: '',
    duplaBAtleta2Nome: '',
    placarDuplaA: '',
    placarDuplaB: '',
    dataPartida: obterDataHoraPadraoInput(),
    observacoes: ''
  };
}

function paraIsoUtc(dataLocal) {
  return dataLocal ? new Date(dataLocal).toISOString() : null;
}

function normalizarNomeGrupo(nome) {
  return (nome || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
}

function obterGrupoDoRetornoVerificacao(retorno) {
  return retorno?.grupo || retorno?.grupoExistente || retorno?.grupoEncontrado || null;
}

function retornoIndicaGrupoExistente(retorno) {
  return Boolean(
    retorno?.existe ||
    retorno?.existente ||
    retorno?.grupoExiste ||
    obterGrupoDoRetornoVerificacao(retorno)
  );
}

function retornoIndicaPertencimento(retorno) {
  return Boolean(
    retorno?.usuarioFazParte ||
    retorno?.fazParte ||
    retorno?.pertenceAoUsuario ||
    retorno?.usuarioParticipa ||
    retorno?.podeUsar
  );
}

function obterCampoBaseAtletaUsuarioPrimeiraDupla(lado) {
  return Number(lado) === LADOS_ATLETA.esquerdo ? 'duplaAAtleta2' : 'duplaAAtleta1';
}

function obterCamposAtletaUsuarioPrimeiraDupla(atletaId, atletaNome, atletaLado) {
  if (!atletaId || !atletaNome) {
    return {};
  }

  const campoBase = obterCampoBaseAtletaUsuarioPrimeiraDupla(atletaLado);

  return {
    [`${campoBase}Id`]: atletaId,
    [`${campoBase}Nome`]: atletaNome
  };
}

export function PaginaRegistrarPartidas() {
  const { usuario } = useAutenticacao();
  const navegar = useNavigate();
  const [params, setParams] = useSearchParams();
  const { showNotification, closeNotification } = useNotification();

  const usuarioAtleta = ehAtleta(usuario);
  const atletaUsuarioId = usuario?.atletaId || '';
  const atletaUsuarioNome = obterNomeExibicaoAtleta(usuario?.atleta) || usuario?.nome || '';
  const atletaUsuarioLado = Number(usuario?.atleta?.lado || LADOS_ATLETA.direito);

  const [grupos, setGrupos] = useState([]);
  const [formulario, setFormulario] = useState(() => criarEstadoInicial());
  const [grupoId, setGrupoId] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [erroNovoGrupo, setErroNovoGrupo] = useState('');
  const [validandoNovoGrupo, setValidandoNovoGrupo] = useState(false);
  const [feedbackPendencias, setFeedbackPendencias] = useState([]);

  const grupoSelecionado = grupos.find((grupo) => grupo.id === grupoId) || null;
  const grupoGeralNaLista = grupos.some((grupo) => normalizarNomeGrupo(grupo.nome) === normalizarNomeGrupo(NOME_GRUPO_GERAL));
  const grupoFoiEscolhido = Boolean(grupoId);
  const podeSalvar = !salvando && !validandoNovoGrupo && !erroNovoGrupo && !(usuarioAtleta && !atletaUsuarioId);

  useEffect(() => {
    carregarBase();
  }, []);

  useEffect(() => {
    if (!atletaUsuarioId) {
      return;
    }

    setFormulario((anterior) => ({
      ...anterior,
      ...obterCamposAtletaUsuarioPrimeiraDupla(atletaUsuarioId, atletaUsuarioNome, atletaUsuarioLado)
    }));
  }, [atletaUsuarioId, atletaUsuarioLado, atletaUsuarioNome]);

  useEffect(() => {
    if (grupoFoiEscolhido) {
      setErroNovoGrupo('');
      setValidandoNovoGrupo(false);
      return undefined;
    }

    const nomeNormalizado = normalizarNomeGrupo(formulario.nomeGrupo);

    if (!nomeNormalizado) {
      setErroNovoGrupo('');
      setValidandoNovoGrupo(false);
      return undefined;
    }

    const grupoLocal = grupos.find((grupo) => normalizarNomeGrupo(grupo.nome) === nomeNormalizado);

    if (grupoLocal) {
      selecionarGrupo(grupoLocal.id);
      return undefined;
    }

    let validacaoAtiva = true;
    const temporizador = window.setTimeout(async () => {
      setValidandoNovoGrupo(true);
      setErroNovoGrupo('');

      try {
        const retorno = await gruposServico.verificarNome(formulario.nomeGrupo.trim().replace(/\s+/g, ' '));

        if (!validacaoAtiva) {
          return;
        }

        const grupoRetornado = obterGrupoDoRetornoVerificacao(retorno);
        const grupoEncontrado = grupoRetornado?.id
          ? grupos.find((grupo) => grupo.id === grupoRetornado.id) || grupoRetornado
          : null;

        if (grupoEncontrado && (retornoIndicaPertencimento(retorno) || grupos.some((grupo) => grupo.id === grupoEncontrado.id))) {
          selecionarGrupo(grupoEncontrado.id);
          return;
        }

        if (retornoIndicaGrupoExistente(retorno)) {
          setErroNovoGrupo(MENSAGEM_GRUPO_DUPLICADO);
          return;
        }

        setErroNovoGrupo('');
      } catch (error) {
        if (validacaoAtiva && error?.response?.status !== 404) {
          setErroNovoGrupo(extrairMensagemErro(error));
        }
      } finally {
        if (validacaoAtiva) {
          setValidandoNovoGrupo(false);
        }
      }
    }, 450);

    return () => {
      validacaoAtiva = false;
      window.clearTimeout(temporizador);
    };
  }, [formulario.nomeGrupo, grupoFoiEscolhido, grupos]);

  async function carregarBase() {
    setCarregando(true);
    setErro('');

    try {
      const listaGrupos = await gruposServico.listar();

      setGrupos(listaGrupos);

      const grupoUrl = params.get('grupoId');

      if (grupoUrl && listaGrupos.some((grupo) => grupo.id === grupoUrl)) {
        setGrupoId(grupoUrl);
      }
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  function atualizarParametrosUrl(proximoGrupoId) {
    const proximos = {};

    if (proximoGrupoId) {
      proximos.grupoId = proximoGrupoId;
    }

    setParams(proximos, { replace: true });
  }

  function atualizarCampo(campo, valor) {
    if (campo === 'nomeGrupo') {
      setErroNovoGrupo('');
    }

    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor
    }));
  }

  function selecionarGrupo(idGrupo) {
    setGrupoId(idGrupo);
    setFeedbackPendencias([]);
    setErroNovoGrupo('');

    setFormulario((anterior) => ({
      ...criarEstadoInicial(),
      nomeGrupo: '',
      dataPartida: anterior.dataPartida,
      ...(
        atletaUsuarioId
          ? obterCamposAtletaUsuarioPrimeiraDupla(atletaUsuarioId, atletaUsuarioNome, atletaUsuarioLado)
          : {}
      )
    }));

    atualizarParametrosUrl(idGrupo === GRUPO_GERAL_ID ? '' : idGrupo);
  }

  function atualizarAtleta(campoBase, valor) {
    setFormulario((anterior) => ({
      ...anterior,
      [`${campoBase}Id`]: '',
      [`${campoBase}Nome`]: valor
    }));
  }

  function limparFormularioAposSalvar() {
    setFormulario((anterior) => ({
      ...criarEstadoInicial(),
      dataPartida: anterior.dataPartida,
      ...(
        atletaUsuarioId
          ? obterCamposAtletaUsuarioPrimeiraDupla(atletaUsuarioId, atletaUsuarioNome, atletaUsuarioLado)
          : {}
      )
    }));
    setErroNovoGrupo('');
  }

  function aoConfirmarSucesso() {
    closeNotification();
    navegar('/app');
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();

    setErro('');
    setFeedbackPendencias([]);

    if (formulario.placarDuplaA === '' || formulario.placarDuplaB === '') {
      setErro('Informe os pontos das duas duplas.');
      return;
    }

    if (erroNovoGrupo) {
      setErro(erroNovoGrupo);
      return;
    }

    if (validandoNovoGrupo) {
      setErro('Aguarde a verificação do grupo para salvar.');
      return;
    }

    setSalvando(true);

    const nomeNovoGrupo = grupoFoiEscolhido ? '' : formulario.nomeGrupo.trim().replace(/\s+/g, ' ');

    const dados = {
      competicaoId: null,
      grupoId: grupoSelecionado?.id || null,
      nomeGrupo: nomeNovoGrupo || null,
      categoriaCompeticaoId: null,
      duplaAId: null,
      duplaBId: null,
      duplaAAtleta1Id: formulario.duplaAAtleta1Id || null,
      duplaAAtleta1Nome: formulario.duplaAAtleta1Nome.trim() || null,
      duplaAAtleta2Id: formulario.duplaAAtleta2Id || null,
      duplaAAtleta2Nome: formulario.duplaAAtleta2Nome.trim() || null,
      duplaBAtleta1Id: formulario.duplaBAtleta1Id || null,
      duplaBAtleta1Nome: formulario.duplaBAtleta1Nome.trim() || null,
      duplaBAtleta2Id: formulario.duplaBAtleta2Id || null,
      duplaBAtleta2Nome: formulario.duplaBAtleta2Nome.trim() || null,
      faseCampeonato: null,
      status: 2,
      placarDuplaA: Number(formulario.placarDuplaA),
      placarDuplaB: Number(formulario.placarDuplaB),
      dataPartida: paraIsoUtc(formulario.dataPartida),
      observacoes: formulario.observacoes || null
    };

    try {
      const partidaSalva = await partidasServico.criar(dados);
      const pendenciasSemContato = (partidaSalva?.atletasPendentes || []).filter((item) => !item.temEmail);

      showNotification({
        type: 'success',
        title: 'Partida salva com sucesso!',
        message: 'Agora você pode compartilhar o resultado com a galera.',
        autoClose: false,
        actions: (
           <div className="notificacao-acoes-partida">
            <CompartilharPartidaBotao partidaId={partidaSalva.id} />

            <button type="button" className="botao-primario" onClick={aoConfirmarSucesso}>
              OK
            </button>
          </div>
        )
      });

      setFeedbackPendencias(pendenciasSemContato);
      limparFormularioAposSalvar();
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erro ao registrar partida',
        message: extrairMensagemErro(error)
      });
    } finally {
      setSalvando(false);
    }
  }

  function renderizarCampoAtleta(campoBase, rotulo) {
    return (
      <label>
        {rotulo}
        <input
          type="text"
          value={formulario[`${campoBase}Nome`]}
          onChange={(evento) => atualizarAtleta(campoBase, evento.target.value)}
          placeholder="Digite o apelido ou nome"
          required
        />
      </label>
    );
  }

  return (
    <section className="pagina">
      {carregando ? (
        <p>Carregando dados para registro...</p>
      ) : (
        <form className="formulario-grid formulario-partida" onSubmit={aoSubmeter}>
          <label>
            Grupo
            <select value={grupoId} onChange={(evento) => selecionarGrupo(evento.target.value)}>
              <option value="">Sem grupo selecionado</option>
              {!grupoGeralNaLista && <option value={GRUPO_GERAL_ID}>{NOME_GRUPO_GERAL}</option>}
              {grupos.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {grupo.nome}
                </option>
              ))}
            </select>
          </label>

          <p className="campo-largo texto-ajuda">
            Se não selecionar ou criar um grupo, a partida será registrada no grupo Geral.
          </p>

          {!grupoFoiEscolhido && (
            <label className="campo-largo">
              Novo grupo
              <input
                type="text"
                value={formulario.nomeGrupo}
                onChange={(evento) => atualizarCampo('nomeGrupo', evento.target.value)}
                onBlur={(evento) => atualizarCampo('nomeGrupo', evento.target.value.trim().replace(/\s+/g, ' '))}
                placeholder="Ex.: Grupo da Praia de domingo"
              />
              {validandoNovoGrupo && <span className="texto-ajuda">Verificando grupo...</span>}
              {erroNovoGrupo && <span className="texto-erro">{erroNovoGrupo}</span>}
            </label>
          )}

          <section className="campo-largo secao-dupla-partida">
            <div className="secao-dupla-partida-cabecalho">
              <strong>Dupla 1</strong>
            </div>

            <div className="secao-dupla-partida-grid">
              {renderizarCampoAtleta('duplaAAtleta1', 'Jogador Direito')}
              {renderizarCampoAtleta('duplaAAtleta2', 'Jogador Esquerdo')}

              <label>
                Pontos
                <input
                  type="number"
                  min={0}
                  value={formulario.placarDuplaA}
                  onChange={(evento) => atualizarCampo('placarDuplaA', evento.target.value)}
                  required
                />
              </label>
            </div>
          </section>

          <section className="campo-largo secao-dupla-partida">
            <div className="secao-dupla-partida-cabecalho">
              <strong>Dupla 2</strong>
            </div>

            <div className="secao-dupla-partida-grid">
              {renderizarCampoAtleta('duplaBAtleta1', 'Jogador Direito')}
              {renderizarCampoAtleta('duplaBAtleta2', 'Jogador Esquerdo')}

              <label>
                Pontos
                <input
                  type="number"
                  min={0}
                  value={formulario.placarDuplaB}
                  onChange={(evento) => atualizarCampo('placarDuplaB', evento.target.value)}
                  required
                />
              </label>
            </div>
          </section>

          <label>
            Data da partida
            <input
              type="datetime-local"
              step={STEP_HORA_15_MINUTOS_SEGUNDOS}
              value={formulario.dataPartida}
              onChange={(evento) => atualizarCampo('dataPartida', evento.target.value)}
              onBlur={(evento) => atualizarCampo('dataPartida', ajustarDataHoraInputParaIntervalo(evento.target.value))}
            />
          </label>          

          <div className="acoes-formulario">
            <button type="submit" className="botao-primario" disabled={!podeSalvar}>
              {salvando ? 'Salvando...' : 'Registrar partida'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
