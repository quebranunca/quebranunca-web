import { useEffect, useMemo, useState } from 'react';
import {
  FaCamera,
  FaChartLine,
  FaCog,
  FaEnvelope,
  FaFire,
  FaInstagram,
  FaMapMarkerAlt,
  FaPhone,
  FaRegUser,
  FaSave,
  FaSignOutAlt,
  FaTrashAlt,
  FaTrophy,
  FaUserEdit
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { atletasServico } from '../services/atletasServico';
import { dashboardServico } from '../services/dashboardServico';
import { usuariosServico } from '../services/usuariosServico';
import { useNotification } from '../contexts/NotificationContext';
import { extrairMensagemErro } from '../utils/erros';
import {
  formatarCpfParaInput,
  formatarData,
  formatarTelefoneParaInput,
  limparCpf,
  limparTelefone,
  normalizarDataParaApi,
  paraInputData,
  validarCpf
} from '../utils/formatacao';
import { opcoesNivelAtleta } from '../utils/niveisAtleta';
import { PERFIS_USUARIO } from '../utils/perfis';
import { nomeEstadoAcesso } from '../utils/acesso';
import { buscarCidadesPorEstado, estadosBrasil, normalizarEstadoParaUf } from '../utils/localidadesBrasil';
import { rolarParaTopo } from '../utils/rolagem';

const estadoInicialAtleta = {
  nome: '',
  apelido: '',
  telefone: '',
  email: '',
  instagram: '',
  cpf: '',
  bairro: '',
  cidade: '',
  estado: '',
  cadastroPendente: false,
  nivel: '',
  lado: '3',
  dataNascimento: ''
};

const abasPerfil = [
  { id: 'resumo', rotulo: 'Resumo', icone: FaChartLine },
  { id: 'perfil', rotulo: 'Perfil', icone: FaRegUser },
  { id: 'contato', rotulo: 'Contato', icone: FaPhone },
  { id: 'configuracoes', rotulo: 'Configurações', icone: FaCog }
];

const mensagemErroAcessoOrganizador =
  'O organizador só pode alterar atletas inscritos em competições vinculadas ao próprio usuário.';
const dataMinimaNascimento = '1900-01-01';

function obterDataMaximaNascimento() {
  return new Date().toISOString().slice(0, 10);
}

function validarDataNascimento(dataNascimento) {
  if (!dataNascimento) {
    return null;
  }

  const dataNormalizada = dataNascimento.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataNormalizada)) {
    return 'Informe uma data de nascimento válida.';
  }

  const [ano, mes, dia] = dataNormalizada.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  const dataValida =
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia;

  if (!dataValida) {
    return 'Informe uma data de nascimento válida.';
  }

  if (dataNormalizada < dataMinimaNascimento) {
    return 'Data de nascimento inválida.';
  }

  if (dataNormalizada > obterDataMaximaNascimento()) {
    return 'Data de nascimento não pode ser futura.';
  }

  return null;
}

function criarEstadoInicialAtleta(usuario) {
  return {
    ...estadoInicialAtleta,
    nome: usuario?.nome || '',
    email: usuario?.email || ''
  };
}

function obterMensagemErroPerfil(error) {
  const mensagem = extrairMensagemErro(error);
  if (mensagem === mensagemErroAcessoOrganizador) {
    return 'Não foi possível atualizar o atleta vinculado por este perfil.';
  }

  return mensagem;
}

function criarResumoAtleta(atleta) {
  if (!atleta) {
    return null;
  }

  return {
    id: atleta.id,
    nome: atleta.nome,
    apelido: atleta.apelido,
    telefone: formatarTelefoneParaInput(atleta.telefone),
    email: atleta.email,
    instagram: atleta.instagram,
    cpf: formatarCpfParaInput(atleta.cpf),
    cadastroPendente: Boolean(atleta.cadastroPendente),
    bairro: atleta.bairro,
    cidade: atleta.cidade,
    estado: atleta.estado,
    nivel: atleta.nivel
  };
}

function obterNomeCompletoMeuPerfil(atleta, usuarioBase, perfilUsuario) {
  if (Number(perfilUsuario) === PERFIS_USUARIO.atleta) {
    return atleta?.nome || usuarioBase?.nome || '';
  }

  return atleta?.nome || '';
}

function obterIniciais(nome) {
  const partes = String(nome || 'QNF')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!partes.length) {
    return 'QNF';
  }

  return partes
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();
}

