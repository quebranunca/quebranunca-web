import { useEffect, useState } from 'react';
import { ConfirmarDuplicidadePartidaModal } from '../components/partidas/ConfirmarDuplicidadePartidaModal';
import { gruposServico } from '../services/gruposServico';
import { partidasServico } from '../services/partidasServico';
import { criarPayloadVerificacaoDuplicidadePartida } from '../utils/partidas';

const estadoInicial = {
  grupoId: '',
  duplaAAtleta1Nome: '',
  duplaAAtleta2Nome: '',
  duplaBAtleta1Nome: '',
  duplaBAtleta2Nome: '',
  placarDuplaA: '',
  placarDuplaB: '',
  dataPartida: ''
};

export function PaginaRegistrarPartidas() {
  const [formulario, setFormulario] = useState(estadoInicial);
  const [grupos, setGrupos] = useState([]);
  const [carregandoGrupos, setCarregandoGrupos] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [duplicidade, setDuplicidade] = useState(null);
  const [payloadPendente, setPayloadPendente] = useState(null);

  useEffect(() => {
    async function carregarGrupos() {
      setCarregandoGrupos(true);

      try {
        const resposta = await gruposServico.listar();
        setGrupos(resposta || []);
      } catch (error) {
        setErro('Erro ao carregar grupos.');
      } finally {
        setCarregandoGrupos(false);
      }
    }

    carregarGrupos();
  }, []);

  function atualizarCampo(campo, valor) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor
    }));
  }

  function validarFormulario() {
    if (!formulario.duplaAAtleta1Nome.trim() ||
      !formulario.duplaAAtleta2Nome.trim() ||
      !formulario.duplaBAtleta1Nome.trim() ||
      !formulario.duplaBAtleta2Nome.trim()) {
      setErro('Informe o nome dos 4 atletas.');
      return false;
    }

    if (formulario.placarDuplaA === '' || formulario.placarDuplaB === '') {
      setErro('Informe os pontos das duas duplas.');
      return false;
    }

    return true;
  }

  function criarPayload(permitirDuplicidade = false) {
    return {
      competicaoId: null,
      grupoId: formulario.grupoId || null,
      nomeGrupo: null,
      categoriaCompeticaoId: null,
      duplaAId: null,
      duplaBId: null,

      duplaAAtleta1Id: null,
      duplaAAtleta1Nome: formulario.duplaAAtleta1Nome.trim(),
      duplaAAtleta2Id: null,
      duplaAAtleta2Nome: formulario.duplaAAtleta2Nome.trim(),

      duplaBAtleta1Id: null,
      duplaBAtleta1Nome: formulario.duplaBAtleta1Nome.trim(),
      duplaBAtleta2Id: null,
      duplaBAtleta2Nome: formulario.duplaBAtleta2Nome.trim(),

      faseCampeonato: null,
      status: 2,
      placarDuplaA: Number(formulario.placarDuplaA),
      placarDuplaB: Number(formulario.placarDuplaB),
      dataPartida: formulario.dataPartida
        ? new Date(formulario.dataPartida).toISOString()
        : null,
      observacoes: null,
      permitirDuplicidade
    };
  }

  async function salvarPartida(payload) {
    try {
      setSalvando(true);

      await partidasServico.criar(payload);

      setFormulario(estadoInicial);
      setDuplicidade(null);
      setPayloadPendente(null);
    } catch (error) {
      setErro('Erro ao registrar partida.');
    } finally {
      setSalvando(false);
    }
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErro('');

    if (!validarFormulario()) {
      return;
    }

    const payload = criarPayload();

    try {
      setSalvando(true);
      const verificacao = await partidasServico.verificarDuplicidade(criarPayloadVerificacaoDuplicidadePartida(payload));

      if (verificacao?.existeDuplicidade) {
        setDuplicidade(verificacao);
        setPayloadPendente(payload);
        setSalvando(false);
        return;
      }

      await salvarPartida(payload);
    } catch (error) {
      setErro('Erro ao verificar duplicidade da partida.');
      setSalvando(false);
    }
  }

  function cancelarDuplicidade() {
    setDuplicidade(null);
    setPayloadPendente(null);
  }

  function confirmarDuplicidade() {
    if (payloadPendente) {
      salvarPartida({ ...payloadPendente, permitirDuplicidade: true });
    }
  }

  return (
    <section className="pagina">
      <form className="formulario-grid formulario-partida" onSubmit={aoSubmeter}>
        {erro && <p className="campo-largo texto-erro">{erro}</p>}

        <label>
          Grupo
          <select
            value={formulario.grupoId}
            onChange={(e) => atualizarCampo('grupoId', e.target.value)}
            disabled={carregandoGrupos}
          >
            <option value="">
              {carregandoGrupos ? 'Carregando grupos...' : 'Selecione um grupo'}
            </option>

            {grupos.map((grupo) => (
              <option key={grupo.id} value={grupo.id}>
                {grupo.nome}
              </option>
            ))}
          </select>
        </label>

        <section className="campo-largo secao-dupla-partida">
          <strong>Dupla 1</strong>

          <label>
            Atleta 1
            <input
              type="text"
              value={formulario.duplaAAtleta1Nome}
              onChange={(e) => atualizarCampo('duplaAAtleta1Nome', e.target.value)}
              required
            />
          </label>

          <label>
            Atleta 2
            <input
              type="text"
              value={formulario.duplaAAtleta2Nome}
              onChange={(e) => atualizarCampo('duplaAAtleta2Nome', e.target.value)}
              required
            />
          </label>

          <label>
            Pontos
            <input
              type="number"
              min="0"
              value={formulario.placarDuplaA}
              onChange={(e) => atualizarCampo('placarDuplaA', e.target.value)}
              required
            />
          </label>
        </section>

        <section className="campo-largo secao-dupla-partida">
          <strong>Dupla 2</strong>

          <label>
            Atleta 1
            <input
              type="text"
              value={formulario.duplaBAtleta1Nome}
              onChange={(e) => atualizarCampo('duplaBAtleta1Nome', e.target.value)}
              required
            />
          </label>

          <label>
            Atleta 2
            <input
              type="text"
              value={formulario.duplaBAtleta2Nome}
              onChange={(e) => atualizarCampo('duplaBAtleta2Nome', e.target.value)}
              required
            />
          </label>

          <label>
            Pontos
            <input
              type="number"
              min="0"
              value={formulario.placarDuplaB}
              onChange={(e) => atualizarCampo('placarDuplaB', e.target.value)}
              required
            />
          </label>
        </section>

        <label>
          Data da partida
          <input
            type="datetime-local"
            value={formulario.dataPartida}
            onChange={(e) => atualizarCampo('dataPartida', e.target.value)}
          />
        </label>

        <div className="acoes-formulario">
          <button type="submit" className="botao-primario" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Registrar partida'}
          </button>
        </div>
      </form>

      {duplicidade && (
        <ConfirmarDuplicidadePartidaModal
          mensagem={`${duplicidade.mensagem || 'Já existe uma partida registrada hoje com os mesmos atletas e o mesmo placar.'} Deseja salvar mesmo assim?`}
          salvando={salvando}
          onCancelar={cancelarDuplicidade}
          onConfirmar={confirmarDuplicidade}
        />
      )}
    </section>
  );
}
