import { CHAVE_PERMISSAO_LOCALIZACAO } from './privacidadeServico';

const TEMPO_LIMITE_GEOLOCALIZACAO_MS = 5000;

export const localizacaoServico = {
  obterLocalizacaoAtual() {
    if (localStorage.getItem(CHAVE_PERMISSAO_LOCALIZACAO) !== 'true') {
      return Promise.resolve(null);
    }

    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      try {
        navigator.geolocation.getCurrentPosition(
          (posicao) => {
            resolve({
              latitude: posicao.coords.latitude,
              longitude: posicao.coords.longitude,
              precisao: posicao.coords.accuracy ?? null
            });
          },
          () => resolve(null),
          {
            enableHighAccuracy: false,
            timeout: TEMPO_LIMITE_GEOLOCALIZACAO_MS,
            maximumAge: 60000
          }
        );
      } catch {
        resolve(null);
      }
    });
  }
};