function obterRotuloNivel(valor) {
  const opcao = opcoesNivelAtleta.find((item) => String(item.valor) === String(valor));
  return opcao?.rotulo || 'Nível a definir';
}

function obterRotuloLado(valor) {
  const lados = {
    1: 'Direito',
    2: 'Esquerdo',
    3: 'Ambos'
  };

  return lados[String(valor)] || 'Ambos';
}

function obterLocalizacaoCompacta(atleta) {
  const partes = [atleta.estado, atleta.cidade, atleta.bairro]
    .map((valor) => String(valor || '').trim())
    .filter(Boolean);

  return partes.length ? partes.join(' • ') : 'Localização a definir';
}

function obterStatusPerfil(usuarioDetalhe, formularioAtleta) {
  if (!usuarioDetalhe?.atletaId) {
    return { rotulo: 'Sem conta esportiva', classe: 'sem-conta' };
  }

  if (formularioAtleta.cadastroPendente) {
    return { rotulo: 'Pendente', classe: 'pendente' };
  }

  return { rotulo: 'Ativo', classe: 'ativo' };
}

function obterMediaPontos(resumo) {
  if (!resumo?.totalPartidas) {
    return '0.0';
  }

  return (Number(resumo.saldoPontos || 0) / Number(resumo.totalPartidas)).toFixed(1);
}

function obterMelhorSequencia(evolucao) {
  if (!Array.isArray(evolucao) || !evolucao.length) {
    return 0;
  }

  return evolucao.reduce((melhor, item) => Math.max(melhor, Number(item.vitorias || 0)), 0);
}

