import { useEffect, useMemo, useState } from 'react';
import { FaChevronRight } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { AppHero } from '../components/AppHero';
import { obterMoreNavigationSections } from '../components/navigation/navigationConfig';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { pendenciasServico } from '../services/pendenciasServico';

function obterBadge(item, badges) {
  if (!item.badgeKey) {
    return 0;
  }

  return Number(badges?.[item.badgeKey] || 0);
}

export function PaginaMais() {
  const { usuario, estadoAcesso, sair } = useAutenticacao();
  const navegar = useNavigate();
  const [badges, setBadges] = useState({});

  const secoes = useMemo(
    () => obterMoreNavigationSections({ usuario, estadoAcesso }),
    [usuario, estadoAcesso]
  );

  useEffect(() => {
    let ativo = true;

    async function carregarResumoPendencias() {
      try {
        const resumo = await pendenciasServico.obterResumo();
        if (ativo) {
          setBadges({ pendencias: Number(resumo?.total || 0) });
        }
      } catch {
        if (ativo) {
          setBadges({});
        }
      }
    }

    carregarResumoPendencias();

    return () => {
      ativo = false;
    };
  }, []);

  function encerrarSessao() {
    sair();
    navegar('/', { replace: true });
  }

  return (
    <section className="pagina pagina-mais">
      <AppHero
        title="Mais"
        subtitle="Perfil, histórico, benefícios e suporte."
        accountUser={usuario}
        autenticado={Boolean(usuario)}
        showBackButton
        variant="page"
      />

      <div className="mais-secoes">
        {secoes.map((secao) => (
          <section key={secao.id} className="mais-secao" aria-labelledby={`mais-secao-${secao.id}`}>
            <h2 id={`mais-secao-${secao.id}`}>{secao.title}</h2>

            <div className="mais-lista">
              {secao.items.map((item) => {
                const Icone = item.icon;
                const badge = obterBadge(item, badges);
                const conteudo = (
                  <>
                    <span className={`mais-item-icone ${item.danger ? 'perigo' : ''}`}>
                      <Icone aria-hidden="true" />
                    </span>
                    <span className="mais-item-texto">
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>
                    {badge > 0 && (
                      <span className="mais-item-badge" aria-label={`${badge} pendência(s)`}>
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                    {item.isFuture && <span className="mais-item-em-breve">Em breve</span>}
                    {item.enabled && !item.action && <FaChevronRight className="mais-item-seta" aria-hidden="true" />}
                  </>
                );

                if (item.action === 'logout') {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="mais-item mais-item-botao mais-item-perigo"
                      onClick={encerrarSessao}
                    >
                      {conteudo}
                    </button>
                  );
                }

                if (!item.enabled || !item.route) {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="mais-item mais-item-botao desabilitado"
                      disabled
                    >
                      {conteudo}
                    </button>
                  );
                }

                return (
                  <Link key={item.id} to={item.route} className="mais-item">
                    {conteudo}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
