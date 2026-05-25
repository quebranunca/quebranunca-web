import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArenaAdminForm } from '../../components/arenas/ArenaAdminForm';
import { ArenaAdminHeader } from '../../components/arenas/ArenaAdminHeader';
import { ArenaAdminMetricCard } from '../../components/arenas/ArenaAdminMetricCard';
import { ArenaAdminTabs } from '../../components/arenas/ArenaAdminTabs';
import { ArenaEspacosPanel } from '../../components/arenas/ArenaEspacosPanel';
import { ArenaSettingsPanel } from '../../components/arenas/ArenaSettingsPanel';
import { arenaService } from '../../services/arenaService';
import '../../components/arenas/arena-publico.css';

function extrairMensagemErro(erro) {
  return erro?.response?.data?.mensagem || erro?.response?.data?.message || erro?.message || 'Não foi possível processar a solicitação.';
}

function criarEstadoFormulario(arena = {}) {
  return {
    nome: arena.nome || '',
    descricao: arena.descricao || '',
    tipoArena: arena.tipoArena || '',
    endereco: arena.endereco || '',
    enderecoResumo: arena.enderecoResumo || '',
    cidade: arena.cidade || '',
    estado: arena.estado || '',
    latitude: arena.latitude ?? '',
    longitude: arena.longitude ?? '',
    whatsapp: arena.whatsapp || '',
    instagram: arena.instagram || '',
    site: arena.site || '',
    quantidadeEspacos: arena.quantidadeEspacos ?? 0,
    possuiIluminacao: Boolean(arena.possuiIluminacao),
    possuiVestiario: Boolean(arena.possuiVestiario),
    possuiEstacionamento: Boolean(arena.possuiEstacionamento)
  };
}

const abas = [
  { id: 'resumo', rotulo: 'Resumo' },
  { id: 'dados-da-arena', rotulo: 'Dados da arena' },
  { id: 'espacos', rotulo: 'Espaços' },
  { id: 'configuracoes', rotulo: 'Configurações' }
];