function CampoEdicao({ label, children, largo = false }) {
  return (
    <label className={largo ? 'perfil-campo-edicao perfil-campo-largo' : 'perfil-campo-edicao'}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function InfoItem({ rotulo, valor, icone: Icone }) {
  return (
    <article className="perfil-info-item">
      {Icone && <Icone aria-hidden="true" />}
      <div>
        <span>{rotulo}</span>
        <strong>{valor || 'Não informado'}</strong>
      </div>
    </article>
  );
}

export function PaginaMeuPerfil() {
  const {
    usuario,
    atualizarUsuarioLocal,
    recarregarUsuario,
    concluirPrimeiroAcesso,
    sair,
    primeiroAcessoPendente,
    estadoAcesso
  } = useAutenticacao();

  const navigate = useNavigate();
  const { showNotification, closeNotification } = useNotification();
  const [usuarioDetalhe, setUsuarioDetalhe] = useState(null);
  const [formularioUsuario, setFormularioUsuario] = useState({ nome: '' });
  const [formularioAtleta, setFormularioAtleta] = useState(estadoInicialAtleta);
  const [dashboardAtleta, setDashboardAtleta] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('resumo');
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvandoUsuario, setSalvandoUsuario] = useState(false);
  const [salvandoAtleta, setSalvandoAtleta] = useState(false);
  const [excluindoPerfil, setExcluindoPerfil] = useState(false);
  const [cidadesEstado, setCidadesEstado] = useState([]);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const emailUsuarioPerfil = usuarioDetalhe?.email || usuario?.email || '';

  useEffect(() => {
    carregarPerfil();
  }, [usuario?.id]);

  useEffect(() => {
    if (!formularioAtleta.estado) {
      setCidadesEstado([]);
      return;
    }

    let ativo = true;
    setCarregandoCidades(true);

    buscarCidadesPorEstado(formularioAtleta.estado)
      .then((cidades) => {
        if (ativo) {
          setCidadesEstado(cidades);
        }
      })
      .catch(() => {
        if (ativo) {
          setCidadesEstado([]);
        }
      })
      .finally(() => {
        if (ativo) {
          setCarregandoCidades(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, [formularioAtleta.estado]);

  async function carregarPerfil() {
    setCarregando(true);
    setErro('');
    setMensagem('');
    setDashboardAtleta(null);

    try {
      if (!usuario) {
        setUsuarioDetalhe(null);
        setFormularioAtleta(estadoInicialAtleta);
        return;
      }

      const dadosUsuario = await recarregarUsuario();
      setFormularioUsuario({ nome: dadosUsuario.nome || '' });

      let proximoUsuarioDetalhe = dadosUsuario;

      if (dadosUsuario.atletaId) {
        const atleta = await atletasServico.obterMeu();
        if (atleta) {
          preencherFormularioAtleta(atleta, dadosUsuario);
          proximoUsuarioDetalhe = {
            ...dadosUsuario,
            atleta: criarResumoAtleta(atleta)
          };
        } else {
          proximoUsuarioDetalhe = {
            ...dadosUsuario,
            atletaId: null,
            atleta: null
          };

          atualizarUsuarioLocal(proximoUsuarioDetalhe);
          setFormularioAtleta(criarEstadoInicialAtleta(dadosUsuario));
          setErro('Atleta vinculado não encontrado. Você pode criar novamente seu atleta pelo perfil.');
        }
      } else {
        setFormularioAtleta(criarEstadoInicialAtleta(dadosUsuario));
      }

      setUsuarioDetalhe(proximoUsuarioDetalhe);
      setEditandoPerfil(false);

      if (proximoUsuarioDetalhe.atletaId) {
        try {
          const dashboard = await dashboardServico.obterDashboardAtleta();
          setDashboardAtleta(dashboard);
        } catch {
          setDashboardAtleta(null);
        }
      }
    } catch (error) {
      setErro(extrairMensagemErro(error));
      showNotification({
        type: 'error',
        title: 'Erro ao carregar perfil',
        message: extrairMensagemErro(error)
      });
    } finally {
      setCarregando(false);
    }
  }

  function preencherFormularioAtleta(atleta, usuarioBaseForcado) {
    const usuarioBase = usuarioBaseForcado || usuarioDetalhe || usuario;
    const perfilUsuario = usuarioBase?.perfil;

    setFormularioAtleta({
      nome: obterNomeCompletoMeuPerfil(atleta, usuarioBase, perfilUsuario),
      apelido: atleta.apelido || '',
      telefone: formatarTelefoneParaInput(atleta.telefone),
      email: emailUsuarioPerfil || usuarioBase?.email || '',
      instagram: atleta.instagram || '',
      cpf: formatarCpfParaInput(atleta.cpf),
      bairro: atleta.bairro || '',
      cidade: atleta.cidade || '',
      estado: normalizarEstadoParaUf(atleta.estado || ''),
      cadastroPendente: Boolean(atleta.cadastroPendente),
      nivel: atleta.nivel ? String(atleta.nivel) : '',
      lado: String(atleta.lado || 3),
      dataNascimento: paraInputData(atleta.dataNascimento)
    });
  }

  function atualizarCampoAtleta(campo, valor) {
    if (campo === 'telefone') {
      setFormularioAtleta((anterior) => ({ ...anterior, telefone: formatarTelefoneParaInput(valor) }));
      return;
    }

    if (campo === 'cpf') {
      setFormularioAtleta((anterior) => ({ ...anterior, cpf: formatarCpfParaInput(valor) }));
      return;
    }

    if (campo === 'estado') {
      setFormularioAtleta((anterior) => ({
        ...anterior,
        estado: valor,
        cidade: valor === anterior.estado ? anterior.cidade : ''
      }));
      return;
    }

    setFormularioAtleta((anterior) => ({ ...anterior, [campo]: valor }));
  }

  async function salvarUsuario(evento) {
    evento.preventDefault();

    if (Number(usuarioDetalhe?.perfil || usuario?.perfil) !== PERFIS_USUARIO.administrador) {
      return;
    }

    setSalvandoUsuario(true);
    setErro('');
    setMensagem('');

    try {
      const usuarioAtualizado = await usuariosServico.atualizarMeu({
        nome: formularioUsuario.nome
      });

      setUsuarioDetalhe((anterior) => ({
        ...(anterior || usuarioAtualizado),
        ...usuarioAtualizado,
        atleta: anterior?.atleta || usuarioAtualizado.atleta || null
      }));
      atualizarUsuarioLocal(usuarioAtualizado);

      if (primeiroAcessoPendente) {
        concluirPrimeiroAcesso();
      }

      showNotification({
        type: 'success',
        title: 'Acesso atualizado',
        message: 'Dados do acesso atualizados com sucesso.'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erro ao salvar acesso',
        message: extrairMensagemErro(error)
      });
    } finally {
      setSalvandoUsuario(false);
    }
  }

  function finalizarPrimeiroAcesso() {
    concluirPrimeiroAcesso();
    setMensagem('Primeiro acesso concluído com sucesso.');
    setErro('');
  }

  async function salvarAtleta(evento) {
    evento?.preventDefault();
    const cpfLimpo = limparCpf(formularioAtleta.cpf);
    if (cpfLimpo && !validarCpf(cpfLimpo)) {
      showNotification({
        type: 'warning',
        title: 'CPF inválido',
        message: 'Informe um CPF válido para continuar.'
      });
      return;
    }

    const erroDataNascimento = validarDataNascimento(formularioAtleta.dataNascimento);
    if (erroDataNascimento) {
      showNotification({
        type: 'warning',
        title: 'Data inválida',
        message: erroDataNascimento
      });
      return;
    }

    setSalvandoAtleta(true);
    setErro('');
    setMensagem('');

    const dados = {
      nome: formularioAtleta.nome,
      apelido: formularioAtleta.apelido.trim() || null,
      telefone: limparTelefone(formularioAtleta.telefone) || null,
      email: emailUsuarioPerfil || null,
      instagram: formularioAtleta.instagram.trim() || null,
      cpf: cpfLimpo || null,
      bairro: formularioAtleta.bairro.trim() || null,
      cidade: formularioAtleta.cidade.trim() || null,
      estado: normalizarEstadoParaUf(formularioAtleta.estado.trim()) || null,
      cadastroPendente: Boolean(formularioAtleta.cadastroPendente),
      nivel: formularioAtleta.nivel ? Number(formularioAtleta.nivel) : null,
      lado: Number(formularioAtleta.lado),
      dataNascimento: normalizarDataParaApi(formularioAtleta.dataNascimento)
    };

    try {
      const atleta = await atletasServico.salvarMeu(dados);
      const possuiAtletaAnterior = Boolean(usuarioDetalhe?.atletaId);
      const usuarioAtualEhAtleta = Number(usuarioDetalhe?.perfil || usuario?.perfil) === PERFIS_USUARIO.atleta;
      const proximoUsuario = {
        ...(usuarioDetalhe || usuario),
        nome: usuarioAtualEhAtleta ? atleta.nome : (usuarioDetalhe || usuario)?.nome,
        atletaId: atleta.id,
        atleta: criarResumoAtleta(atleta)
      };

      preencherFormularioAtleta(atleta, proximoUsuario);
      setUsuarioDetalhe(proximoUsuario);
      atualizarUsuarioLocal(proximoUsuario);
      setEditandoPerfil(false);
      rolarParaTopo();

      try {
        const dashboard = await dashboardServico.obterDashboardAtleta();
        setDashboardAtleta(dashboard);
      } catch {
        setDashboardAtleta(null);
      }

      if (primeiroAcessoPendente) {
        concluirPrimeiroAcesso();
      }

      showNotification({
        type: 'success',
        title: possuiAtletaAnterior ? 'Atleta atualizado' : 'Atleta criado',
        message: possuiAtletaAnterior
          ? 'Dados do atleta atualizados com sucesso.'
          : 'Atleta criado com sucesso.'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erro ao salvar atleta',
        message: obterMensagemErroPerfil(error)
      });
    } finally {
      setSalvandoAtleta(false);
    }
  }

  async function excluirMeuPerfil() {
    setExcluindoPerfil(true);
    setErro('');
    setMensagem('');

    try {
      await usuariosServico.excluirMeuPerfil();
      sair();
      sessionStorage.clear();
      showNotification({
        type: 'success',
        title: 'Conta excluída',
        message: 'Sua conta foi excluída com sucesso.',
        autoClose: false,
        onClose: () => navigate('/login', { replace: true })
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Não foi possível excluir a conta',
        message: extrairMensagemErro(error)
      });
    } finally {
      setExcluindoPerfil(false);
    }
  }

  function confirmarExclusaoMeuPerfil() {
    showNotification({
      type: 'warning',
      title: 'Excluir minha conta?',
      message: 'Essa ação vai desativar sua conta, remover seus dados pessoais e encerrar seu acesso à plataforma. Partidas e históricos compartilhados serão mantidos para preservar os dados dos outros atletas.',
      autoClose: false,
      actions: (
        <>
          <button type="button" className="botao-secundario" onClick={closeNotification}>
            Cancelar
          </button>
          <button
            type="button"
            className="botao-perigo"
            onClick={() => {
              closeNotification();
              excluirMeuPerfil();
            }}
          >
            Sim, excluir minha conta
          </button>
        </>
      )
    });
  }

  function sairDoPerfil() {
    sair();
    navigate('/', { replace: true });
  }

  const usuarioEhAtleta = Number(usuarioDetalhe?.perfil || usuario?.perfil) === PERFIS_USUARIO.atleta;
  const usuarioEhAdministrador = Number(usuarioDetalhe?.perfil || usuario?.perfil) === PERFIS_USUARIO.administrador;
  const possuiAtleta = Boolean(usuarioDetalhe?.atletaId);
  const statusPerfil = obterStatusPerfil(usuarioDetalhe, formularioAtleta);
  const resumoDashboard = dashboardAtleta?.resumo || {};
  const perfilDashboard = dashboardAtleta?.perfil || {};
  const ultimasPartidas = Array.isArray(dashboardAtleta?.ultimasPartidas) ? dashboardAtleta.ultimasPartidas : [];
  const localizacaoCompacta = obterLocalizacaoCompacta(formularioAtleta);
  const nomePerfil = formularioAtleta.nome || usuarioDetalhe?.nome || usuario?.nome || 'Atleta QNF';
  const apelidoPerfil = formularioAtleta.apelido || perfilDashboard.apelido || 'Apelido a definir';
  const aproveitamento = Number(resumoDashboard.aproveitamento ?? perfilDashboard.aproveitamento ?? 0);
  const melhorSequencia = obterMelhorSequencia(dashboardAtleta?.evolucao);

  const metricasHero = useMemo(() => ([
    { rotulo: 'Ranking', valor: perfilDashboard.posicaoRanking ? `#${perfilDashboard.posicaoRanking}` : '-' },
    { rotulo: 'Pontos', valor: resumoDashboard.saldoPontos ?? 0 },
    { rotulo: 'Jogos', valor: resumoDashboard.totalPartidas ?? 0 },
    { rotulo: 'Vitórias', valor: resumoDashboard.vitorias ?? 0 },
    { rotulo: 'Derrotas', valor: resumoDashboard.derrotas ?? 0 }
  ]), [
    perfilDashboard.posicaoRanking,
    resumoDashboard.derrotas,
    resumoDashboard.saldoPontos,
    resumoDashboard.totalPartidas,
    resumoDashboard.vitorias
  ]);

  if (carregando) {
    return (
      <section className="pagina perfil-premium">
        <div className="perfil-carregando">
          <span className="perfil-avatar-esqueleto" />
          <p>Carregando seu perfil...</p>
        </div>
      </section>
    );
  }

  const textoBotao = possuiAtleta
    ? 'Salvar perfil'
    : (usuarioEhAtleta ? 'Criar meu atleta' : 'Criar e vincular atleta');

  return (
    <section className="pagina perfil-premium">
      {primeiroAcessoPendente && !usuarioEhAtleta && (
        <article className="perfil-alerta">
          <div>
            <strong>Primeiro acesso</strong>
            <p>Revise seus dados de acesso. O vínculo com atleta é opcional para este perfil.</p>
          </div>
          <button type="button" className="botao-secundario" onClick={finalizarPrimeiroAcesso}>
            Concluir
          </button>
        </article>
      )}

      {erro && <p className="mensagem-erro">{erro}</p>}
      {mensagem && <p className="mensagem-sucesso">{mensagem}</p>}

      <article className="perfil-hero">
        <div className="perfil-hero-topo">
          <div className="perfil-avatar-wrap">
            <div className="perfil-avatar-premium" aria-label={`Avatar de ${nomePerfil}`}>
              {obterIniciais(nomePerfil)}
            </div>
            <button type="button" className="perfil-camera" title="Foto de perfil em breve" aria-label="Foto de perfil em breve">
              <FaCamera aria-hidden="true" />
            </button>
          </div>

          <div className="perfil-identidade">
            <span className={`perfil-status ${statusPerfil.classe}`}>
              <span aria-hidden="true" />
              {statusPerfil.rotulo}
            </span>
            <h1>{nomePerfil}</h1>
            <p>{apelidoPerfil}</p>
            <small>
              {nomeEstadoAcesso(estadoAcesso)} • {obterRotuloNivel(formularioAtleta.nivel)}
            </small>
          </div>

          <button
            type="button"
            className="perfil-editar-atalho"
            onClick={() => {
              setAbaAtiva('perfil');
              setEditandoPerfil(true);
            }}
          >
            <FaUserEdit aria-hidden="true" />
            <span>Editar</span>
          </button>
        </div>

        <div className="perfil-hero-detalhes">
          <span><FaTrophy aria-hidden="true" /> {obterRotuloLado(formularioAtleta.lado)}</span>
          <span><FaMapMarkerAlt aria-hidden="true" /> {localizacaoCompacta}</span>
          <span><FaFire aria-hidden="true" /> {perfilDashboard.textoSequencia || 'Sequência a iniciar'}</span>
        </div>

        <div className="perfil-mini-metricas">
          {metricasHero.map((metrica) => (
            <div key={metrica.rotulo}>
              <span>{metrica.rotulo}</span>
              <strong>{metrica.valor}</strong>
            </div>
          ))}
        </div>
      </article>

      <nav className="perfil-tabs" aria-label="Seções do perfil">
        {abasPerfil.map((aba) => {
          const Icone = aba.icone;
          return (
            <button
              key={aba.id}
              type="button"
              className={abaAtiva === aba.id ? 'ativo' : ''}
              onClick={() => setAbaAtiva(aba.id)}
            >
              <Icone aria-hidden="true" />
              {aba.rotulo}
            </button>
          );
        })}
      </nav>

      <div className="perfil-conteudo-tab">
        {abaAtiva === 'resumo' && (
          <div className="perfil-tab-fade">
            <div className="perfil-secao-titulo">
              <div>
                <span>Desempenho</span>
                <h2>Resumo esportivo</h2>
              </div>
            </div>

            <div className="perfil-desempenho-grid">
              <InfoItem rotulo="Aproveitamento" valor={`${aproveitamento.toFixed(0)}%`} icone={FaChartLine} />
              <InfoItem rotulo="Sequência atual" valor={`${resumoDashboard.sequenciaAtual ?? 0} vitórias`} icone={FaFire} />
              <InfoItem rotulo="Melhor sequência" valor={`${melhorSequencia} vitórias`} icone={FaTrophy} />
              <InfoItem rotulo="Média de pontos" valor={obterMediaPontos(resumoDashboard)} icone={FaChartLine} />
            </div>

            <div className="perfil-secao-titulo compacto">
              <div>
                <span>Últimas partidas</span>
                <h2>Histórico recente</h2>
              </div>
            </div>

            <div className="perfil-partidas-lista">
              {ultimasPartidas.length === 0 && (
                <article className="perfil-vazio">
                  <strong>Nenhuma partida encontrada</strong>
                  <p>Quando houver jogos registrados, eles aparecem aqui de forma compacta.</p>
                </article>
              )}

              {ultimasPartidas.slice(0, 5).map((partida) => (
                <button
                  key={partida.id}
                  type="button"
                  className="perfil-partida-item"
                  onClick={() => navigate('/partidas')}
                >
                  <span className={partida.resultado === 'W' ? 'perfil-resultado vitoria' : 'perfil-resultado derrota'}>
                    {partida.resultado === 'W' ? 'V' : 'D'}
                  </span>
                  <div>
                    <strong>{partida.placarSuaDupla} x {partida.placarAdversarios}</strong>
                    <p>Com {partida.parceiro} vs {partida.adversarios}</p>
                    <small>{partida.dataPartida ? formatarData(partida.dataPartida) : 'Data a definir'}</small>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {abaAtiva === 'perfil' && (
          <form className="perfil-tab-fade" onSubmit={salvarAtleta}>
            <div className="perfil-secao-titulo">
              <div>
                <span>Dados esportivos</span>
                <h2>Perfil do atleta</h2>
              </div>
              {!editandoPerfil && (
                <button type="button" className="botao-secundario compacto" onClick={() => setEditandoPerfil(true)}>
                  Editar perfil
                </button>
              )}
            </div>

            {!editandoPerfil ? (
              <div className="perfil-info-grid">
                <InfoItem rotulo="Nome completo" valor={formularioAtleta.nome} />
                <InfoItem rotulo="Apelido" valor={formularioAtleta.apelido} />
                <InfoItem rotulo="Nascimento" valor={formularioAtleta.dataNascimento ? formatarData(formularioAtleta.dataNascimento) : ''} />
                <InfoItem rotulo="CPF" valor={formularioAtleta.cpf} />
                <InfoItem rotulo="Lado preferido" valor={obterRotuloLado(formularioAtleta.lado)} />
                <InfoItem rotulo="Nível" valor={obterRotuloNivel(formularioAtleta.nivel)} />
              </div>
            ) : (
              <div className="perfil-edicao-grid">
                <CampoEdicao label="Nome completo" largo>
                  <input
                    type="text"
                    value={formularioAtleta.nome}
                    onChange={(evento) => atualizarCampoAtleta('nome', evento.target.value)}
                    required
                  />
                </CampoEdicao>

                <CampoEdicao label="Apelido">
                  <input
                    type="text"
                    value={formularioAtleta.apelido}
                    onChange={(evento) => atualizarCampoAtleta('apelido', evento.target.value)}
                  />
                </CampoEdicao>

                <CampoEdicao label="Nascimento">
                  <input
                    type="date"
                    value={formularioAtleta.dataNascimento}
                    onChange={(evento) => atualizarCampoAtleta('dataNascimento', evento.target.value)}
                    min={dataMinimaNascimento}
                    max={obterDataMaximaNascimento()}
                  />
                </CampoEdicao>

                <CampoEdicao label="CPF">
                  <input
                    type="text"
                    value={formularioAtleta.cpf}
                    onChange={(evento) => atualizarCampoAtleta('cpf', evento.target.value)}
                  />
                </CampoEdicao>

                <CampoEdicao label="Lado">
                  <select
                    value={formularioAtleta.lado}
                    onChange={(evento) => atualizarCampoAtleta('lado', evento.target.value)}
                  >
                    <option value="1">Direito</option>
                    <option value="2">Esquerdo</option>
                    <option value="3">Ambos</option>
                  </select>
                </CampoEdicao>

                <CampoEdicao label="Nível">
                  <select
                    value={formularioAtleta.nivel}
                    onChange={(evento) => atualizarCampoAtleta('nivel', evento.target.value)}
                  >
                    <option value="">Selecione</option>
                    {opcoesNivelAtleta.map((opcao) => (
                      <option key={opcao.valor} value={opcao.valor}>
                        {opcao.rotulo}
                      </option>
                    ))}
                  </select>
                </CampoEdicao>

                <div className="perfil-acoes-edicao perfil-campo-largo">
                  <button type="submit" className="botao-primario" disabled={salvandoAtleta}>
                    {salvandoAtleta ? 'Salvando...' : textoBotao}
                  </button>
                  {possuiAtleta && (
                    <button type="button" className="botao-secundario" onClick={() => setEditandoPerfil(false)}>
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            )}
          </form>
        )}

        {abaAtiva === 'contato' && (
          <form className="perfil-tab-fade" onSubmit={salvarAtleta}>
            <div className="perfil-secao-titulo">
              <div>
                <span>Contato e localização</span>
                <h2>{localizacaoCompacta}</h2>
              </div>
              {!editandoPerfil && (
                <button type="button" className="botao-secundario compacto" onClick={() => setEditandoPerfil(true)}>
                  Editar contato
                </button>
              )}
            </div>

            {!editandoPerfil ? (
              <div className="perfil-info-grid">
                <InfoItem rotulo="Telefone" valor={formularioAtleta.telefone} icone={FaPhone} />
                <InfoItem rotulo="E-mail" valor={emailUsuarioPerfil} icone={FaEnvelope} />
                <InfoItem rotulo="Instagram" valor={formularioAtleta.instagram} icone={FaInstagram} />
                <InfoItem rotulo="Estado" valor={formularioAtleta.estado} icone={FaMapMarkerAlt} />
                <InfoItem rotulo="Cidade" valor={formularioAtleta.cidade} />
                <InfoItem rotulo="Bairro" valor={formularioAtleta.bairro} />
              </div>
            ) : (
              <div className="perfil-edicao-grid">
                <CampoEdicao label="Telefone">
                  <input
                    type="text"
                    value={formularioAtleta.telefone}
                    onChange={(evento) => atualizarCampoAtleta('telefone', evento.target.value)}
                  />
                </CampoEdicao>

                <CampoEdicao label="E-mail">
                  <input type="email" value={emailUsuarioPerfil} readOnly disabled />
                </CampoEdicao>

                <CampoEdicao label="Instagram">
                  <input
                    type="text"
                    value={formularioAtleta.instagram}
                    onChange={(evento) => atualizarCampoAtleta('instagram', evento.target.value)}
                  />
                </CampoEdicao>

                <CampoEdicao label="Estado">
                  <select
                    value={formularioAtleta.estado}
                    onChange={(evento) => atualizarCampoAtleta('estado', evento.target.value)}
                  >
                    <option value="">Selecione</option>
                    {estadosBrasil.map((estado) => (
                      <option key={estado.sigla} value={estado.sigla}>
                        {estado.nome}
                      </option>
                    ))}
                  </select>
                </CampoEdicao>

                <CampoEdicao label="Cidade">
                  <input
                    type="text"
                    list="cidades-estado-perfil"
                    value={formularioAtleta.cidade}
                    onChange={(evento) => atualizarCampoAtleta('cidade', evento.target.value)}
                    placeholder={formularioAtleta.estado ? 'Digite para buscar' : 'Selecione o estado'}
                  />
                  <datalist id="cidades-estado-perfil">
                    {cidadesEstado.map((cidade) => (
                      <option key={cidade} value={cidade} />
                    ))}
                  </datalist>
                  {carregandoCidades && <small>Carregando cidades...</small>}
                </CampoEdicao>

                <CampoEdicao label="Bairro">
                  <input
                    type="text"
                    value={formularioAtleta.bairro}
                    onChange={(evento) => atualizarCampoAtleta('bairro', evento.target.value)}
                  />
                </CampoEdicao>

                <div className="perfil-acoes-edicao perfil-campo-largo">
                  <button type="submit" className="botao-primario" disabled={salvandoAtleta}>
                    {salvandoAtleta ? 'Salvando...' : textoBotao}
                  </button>
                  {possuiAtleta && (
                    <button type="button" className="botao-secundario" onClick={() => setEditandoPerfil(false)}>
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            )}
          </form>
        )}

        {abaAtiva === 'configuracoes' && (
          <div className="perfil-tab-fade perfil-configuracoes">
            {usuarioEhAdministrador && (
              <form className="perfil-config-card" onSubmit={salvarUsuario}>
                <div>
                  <span>Administrador</span>
                  <h2>Dados do acesso</h2>
                  <p>Esses dados pertencem à autenticação do usuário, não ao atleta.</p>
                </div>

                <div className="perfil-edicao-grid">
                  <CampoEdicao label="Nome do usuário" largo>
                    <input
                      type="text"
                      value={formularioUsuario.nome}
                      onChange={(evento) => setFormularioUsuario({ nome: evento.target.value })}
                      required
                    />
                  </CampoEdicao>
                  <CampoEdicao label="E-mail" largo>
                    <input type="email" value={emailUsuarioPerfil} readOnly disabled />
                  </CampoEdicao>
                </div>

                <button type="submit" className="botao-secundario" disabled={salvandoUsuario}>
                  {salvandoUsuario ? 'Salvando...' : 'Salvar acesso'}
                </button>
              </form>
            )}

            <article className="perfil-config-card">
              <div>
                <span>Perfil</span>
                <h2>Edição e sessão</h2>
                <p>Atualize seus dados quando necessário ou encerre a sessão neste dispositivo.</p>
              </div>

              <div className="perfil-config-acoes">
                {editandoPerfil ? (
                  <button type="button" className="botao-primario" onClick={() => salvarAtleta()} disabled={salvandoAtleta}>
                    <FaSave aria-hidden="true" />
                    {salvandoAtleta ? 'Salvando...' : textoBotao}
                  </button>
                ) : (
                  <button type="button" className="botao-secundario" onClick={() => setEditandoPerfil(true)}>
                    <FaUserEdit aria-hidden="true" />
                    Editar perfil
                  </button>
                )}

                <button type="button" className="botao-secundario" onClick={sairDoPerfil}>
                  <FaSignOutAlt aria-hidden="true" />
                  Sair
                </button>
              </div>
            </article>

            <article className="perfil-config-card perfil-zona-perigo">
              <div>
                <span>Zona de perigo</span>
                <h2>Excluir conta</h2>
                <p>
                  Excluir sua conta remove seus dados pessoais e bloqueia seu acesso. Partidas e históricos
                  compartilhados serão preservados para não afetar outros atletas.
                </p>
              </div>

              <button
                type="button"
                className="botao-perigo"
                onClick={confirmarExclusaoMeuPerfil}
                disabled={excluindoPerfil}
              >
                <FaTrashAlt aria-hidden="true" />
                {excluindoPerfil ? 'Excluindo...' : 'Excluir minha conta'}
              </button>
            </article>
          </div>
        )}
      </div>
    </section>
  );
}
