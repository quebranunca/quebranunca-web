import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import { AppHero } from '../components/AppHero';
import { RegistrarPartidaNovoContainer } from '../containers/partidas/RegistrarPartidaNovoContainer';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { useNotification } from '../contexts/NotificationContext';
import { partidasServico } from '../services/partidasServico';
import { extrairMensagemErro } from '../utils/erros';
import {
  normalizarOrigemInterna,
  obterRotaDetalhePartida
} from '../utils/partidaRotas';
import '../components/partidas/registrar-partida-novo.css';

const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function obterOrigemEstado(location) {
  return normalizarOrigemInterna(
    location.state?.origem ||
    location.state?.from ||
    location.state?.returnTo
  );
}

function obterStatusErro(error) {
  return error?.response?.status || 0;
}

function obterMensagemCarregamento(error) {
  const status = obterStatusErro(error);

  if (status === 400) {
    return 'O identificador da partida é inválido.';
  }

  if (status === 403) {
    return 'Você não possui permissão para editar esta partida.';
  }

  if (status === 404) {
    return 'Partida não encontrada.';
  }

  return extrairMensagemErro(error) || 'Não foi possível carregar esta partida.';
}

function obterMensagemSalvamento(error) {
  const status = obterStatusErro(error);

  if (status === 403) {
    return 'Você não possui permissão para editar esta partida.';
  }

  if (status === 404) {
    return 'Partida não encontrada.';
  }

  return extrairMensagemErro(error) || 'Não foi possível salvar as alterações.';
}

function obterPermissoes(partida) {
  return partida?.permissoes || {
    podeEditar: Boolean(partida?.podeEditar)
  };
}

export function PaginaEditarPartida() {
  const { partidaId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario } = useAutenticacao();
  const { showNotification } = useNotification();
  const [partida, setPartida] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [statusErro, setStatusErro] = useState(0);
  const [erroEdicao, setErroEdicao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [possuiAlteracoes, setPossuiAlteracoes] = useState(false);
  const [confirmarSaida, setConfirmarSaida] = useState(false);

  const rotaDetalhe = obterRotaDetalhePartida(partidaId);
  const origem = useMemo(() => obterOrigemEstado(location), [location]);
  const destinoVoltar = origem || rotaDetalhe;
  const idValido = Boolean(partidaId && GUID_REGEX.test(partidaId));
  const permissoes = useMemo(() => obterPermissoes(partida), [partida]);

  async function carregarPartida() {
    if (!idValido) {
      setCarregando(false);
      setPartida(null);
      setStatusErro(400);
      setErro('O identificador da partida é inválido.');
      return;
    }

    setCarregando(true);
    setErro('');
    setStatusErro(0);

    try {
      const dados = await partidasServico.obterPorId(partidaId);
      setPartida(dados);

      const podeEditar = obterPermissoes(dados).podeEditar;
      if (!podeEditar) {
        setStatusErro(403);
        setErro('Você não possui permissão para editar esta partida.');
      }
    } catch (error) {
      setPartida(null);
      setStatusErro(obterStatusErro(error));
      setErro(obterMensagemCarregamento(error));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarPartida();
  }, [partidaId]);

  useEffect(() => {
    if (!possuiAlteracoes) {
      return undefined;
    }

    function confirmarFechamento(evento) {
      evento.preventDefault();
      evento.returnValue = '';
    }

    window.addEventListener('beforeunload', confirmarFechamento);
    return () => window.removeEventListener('beforeunload', confirmarFechamento);
  }, [possuiAlteracoes]);

  function voltar() {
    if (salvando) {
      return;
    }

    if (possuiAlteracoes) {
      setConfirmarSaida(true);
      return;
    }

    navigate(destinoVoltar, { replace: true });
  }

  function confirmarVoltarSemSalvar() {
    setConfirmarSaida(false);
    setPossuiAlteracoes(false);
    navigate(destinoVoltar, { replace: true });
  }

  async function salvarEdicao(dados) {
    setSalvando(true);
    setErroEdicao('');

    try {
      const partidaAtualizada = await partidasServico.atualizarBasica(partidaId, dados);
      setPartida(partidaAtualizada);
      setPossuiAlteracoes(false);
      showNotification({
        type: 'success',
        title: 'Partida atualizada',
        message: 'As alterações foram salvas.'
      });
      navigate(obterRotaDetalhePartida(partidaAtualizada), { replace: true, state: { partidaAtualizada } });
      return partidaAtualizada;
    } catch (error) {
      const mensagem = obterMensagemSalvamento(error);
      setErroEdicao(mensagem);
      showNotification({
        type: 'error',
        title: 'Erro ao editar partida',
        message: mensagem
      });
      throw error;
    } finally {
      setSalvando(false);
    }
  }

  const formularioDisponivel = !carregando && partida && permissoes.podeEditar && !erro;

  return (
    <section className="pagina registrar-partida-pagina editar-partida-pagina">
      <AppHero
        title="Editar partida"
        subtitle="Ajuste atletas, grupo e resultado permitidos pela edição básica."
        accountUser={usuario}
        autenticado={Boolean(usuario)}
        showBackButton
        onBack={voltar}
        variant="page"
      />

      <div className="registrar-partida-pagina__conteudo">
        {carregando && (
          <article className="editar-partida-estado" aria-live="polite">
            <span className="minhas-partidas-loading" />
            <strong>Carregando partida...</strong>
          </article>
        )}

        {!carregando && erro && (
          <article className="editar-partida-estado erro" role="alert">
            <FaExclamationTriangle aria-hidden="true" />
            <strong>{erro}</strong>
            <div className="editar-partida-estado__acoes">
              {statusErro !== 400 && statusErro !== 403 && (
                <button type="button" className="botao-primario" onClick={carregarPartida}>
                  Tentar novamente
                </button>
              )}
              <button type="button" className="botao-secundario" onClick={() => navigate(rotaDetalhe, { replace: true })}>
                <FaArrowLeft aria-hidden="true" />
                Ver detalhes
              </button>
            </div>
          </article>
        )}

        {formularioDisponivel && (
          <RegistrarPartidaNovoContainer
            modo="edicao"
            modoExibicao="pagina"
            partidaInicial={partida}
            salvandoExterno={salvando}
            erroExterno={erroEdicao}
            onSalvarEdicao={salvarEdicao}
            onFechar={voltar}
            onAlteracaoPendente={setPossuiAlteracoes}
          />
        )}
      </div>

      {confirmarSaida && (
        <div className="modal-backdrop editar-partida-confirmacao-backdrop" role="presentation">
          <article className="modal-conteudo editar-partida-confirmacao" role="dialog" aria-modal="true" aria-label="Sair sem salvar">
            <h3>Sair sem salvar?</h3>
            <p>As alterações não salvas serão perdidas.</p>
            <div className="editar-partida-confirmacao__acoes">
              <button type="button" className="botao-secundario" onClick={() => setConfirmarSaida(false)}>
                Continuar editando
              </button>
              <button type="button" className="botao-perigo" onClick={confirmarVoltarSemSalvar}>
                Sair sem salvar
              </button>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
