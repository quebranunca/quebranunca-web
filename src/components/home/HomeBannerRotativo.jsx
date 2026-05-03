import { useEffect, useMemo, useState } from 'react';

const INTERVALO_PADRAO_MS = 6000;

function obterChaveSlide(slide, indice) {
  return slide.id || `${slide.tipo}-${indice}`;
}

export function HomeBannerRotativo({ slides = [], intervaloMs = INTERVALO_PADRAO_MS }) {
  const slidesValidos = useMemo(
    () => slides.filter((slide) => slide && (slide.tipo === 'componente' || (slide.tipo === 'imagem' && slide.src))),
    [slides]
  );
  const [slideAtual, setSlideAtual] = useState(0);
  const totalSlides = slidesValidos.length;

  useEffect(() => {
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

  function voltarSlide() {
    setSlideAtual((atual) => (atual - 1 + totalSlides) % totalSlides);
  }

  function avancarSlide() {
    setSlideAtual((atual) => (atual + 1) % totalSlides);
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
                  <img src={slide.src} alt={slide.alt || ''} loading={indice === 0 ? 'eager' : 'lazy'} />
                </article>
              )}
            </div>
          );
        })}
      </div>

      {totalSlides > 1 && (
        <>
          <button
            type="button"
            className="home-banner-seta anterior"
            onClick={voltarSlide}
            aria-label="Banner anterior"
          >
            &lsaquo;
          </button>
          <button
            type="button"
            className="home-banner-seta proximo"
            onClick={avancarSlide}
            aria-label="Próximo banner"
          >
            &rsaquo;
          </button>
          <div className="home-banner-indicadores" aria-label="Selecionar banner">
            {slidesValidos.map((slide, indice) => (
              <button
                key={obterChaveSlide(slide, indice)}
                type="button"
                className={indice === slideAtual ? 'ativo' : ''}
                onClick={() => setSlideAtual(indice)}
                aria-label={`Exibir banner ${indice + 1}`}
                aria-current={indice === slideAtual ? 'true' : undefined}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