export function ArenaAdminDashboardPage() {
  const { arenaId } = useParams();
  const [arena, setArena] = useState(null);
  const [espacos, setEspacos] = useState([]);
  const [form, setForm] = useState(criarEstadoFormulario());
  const [erros, setErros] = useState({});
  const [abaAtual, setAbaAtual] = useState('resumo');
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    let ativo = true;

    async function carregarDashboard() {
      setCarregando(true);
      setErro('');
      setSucesso('');

      try {
        const [dadosArena, listaEspacos] = await Promise.all([
          arenaService.obterArenaAdmin(arenaId),
          arenaService.listarEspacos(arenaId)
        ]);

        if (!ativo) {
          return;
        }

        setArena(dadosArena);
        setEspacos(Array.isArray(listaEspacos) ? listaEspacos : []);
        setForm(criarEstadoFormulario(dadosArena));
      } catch (error) {
        if (!ativo) {
          return;
        }

        setErro(extrairMensagemErro(error));
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarDashboard();

    return () => {
      ativo = false;
    };
  }, [arenaId]);

  async function recarregarEspacos() {
    const listaEspacos = await arenaService.listarEspacos(arenaId);
    setEspacos(Array.isArray(listaEspacos) ? listaEspacos : []);
  }

  const metricas = useMemo(() => {
    const totalEspacos = espacos.length > 0 ? espacos.length : arena?.quantidadeEspacos ?? 0;

    return [
      {
        rotulo: 'Status',
        valor: arena?.ativa ? 'Ativa' : 'Inativa',
        descricao: arena?.ativa ? 'A arena está exibida para o público.' : 'A arena está oculta e não recebe novos acessos.'
      },
      {
        rotulo: 'Visibilidade',
        valor: arena?.publica ? 'Pública' : 'Privada',
        descricao: arena?.publica ? 'Qualquer visitante pode visualizar o perfil.' : 'O perfil só fica acessível a usuários autorizados.'
      },
      {
        rotulo: 'Espaços',
        valor: totalEspacos,
        descricao: totalEspacos === 0 ? 'Cadastre quantos espaços físicos a arena possui.' : 'Quantidade registrada para o cadastro da arena.'
      }
    ];
  }, [arena]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setSucesso('');
    setErro('');
    setForm((anterior) => ({
      ...anterior,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  function validarFormulario() {
    const validacoes = {};

    if (!form.nome.trim()) {
      validacoes.nome = 'Informe o nome da arena.';
    }

    if (!form.tipoArena) {
      validacoes.tipoArena = 'Selecione o tipo de arena.';
    }

    if (Number(form.quantidadeEspacos) < 0) {
      validacoes.quantidadeEspacos = 'A quantidade de espaços não pode ser negativa.';
    }

    setErros(validacoes);
    return Object.keys(validacoes).length === 0;
  }

  async function handleSalvar(event) {
    event.preventDefault();
    setSucesso('');
    setErro('');

    if (!validarFormulario()) {
      return;
    }

    try {
      setEnviando(true);
      const payload = {
        nome: form.nome,
        descricao: form.descricao,
        tipoArena: form.tipoArena,
        endereco: form.endereco,
        enderecoResumo: form.enderecoResumo,
        cidade: form.cidade,
        estado: form.estado,
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
        whatsapp: form.whatsapp,
        instagram: form.instagram,
        site: form.site,
        quantidadeEspacos: Number(form.quantidadeEspacos) || 0,
        possuiIluminacao: Boolean(form.possuiIluminacao),
        possuiVestiario: Boolean(form.possuiVestiario),
        possuiEstacionamento: Boolean(form.possuiEstacionamento)
      };

      const atualizada = await arenaService.atualizarArena(arena.id, payload);
      setArena((anterior) => ({ ...anterior, ...atualizada }));
      setForm(criarEstadoFormulario(atualizada));
      setSucesso('Dados da arena atualizados com sucesso.');
      setAbaAtual('resumo');
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setEnviando(false);
    }
  }

  async function handleAtivar() {
    await executarToggleStatus(true, 'Arena ativada com sucesso.');
  }

  async function handleDesativar() {
    await executarToggleStatus(false, 'Arena desativada com sucesso.');
  }

  async function executarToggleStatus(novoStatus, mensagem) {
    setSucesso('');
    setErro('');

    try {
      setEnviando(true);
      await arenaService.atualizarStatusArena(arena.id, novoStatus);
      setArena((anterior) => ({ ...anterior, ativa: novoStatus }));
      setSucesso(mensagem);
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setEnviando(false);
    }
  }

  async function handleTornarPublica() {
    await executarToggleVisibilidade(true, 'A arena agora está pública.');
  }

  async function handleTornarPrivada() {
    await executarToggleVisibilidade(false, 'A arena agora está privada.');
  }

  async function executarToggleVisibilidade(novaVisibilidade, mensagem) {
    setSucesso('');
    setErro('');

    try {
      setEnviando(true);
      await arenaService.atualizarVisibilidadeArena(arena.id, novaVisibilidade);
      setArena((anterior) => ({ ...anterior, publica: novaVisibilidade }));
      setSucesso(mensagem);
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <div className="pagina-arena-admin">
        <section className="arena-admin-page__estado arena-admin-page__estado--carregando">
          <p>Carregando dashboard da arena...</p>
        </section>
      </div>
    );
  }

  if (erro && !arena) {
    return (
      <div className="pagina-arena-admin">
        <section className="arena-admin-page__estado arena-admin-page__estado--erro">
          <h2>Não foi possível acessar o dashboard</h2>
          <p>{erro}</p>
          <Link to="/minhas-arenas" className="botao-primario">
            Voltar para minhas arenas
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="pagina-arena-admin">
      <ArenaAdminHeader arena={arena} onEditar={() => setAbaAtual('dados-da-arena')} />

      <div className="arena-admin-page__conteudo">
        <ArenaAdminTabs abas={abas} abaAtual={abaAtual} onSelecionar={setAbaAtual} />

        <section className="arena-admin-page__secao">
          {abaAtual === 'resumo' && (
            <>
              <div className="arena-admin-page__metricas">
                {metricas.map((metrica) => (
                  <ArenaAdminMetricCard
                    key={metrica.rotulo}
                    rotulo={metrica.rotulo}
                    valor={metrica.valor}
                    descricao={metrica.descricao}
                  />
                ))}
              </div>

              <div className="arena-admin-page__cards">
                <article className="arena-admin-page__card">
                  <h3>Próximos passos</h3>
                  <p>Revise os dados principais, ajuste a visibilidade e garanta que a arena está pronta para receber inscrições e partidas.</p>
                </article>
                <article className="arena-admin-page__card">
                  <h3>Observações</h3>
                  <p>O painel está em fase inicial e foca na gestão básica da arena. Novas áreas de administração serão adicionadas conforme o fluxo evoluir.</p>
                </article>
              </div>
            </>
          )}

          {abaAtual === 'dados-da-arena' && (
            <section className="arena-admin-page__formulario">
              <div className="arena-admin-page__formulario-topo">
                <div>
                  <p className="arena-admin-page__breadcrumb">Dados da arena</p>
                  <h2>Atualize as informações principais</h2>
                </div>
              </div>

              <ArenaAdminForm
                form={form}
                onChange={handleChange}
                onSubmit={handleSalvar}
                erros={erros}
                enviando={enviando}
                mensagemSucesso={sucesso}
                mensagemErro={erro}
              />
            </section>
          )}

          {abaAtual === 'espacos' && (
            <ArenaEspacosPanel arenaId={arenaId} espacos={espacos} recarregarEspacos={recarregarEspacos} />
          )}

          {abaAtual === 'configuracoes' && (
            <ArenaSettingsPanel
              arena={arena}
              onAtivar={handleAtivar}
              onDesativar={handleDesativar}
              onTornarPublica={handleTornarPublica}
              onTornarPrivada={handleTornarPrivada}
              enviando={enviando}
              mensagemSucesso={sucesso}
              mensagemErro={erro}
            />
          )}
        </section>
      </div>
    </div>
  );
}
