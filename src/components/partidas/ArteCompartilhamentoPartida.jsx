import { forwardRef } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaTrophy, FaUser } from 'react-icons/fa';
import { LogoQNF } from '../branding/LogoQNF';
import { obterNomeExibicaoAtletaPerfil } from '../../utils/atletaUtils';
import { obterNomeGrupoPartidaExibicao } from '../../utils/partidas';

function obterNomeAtleta(atleta) {
  return obterNomeExibicaoAtletaPerfil(atleta) || 'Atleta';
}

function obterAtletasDupla(atletas) {
  return (Array.isArray(atletas) ? atletas : [])
    .map((atleta, indice) => ({
      id: atleta?.atletaId || atleta?.id || `${obterNomeAtleta(atleta)}-${indice}`,
      nome: obterNomeAtleta(atleta)
    }))
    .slice(0, 2);
}

function obterNumeroDuplaVencedora(dados) {
  const valor = dados?.duplaVencedora;

  if (Number(valor) === 1 || String(valor).toLowerCase() === 'dupla1') {
    return 1;
  }

  if (Number(valor) === 2 || String(valor).toLowerCase() === 'dupla2') {
    return 2;
  }

  const placar1 = Number(dados?.placarDupla1);
  const placar2 = Number(dados?.placarDupla2);

  if (Number.isFinite(placar1) && Number.isFinite(placar2) && placar1 !== placar2) {
    return placar1 > placar2 ? 1 : 2;
  }

  return 1;
}

function ehApenasResultado(tipo) {
  return Number(tipo) === 2 || String(tipo || '').toLowerCase() === 'apenasresultado';
}

function placarFoiInformado(valor) {
  return valor !== null && valor !== undefined && valor !== '' && Number.isFinite(Number(valor));
}

function obterPlacar(dados) {
  if (ehApenasResultado(dados?.tipoRegistroResultado)) {
    return null;
  }

  if (!placarFoiInformado(dados?.placarDupla1) || !placarFoiInformado(dados?.placarDupla2)) {
    return null;
  }

  const placar1 = Number(dados.placarDupla1);
  const placar2 = Number(dados.placarDupla2);

  if (placar1 === 0 && placar2 === 0) {
    return null;
  }

  return { dupla1: placar1, dupla2: placar2 };
}

function obterTextoLimpo(...valores) {
  return valores
    .map((valor) => String(valor || '').trim())
    .find(Boolean) || '';
}

function formatarDataStory(data) {
  if (!data) {
    return 'Data a definir';
  }

  const referencia = new Date(data);
  if (Number.isNaN(referencia.getTime())) {
    return 'Data a definir';
  }

  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const dia = String(referencia.getDate()).padStart(2, '0');
  const mes = meses[referencia.getMonth()] || '';
  const ano = referencia.getFullYear();
  const hora = String(referencia.getHours()).padStart(2, '0');
  const minuto = String(referencia.getMinutes()).padStart(2, '0');

  return `${dia} ${mes} ${ano} • ${hora}:${minuto}`;
}

function obterNomeRegistrador(dados) {
  return obterTextoLimpo(
    dados?.registradoPor,
    dados?.registradoPorNome,
    dados?.nomeRegistrador,
    dados?.nomeCriadoPorUsuario,
    dados?.criadoPorNome,
    dados?.usuarioCriadorNome
  );
}

function obterQrCodeSrc(dados) {
  return obterTextoLimpo(
    dados?.qrCodeDataUrl,
    dados?.qrCodeUrl,
    dados?.qrCodeImagemUrl,
    dados?.qrCode
  );
}

function LinhaAtletaStory({ atleta, destaque = false }) {
  return (
    <strong className={`arte-story-atleta ${destaque ? 'arte-story-atleta-destaque' : ''}`}>
      {atleta.nome}
    </strong>
  );
}

function ListaAtletasStory({ atletas, destaque = false }) {
  return (
    <div className={destaque ? 'arte-story-lista arte-story-lista-vencedores' : 'arte-story-lista'}>
      {atletas.map((atleta) => (
        <LinhaAtletaStory key={atleta.id} atleta={atleta} destaque={destaque} />
      ))}
    </div>
  );
}

function MetaStory({ icone: Icone, rotulo, valor }) {
  if (!valor) {
    return null;
  }

  return (
    <span className="arte-story-meta-item">
      <Icone aria-hidden="true" />
      <span>
        <em>{rotulo}</em>
        <strong>{valor}</strong>
      </span>
    </span>
  );
}

export const ArteCompartilhamentoPartida = forwardRef(function ArteCompartilhamentoPartida(
  { dados },
  ref
) {
  const dupla1 = obterAtletasDupla(dados?.dupla1);
  const dupla2 = obterAtletasDupla(dados?.dupla2);
  const duplaVencedora = obterNumeroDuplaVencedora(dados);
  const vencedores = duplaVencedora === 2 ? dupla2 : dupla1;
  const adversarios = duplaVencedora === 2 ? dupla1 : dupla2;
  const placar = obterPlacar(dados);
  const placarVencedores = duplaVencedora === 2 ? placar?.dupla2 : placar?.dupla1;
  const placarAdversarios = duplaVencedora === 2 ? placar?.dupla1 : placar?.dupla2;
  const grupoNome = obterNomeGrupoPartidaExibicao(dados?.grupoNome);
  const dataHora = formatarDataStory(dados?.dataPartida);
  const registrador = obterNomeRegistrador(dados);
  const qrCodeSrc = obterQrCodeSrc(dados);

  return (
    <article ref={ref} className="arte-compartilhamento-partida arte-compartilhamento-partida-story">
      <div className="arte-story-linhas-quadra" aria-hidden="true" />
      <div className="arte-story-areia" aria-hidden="true" />

      <header className="arte-story-topo">
        <LogoQNF variante="light" className="arte-story-logo" />
        <span><i aria-hidden="true" />PARTIDA REGISTRADA</span>
      </header>

      <main className="arte-story-conteudo">
        <section className="arte-story-vencedores" aria-label="Vencedores da partida">
          <div className="arte-story-label">
            <FaTrophy aria-hidden="true" />
            <span>VENCEDORES</span>
          </div>
          <ListaAtletasStory atletas={vencedores} destaque />
        </section>

        {placar ? (
          <div className="arte-story-placar" aria-label="Placar da partida">
            <strong>{placarVencedores}</strong>
            <span>x</span>
            <strong>{placarAdversarios}</strong>
          </div>
        ) : (
          <div className="arte-story-versus arte-story-versus-sem-placar">VS</div>
        )}

        {placar && <div className="arte-story-versus">VS</div>}

        <section className="arte-story-adversarios" aria-label="Adversários da partida">
          <ListaAtletasStory atletas={adversarios} />
        </section>
      </main>

      <footer className="arte-story-rodape">
        <div className="arte-story-metadados" aria-label="Dados da partida">
          <MetaStory icone={FaMapMarkerAlt} rotulo="Grupo" valor={grupoNome} />
          <MetaStory icone={FaCalendarAlt} rotulo="Data" valor={dataHora} />
          <MetaStory icone={FaUser} rotulo="Registrado por" valor={registrador} />
        </div>

        <div className="arte-story-assinatura">
          {qrCodeSrc && (
            <img
              className="arte-story-qr"
              src={qrCodeSrc}
              alt=""
              aria-hidden="true"
            />
          )}
          <div>
            <p>O FUTEVÔLEI NÃO ACABA NA AREIA.</p>
            <span>app.quebranunca.com.br</span>
          </div>
        </div>
      </footer>
    </article>
  );
});
