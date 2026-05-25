import {
  FaBuilding,
  FaCoffee,
  FaLightbulb,
  FaParking,
  FaShower,
  FaStore,
  FaUmbrella
} from 'react-icons/fa';

function montarEstrutura(arena) {
  const estrutura = [];

  if (arena?.possuiIluminacao) {
    estrutura.push({ rotulo: 'Iluminação', icone: FaLightbulb });
  }

  if (arena?.possuiEstacionamento) {
    estrutura.push({ rotulo: 'Estacionamento', icone: FaParking });
  }

  if (arena?.possuiVestiario) {
    estrutura.push({ rotulo: 'Vestiário', icone: FaBuilding });
  }

  if (arena?.possuiDucha) {
    estrutura.push({ rotulo: 'Ducha', icone: FaShower });
  }

  if (arena?.possuiBarRestaurante) {
    estrutura.push({ rotulo: 'Bar / Restaurante', icone: FaCoffee });
  }

  if (arena?.possuiLoja) {
    estrutura.push({ rotulo: 'Loja', icone: FaStore });
  }

  if (arena?.possuiCobertura) {
    estrutura.push({ rotulo: 'Cobertura', icone: FaUmbrella });
  }

  return estrutura;
}

export function ArenaEstruturaBadges({ arena }) {
  const estrutura = montarEstrutura(arena);

  if (!estrutura.length) {
    return null;
  }

  return (
    <div className="arena-badges">
      {estrutura.map((item) => {
        const Icone = item.icone;

        return (
          <span key={item.rotulo} className="arena-badge">
            <Icone aria-hidden="true" />
            <span>{item.rotulo}</span>
          </span>
        );
      })}
    </div>
  );
}
