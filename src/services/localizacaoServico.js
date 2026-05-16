const TEMPO_LIMITE_GEOLOCALIZACAO_MS = 5000;

export const localizacaoServico = {
  obterLocalizacaoAtual() {
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
