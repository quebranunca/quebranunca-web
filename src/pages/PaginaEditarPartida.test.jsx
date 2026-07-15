import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { PaginaEditarPartida } from './PaginaEditarPartida';
import { RotaProtegida } from '../routes/RotaProtegida';
import { partidasServico } from '../services/partidasServico';

const PARTIDA_ID = '11111111-1111-4111-8111-111111111111';

const mocks = vi.hoisted(() => ({
  showNotification: vi.fn(),
  ultimaPropsContainer: null
}));

vi.mock('../hooks/useAutenticacao', () => ({
  useAutenticacao: () => ({
    usuario: {
      id: 'usuario-1',
      nome: 'Admin QN',
      perfil: 1,
      atletaId: null
    }
  })
}));

vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: mocks.showNotification
  })
}));

vi.mock('../services/partidasServico', () => ({
  partidasServico: {
    obterPorId: vi.fn(),
    atualizarBasica: vi.fn()
  }
}));

vi.mock('../containers/partidas/RegistrarPartidaNovoContainer', () => ({
  RegistrarPartidaNovoContainer: (props) => {
    mocks.ultimaPropsContainer = props;
    const partida = props.partidaInicial || {};
    const apenasResultado = partida.tipoRegistroResultado === 'ApenasResultado' ||
      partida.placarDuplaA == null ||
      partida.placarDuplaB == null;

    return (
      <form
        aria-label="Formulário de edição"
        data-testid="editar-container"
        data-modo={props.modo}
        data-modo-exibicao={props.modoExibicao}
        onSubmit={(evento) => {
          evento.preventDefault();
          props.onSalvarEdicao({
            grupoId: partida.grupoId,
            duplaAAtleta1Id: partida.duplaAAtleta1Id,
            duplaAAtleta1Nome: partida.nomeDuplaAAtleta1,
            duplaAAtleta2Id: partida.duplaAAtleta2Id,
            duplaAAtleta2Nome: partida.nomeDuplaAAtleta2,
            duplaBAtleta1Id: partida.duplaBAtleta1Id,
            duplaBAtleta1Nome: partida.nomeDuplaBAtleta1,
            duplaBAtleta2Id: partida.duplaBAtleta2Id,
            duplaBAtleta2Nome: partida.nomeDuplaBAtleta2,
            placarDuplaA: apenasResultado ? null : 19,
            placarDuplaB: apenasResultado ? null : 21,
            duplaVencedora: apenasResultado ? 2 : null,
            tipoRegistroResultado: apenasResultado ? 'ApenasResultado' : 'PlacarDetalhado'
          }).catch(() => {});
        }}
      >
        <label>
          Atleta 1 dupla A
          <input defaultValue={partida.nomeDuplaAAtleta1 || ''} onChange={() => props.onAlteracaoPendente?.(true)} />
        </label>
        <label>
          Atleta 2 dupla A
          <input defaultValue={partida.nomeDuplaAAtleta2 || ''} />
        </label>
        <label>
          Atleta 1 dupla B
          <input defaultValue={partida.nomeDuplaBAtleta1 || ''} />
        </label>
        <label>
          Atleta 2 dupla B
          <input defaultValue={partida.nomeDuplaBAtleta2 || ''} />
        </label>
        <label>
          Grupo
          <input defaultValue={partida.nomeGrupo || 'Partidas avulsas'} />
        </label>
        <label>
          Placar dupla A
          <input defaultValue={partida.placarDuplaA ?? ''} />
        </label>
        <label>
          Placar dupla B
          <input defaultValue={partida.placarDuplaB ?? ''} />
        </label>
        <label>
          Vencedora
          <input defaultValue={String(partida.duplaVencedora || '')} />
        </label>
        {props.erroExterno && <p role="alert">{props.erroExterno}</p>}
        <button type="button" onClick={() => props.onAlteracaoPendente?.(true)}>Alterar</button>
        <button type="button" onClick={props.onFechar}>Cancelar</button>
        <button type="submit" disabled={props.salvandoExterno}>
          {props.salvandoExterno ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>
    );
  }
}));

function LocalizacaoAtual() {
  const location = useLocation();
  return (
    <>
      <span data-testid="rota-atual">{`${location.pathname}${location.search}`}</span>
      <span data-testid="origem-atual">{typeof location.state?.origem === 'string' ? location.state.origem : ''}</span>
    </>
  );
}

function criarPartida(sobrescritas = {}) {
  return {
    id: PARTIDA_ID,
    grupoId: 'grupo-1',
    nomeGrupo: 'Fechadinho de Quinta',
    criadoPorUsuarioId: 'usuario-1',
    nomeCriadoPorUsuario: 'Admin QN',
    duplaAAtleta1Id: 'atleta-a1',
    nomeDuplaAAtleta1: 'Primo',
    duplaAAtleta2Id: 'atleta-a2',
    nomeDuplaAAtleta2: 'Gustavo',
    duplaBAtleta1Id: 'atleta-b1',
    nomeDuplaBAtleta1: 'Rafa',
    duplaBAtleta2Id: 'atleta-b2',
    nomeDuplaBAtleta2: 'Leo',
    placarDuplaA: 18,
    placarDuplaB: 16,
    duplaVencedora: 1,
    tipoRegistroResultado: 'PlacarDetalhado',
    possuiPlacarDetalhado: true,
    permissoes: {
      podeEditar: true
    },
    ...sobrescritas
  };
}

function renderizarPagina(entry = `/app/partidas/${PARTIDA_ID}/editar`) {
  return render(
    <MemoryRouter initialEntries={[entry]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Routes>
        <Route path="/app/partidas/:partidaId/editar" element={<><PaginaEditarPartida /><LocalizacaoAtual /></>} />
        <Route path="/app/partidas/:partidaId" element={<LocalizacaoAtual />} />
        <Route path="/minhas-partidas" element={<LocalizacaoAtual />} />
        <Route path="/partidas/consulta" element={<LocalizacaoAtual />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  partidasServico.obterPorId.mockResolvedValue(criarPartida());
  partidasServico.atualizarBasica.mockResolvedValue(criarPartida({ placarDuplaA: 19, placarDuplaB: 21, duplaVencedora: 2 }));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.ultimaPropsContainer = null;
});

describe('PaginaEditarPartida', () => {
  it('fica atrás de rota protegida quando usada na rota canônica', async () => {
    render(
      <MemoryRouter initialEntries={[`/app/partidas/${PARTIDA_ID}/editar`]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes>
          <Route
            path="/app/partidas/:partidaId/editar"
            element={(
              <RotaProtegida>
                <PaginaEditarPartida />
              </RotaProtegida>
            )}
          />
          <Route path="/login" element={<LocalizacaoAtual />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByTestId('rota-atual')).toHaveTextContent('/login');
    expect(partidasServico.obterPorId).not.toHaveBeenCalled();
  });

  it('carrega a partida e renderiza página sem dialog principal', async () => {
    renderizarPagina();

    expect(screen.getByText('Carregando partida...')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Editar partida' })).toBeInTheDocument();
    expect(screen.getByTestId('editar-container')).toHaveAttribute('data-modo', 'edicao');
    expect(screen.getByTestId('editar-container')).toHaveAttribute('data-modo-exibicao', 'pagina');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('editar-container')).not.toHaveAttribute('aria-modal');
  });

  it('preenche atletas, grupo e placar completo a partir da partida carregada', async () => {
    renderizarPagina();

    expect(await screen.findByDisplayValue('Primo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Gustavo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Rafa')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Leo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Fechadinho de Quinta')).toBeInTheDocument();
    expect(screen.getByDisplayValue('18')).toBeInTheDocument();
    expect(screen.getByDisplayValue('16')).toBeInTheDocument();
  });

  it('preserva modo apenas vencedor sem placar completo', async () => {
    partidasServico.obterPorId.mockResolvedValue(criarPartida({
      placarDuplaA: null,
      placarDuplaB: null,
      duplaVencedora: 2,
      tipoRegistroResultado: 'ApenasResultado',
      possuiPlacarDetalhado: false
    }));

    renderizarPagina();

    expect(await screen.findByLabelText('Vencedora')).toHaveValue('2');
    expect(screen.getByLabelText('Placar dupla A')).toHaveValue('');
    expect(screen.getByLabelText('Placar dupla B')).toHaveValue('');
  });

  it('salva pelo endpoint de edição básica e navega para detalhes', async () => {
    const usuario = userEvent.setup();
    renderizarPagina();

    await usuario.click(await screen.findByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => {
      expect(partidasServico.atualizarBasica).toHaveBeenCalledWith(PARTIDA_ID, expect.objectContaining({
        duplaAAtleta1Nome: 'Primo',
        tipoRegistroResultado: 'PlacarDetalhado'
      }));
    });
    expect(mocks.showNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
    expect(screen.getByTestId('rota-atual')).toHaveTextContent(`/app/partidas/${PARTIDA_ID}`);
  });

  it('desabilita o botão enquanto salva', async () => {
    const usuario = userEvent.setup();
    let resolver;
    partidasServico.atualizarBasica.mockReturnValue(new Promise((resolve) => {
      resolver = resolve;
    }));
    renderizarPagina();

    await usuario.click(await screen.findByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByRole('button', { name: 'Salvando...' })).toBeDisabled();
    resolver(criarPartida());
  });

  it('exibe erro de validação retornado pelo backend', async () => {
    const usuario = userEvent.setup();
    partidasServico.atualizarBasica.mockRejectedValue({
      response: {
        status: 400,
        data: { erro: 'A partida não pode terminar empatada.' }
      }
    });
    renderizarPagina();

    await usuario.click(await screen.findByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('A partida não pode terminar empatada.');
  });

  it('trata 403 e 404 no carregamento', async () => {
    partidasServico.obterPorId.mockRejectedValueOnce({ response: { status: 403, data: { erro: 'Negado.' } } });
    renderizarPagina();
    expect(await screen.findByRole('alert')).toHaveTextContent('Você não possui permissão');

    cleanup();
    partidasServico.obterPorId.mockRejectedValueOnce({ response: { status: 404, data: { erro: 'Sumiu.' } } });
    renderizarPagina();
    expect(await screen.findByRole('alert')).toHaveTextContent('Partida não encontrada.');
  });

  it('trata ID inválido sem chamar a API', async () => {
    renderizarPagina('/app/partidas/id-invalido/editar');

    expect(await screen.findByRole('alert')).toHaveTextContent('identificador da partida é inválido');
    expect(partidasServico.obterPorId).not.toHaveBeenCalled();
  });

  it('volta para origem interna e usa detalhes como fallback', async () => {
    const usuario = userEvent.setup();
    renderizarPagina({
      pathname: `/app/partidas/${PARTIDA_ID}/editar`,
      state: { origem: '/minhas-partidas?filtro=registradas' }
    });

    await usuario.click(await screen.findByRole('button', { name: /Voltar/i }));
    expect(screen.getByTestId('rota-atual')).toHaveTextContent('/minhas-partidas?filtro=registradas');

    cleanup();
    renderizarPagina();
    await usuario.click(await screen.findByRole('button', { name: /Voltar/i }));
    expect(screen.getByTestId('rota-atual')).toHaveTextContent(`/app/partidas/${PARTIDA_ID}`);
  });

  it('confirma saída quando há alterações não salvas', async () => {
    const usuario = userEvent.setup();
    renderizarPagina();

    await usuario.click(await screen.findByRole('button', { name: 'Alterar' }));
    await usuario.click(screen.getByRole('button', { name: /Voltar/i }));

    const dialog = screen.getByRole('dialog', { name: 'Sair sem salvar' });
    expect(dialog).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Sair sem salvar' }));
    expect(screen.getByTestId('rota-atual')).toHaveTextContent(`/app/partidas/${PARTIDA_ID}`);
  });
});
