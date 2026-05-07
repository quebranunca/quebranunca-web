import { useEffect, useMemo, useState } from 'react';

const INTERVALO_PADRAO_MS = 6000;

function obterChaveSlide(slide, indice) {
  return slide.id || `${slide.tipo}-${indice}`;
}

export function HomeBannerRotativo({ slides = [], intervaloMs = INTERVALO_PADRAO_MS }) {
  const slidesValidos = useMemo(
    () =>
      slides.filter(
        (slide) =>
          slide &&
          (slide.tipo === 'componente' || (slide.tipo === 'imagem' && slide.src))
      ),
    [slides]
  );

  const [slideAtual, setSlideAtual] = useState(0);
  const totalSlides = slidesValidos.length;
  const exibirIndicadores = totalSlides > 1;

  useEffect(() => {
    if (totalSlides === 0) {
      return;
    }

    if (slideAtual >= totalSlides) {
      setSlideAtual(0);
    }
  }, [slideAtual, totalSlides]);

  useEffect(() => {
    if (totalSlides <= 1) {
      return undefined;
    }

    const temporizador = window.setInterval(() => {
      setSlideAtual((atual) => (atual + 1) % totalSlides);
    }, intervaloMs);

    return () => window.clearInterval(temporizador);
  }, [intervaloMs, totalSlides]);

  if (totalSlides === 0) {
    return null;
  }

  return (
    <section className="home-banner-rotativo" aria-label="Destaques da Home">
      <div className="home-banner-slides">
        {slidesValidos.map((slide, indice) => {
          const ativo = indice === slideAtual;

          return (
            <div
              key={obterChaveSlide(slide, indice)}
              className={`home-banner-slide${ativo ? ' ativo' : ''}`}
              aria-hidden={!ativo}
            >
              {slide.tipo === 'componente' ? (
                slide.render?.()
              ) : (
                <article className="cartao home-banner-imagem">
                  {slide.url ? (
                    <a
                      href={slide.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={slide.alt || 'Abrir loja QuebraNunca'}
                      className="home-banner-link"
                    >
                      <img
                        src={slide.src}
                        alt={slide.alt || ''}
                        loading={indice === 0 ? 'eager' : 'lazy'}
                      />
                    </a>
                  ) : (
                    <img
                      src={slide.src}
                      alt={slide.alt || ''}
                      loading={indice === 0 ? 'eager' : 'lazy'}
                    />
                  )}
                </article>
              )}
            </div>
          );
        })}
      </div>

      {exibirIndicadores && (
        <div className="home-banner-indicadores" aria-label="Navegação dos destaques">
          {slidesValidos.map((slide, indice) => {
            const ativo = indice === slideAtual;

            return (
              <button
                key={`indicador-${obterChaveSlide(slide, indice)}`}
                type="button"
                className={`home-banner-indicador${ativo ? ' ativo' : ''}`}
                aria-label={`Ir para o destaque ${indice + 1}`}
                aria-current={ativo ? 'true' : undefined}
                onClick={() => setSlideAtual(indice)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
