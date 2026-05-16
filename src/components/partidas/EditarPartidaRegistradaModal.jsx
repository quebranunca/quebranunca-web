import { useEffect, useRef, useState } from 'react';
import { PlacarDuplaEditavel } from './PlacarDuplaEditavel';

function criarFormulario(partida) {
  return {
    dupla1: {
      atletaDireita: partida?.nomeDuplaAAtleta1 || '',
      atletaEsquerda: partida?.nomeDuplaAAtleta2 || '',
      pontos: String(partida?.placarDuplaA ?? '')
    },
    dupla2: {
      atletaDireita: partida?.nomeDuplaBAtleta1 || '',
      atletaEsquerda: partida?.nomeDuplaBAtleta2 || '',
      pontos: String(partida?.placarDuplaB ?? '')
    }
  };
}

function limparTexto(valor) {
  return String(valor || '').trim().replace(/\s+/g, ' ');
}

function validarFormulario(formulario) {
  const nomes = [
    formulario.dupla1.atletaDireita,
    formulario.dupla1.atletaEsquerda,
    formulario.dupla2.atletaDireita,
    formulario.dupla2.atletaEsquerda
  ];

  if (nomes.some((nome) => !limparTexto(nome))) {
    return 'Informe os quatro atletas da partida.';
  }

  const pontosDupla1 = Number(formulario.dupla1.pontos);
  const pontosDupla2 = Number(formulario.dupla2.pontos);

  if (!Number.isFinite(pontosDupla1) || !Number.isFinite(pontosDupla2) || pontosDupla1 < 0 || pontosDupla2 < 0) {
    return 'Informe pontos numéricos maiores ou iguais a zero.';
  }

  if (pontosDupla1 === pontosDupla2) {
    return 'Não existe empate no futevôlei. Ajuste o placar antes de salvar.';
  }

  return '';
}

function criarPayload(partida, formulario) {
  return {
    competicaoId: null,
    grupoId: partida.grupoId || null,
    nomeGrupo: partida.nomeGrupo || null,
    categoriaCompeticaoId: partida.categoriaCompeticaoId || null,
    duplaAId: null,
    duplaBId: null,
    duplaAAtleta1Id: null,
    duplaAAtleta1Nome: limparTexto(formulario.dupla1.atletaDireita),
    duplaAAtleta2Id: null,
    duplaAAtleta2Nome: limparTexto(formulario.dupla1.atletaEsquerda),
    duplaBAtleta1Id: null,
    duplaBAtleta1Nome: limparTexto(formulario.dupla2.atletaDireita),
    duplaBAtleta2Id: null,
    duplaBAtleta2Nome: limparTexto(formulario.dupla2.atletaEsquerda),
    faseCampeonato: partida.faseCampeonato || null,
    status: partida.status,
    placarDuplaA: Number(formulario.dupla1.pontos),
    placarDuplaB: Number(formulario.dupla2.pontos),
    dataPartida: partida.dataPartida || null,
    observacoes: partida.observacoes || null
  };
}

export function EditarPartidaRegistradaModal({ partida, salvando, erro, onSalvar, onFechar }) {
  const [formulario, setFormulario] = useState(() => criarFormulario(partida));
  const [erroValidacao, setErroValidacao] = useState('');
  const primeiroCampoRef = useRef(null);

  useEffect(() => {
    setFormulario(criarFormulario(partida));
    setErroValidacao('');
  }, [partida]);

  useEffect(() => {
    primeiroCampoRef.current?.focus();
  }, []);

  const mensagemErro = erroValidacao || erro;

  function atualizarCampo(dupla, campo, valor) {
    setErroValidacao('');
    setFormulario((anterior) => ({
      ...anterior,
      [dupla]: {
        ...anterior[dupla],
        [campo]: valor
      }
    }));
  }

  function aoSubmeter(evento) {
    evento.preventDefault();

    const erroAtual = validarFormulario(formulario);
    if (erroAtual) {
      setErroValidacao(erroAtual);
      return;
    }

    onSalvar(criarPayload(partida, formulario));
  }

  if (!partida) {
    return null;
  }

  return (
    <div className="modal-sobreposicao minhas-partidas-registradas-sobreposicao" role="presentation">
      <section
        className="modal-conteudo minhas-partidas-registradas-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editar-partida-registrada-titulo"
      >
        <div className="modal-cabecalho">
          <div>
            <h3 id="editar-partida-registrada-titulo">Editar partida</h3>
            <p>Altere atletas e placar. Grupo, data e status permanecem iguais.</p>
          </div>
          <button
            type="button"
            className="minhas-partidas-registradas-fechar"
            onClick={onFechar}
            disabled={salvando}
            aria-label="Fechar edição da partida"
          >
            ×
          </button>
        </div>

        <form className="formulario-grid unico minhas-partidas-registradas-formulario" onSubmit={aoSubmeter}>
          {mensagemErro && <p className="texto-erro">{mensagemErro}</p>}

          <PlacarDuplaEditavel
            label="Dupla 1"
            atletaDireita={formulario.dupla1.atletaDireita}
            atletaEsquerda={formulario.dupla1.atletaEsquerda}
            pontos={formulario.dupla1.pontos}
            onChangeAtletaDireita={(valor) => atualizarCampo('dupla1', 'atletaDireita', valor)}
            onChangeAtletaEsquerda={(valor) => atualizarCampo('dupla1', 'atletaEsquerda', valor)}
            onChangePontos={(valor) => atualizarCampo('dupla1', 'pontos', valor)}
            primeiroCampoRef={primeiroCampoRef}
            disabled={salvando}
          />

          <PlacarDuplaEditavel
            label="Dupla 2"
            atletaDireita={formulario.dupla2.atletaDireita}
            atletaEsquerda={formulario.dupla2.atletaEsquerda}
            pontos={formulario.dupla2.pontos}
            onChangeAtletaDireita={(valor) => atualizarCampo('dupla2', 'atletaDireita', valor)}
            onChangeAtletaEsquerda={(valor) => atualizarCampo('dupla2', 'atletaEsquerda', valor)}
            onChangePontos={(valor) => atualizarCampo('dupla2', 'pontos', valor)}
            disabled={salvando}
          />

          <div className="acoes-formulario">
            <button type="button" className="botao-secundario" onClick={onFechar} disabled={salvando}>
              Cancelar
            </button>
            <button type="submit" className="botao-primario" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
