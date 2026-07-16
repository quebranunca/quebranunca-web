import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppHero } from '../components/AppHero';
import { CriarGrupoFluxo } from '../components/grupos/CriarGrupoFluxo';
import { useNotification } from '../contexts/NotificationContext';
import { useAutenticacao } from '../hooks/useAutenticacao';
import {
  obterRotaDetalheGrupo,
  ROTA_GRUPOS
} from '../utils/grupoRotas';
import { normalizarOrigemInterna } from '../utils/partidaRotas';

function obterOrigemEstado(location) {
  return normalizarOrigemInterna(
    location.state?.origem ||
    location.state?.from ||
    location.state?.returnTo
  );
}

export function PaginaCriarGrupo() {
  const location = useLocation();
  const navegar = useNavigate();
  const { usuario } = useAutenticacao();
  const { showNotification } = useNotification();
  const origem = useMemo(() => obterOrigemEstado(location), [location]);
  const destinoVoltar = origem || ROTA_GRUPOS;

  function voltar() {
    navegar(destinoVoltar, { replace: true });
  }

  async function aoCriarGrupo(grupo) {
    showNotification({
      type: 'success',
      title: 'Grupo criado',
      message: 'O grupo foi criado com sucesso.'
    });

    navegar(obterRotaDetalheGrupo(grupo), { replace: true });
  }

  return (
    <section className="pagina criar-grupo-pagina">
      <AppHero
        title="Criar grupo"
        subtitle="Configure nome, visibilidade e imagem."
        accountUser={usuario}
        autenticado={Boolean(usuario)}
        showBackButton
        onBack={voltar}
        variant="page"
      />

      <div className="criar-grupo-pagina__conteudo">
        <CriarGrupoFluxo
          modoExibicao="pagina"
          onFechar={voltar}
          onCriado={aoCriarGrupo}
          fecharAoCriar={false}
        />
      </div>
    </section>
  );
}
