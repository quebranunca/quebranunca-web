import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { gruposServico } from '../services/gruposServico';
import { partidasServico } from '../services/partidasServico';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { extrairMensagemErro } from '../utils/erros';
import { ehAtleta } from '../utils/perfis';
import { useNotification } from '../contexts/NotificationContext';

const LADOS_ATLETA = {
  direito: 1,
  esquerdo: 2
};

function obterDataHoraAtualInput() {
  const agora = new Date();
  const timezoneOffset = agora.getTimezoneOffset() * 60000;
  return new Date(agora.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

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
    dataPartida: obterDataHoraAtualInput(),
    observacoes: ''
  };
}

function paraIsoUtc(dataLocal) {
  return dataLocal ? new Date(dataLocal).toISOString() : null;
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
  const [params, setParams] = useSearchParams();
  const navegar = useNavigate();
  const { showNotification } = useNotification();

  const usuarioAtleta = ehAtleta(usuario);
  const atletaUsuarioId = usuario?.atletaId || '';
  const atletaUsuarioNome = usuario?.atleta?.nome || usuario?.nome || '';
  const atletaUsuarioLado = Number(usuario?.atleta?.lado || LADOS_ATLETA.direito);

  const [grupos, setGrupos] = useState([]);
  const [formulario, setFormulario] = useState(() => criarEstadoInicial());
  const [grupoId, setGrupoId] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [feedbackPendencias, setFeedbackPendencias] = useState([]);

  const grupoSelecionado = grupos.find((grupo) => grupo.id === grupoId) || null;
  const podeSalvar = !salvando && !(usuarioAtleta && !atletaUsuarioId);

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
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor
    }));
  }

  function selecionarGrupo(idGrupo) {
    setGrupoId(idGrupo);
    setFeedbackPendencias([]);

    setFormulario((anterior) => ({
      ...criarEstadoInicial(),
      dataPartida: anterior.dataPartida,
      ...(
        atletaUsuarioId
          ? obterCamposAtletaUsuarioPrimeiraDupla(atletaUsuarioId, atletaUsuarioNome, atletaUsuarioLado)
          : {}
      )
    }));

    atualizarParametrosUrl(idGrupo);
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
      nomeGrupo: anterior.nomeGrupo,
      dataPartida: anterior.dataPartida,
      ...(
        atletaUsuarioId
          ? obterCamposAtletaUsuarioPrimeiraDupla(atletaUsuarioId, atletaUsuarioNome, atletaUsuarioLado)
          : {}
      )
    }));
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();

    setErro('');
    setFeedbackPendencias([]);

    if (formulario.placarDuplaA === '' || formulario.placarDuplaB === '') {
      setErro('Informe os pontos das duas duplas.');
      return;
    }

    setSalvando(true);

    const dados = {
      competicaoId: null,
      grupoId: grupoSelecionado?.id || null,
      nomeGrupo: grupoSelecionado ? null : formulario.nomeGrupo.trim() || "Partidas Avulsas",
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
        title: 'Partida registrada',
        message: pendenciasSemContato.length > 0
          ? 'Partida registrada com sucesso. Existem atletas pendentes sem e-mail para completar depois.'
          : 'Partida registrada com sucesso.',
        autoClose: false,
        onClose: () => {
          navegar('/');
        }
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
              <option value="">Selecione um grupo</option>
              {grupos.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {grupo.nome}
                </option>
              ))}
            </select>
          </label>

          {!grupoId && (
            <label className="campo-largo">
              Nome do grupo
              <input
                type="text"
                value={formulario.nomeGrupo}
                onChange={(evento) => atualizarCampo('nomeGrupo', evento.target.value)}
                placeholder="Ex.: Grupo da Praia de domingo"
                required
              />
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
              value={formulario.dataPartida}
              onChange={(evento) => atualizarCampo('dataPartida', evento.target.value)}
            />
          </label>

          {erro && <p className="texto-erro campo-largo">{erro}</p>}

          {feedbackPendencias.length > 0 && (
            <div className="campo-largo texto-ajuda">
              {feedbackPendencias.map((pendencia) => (
                <p key={pendencia.atletaId}>{pendencia.nomeAtleta}: contato pendente.</p>
              ))}
            </div>
          )}

          <div className="acoes-formulario">
            <button type="submit" className="botao-primario botao-compacto" disabled={!podeSalvar}>
              {salvando ? 'Salvando...' : 'Registrar partida'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}