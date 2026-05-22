import { useEffect, useRef, useState } from 'react';

export function useInView({
  root = null,
  rootMargin = '240px 0px',
  threshold = 0,
  once = true
} = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const elemento = ref.current;

    if (!elemento) {
      return undefined;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entrada]) => {
        const visivel = entrada.isIntersecting || entrada.intersectionRatio > 0;
        setInView(visivel);

        if (visivel && once) {
          observer.unobserve(entrada.target);
        }
      },
      { root, rootMargin, threshold }
    );

    observer.observe(elemento);

    return () => observer.disconnect();
  }, [once, root, rootMargin, threshold]);

  return { ref, inView };
}
