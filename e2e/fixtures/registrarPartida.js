export const atletaLogado = {
  id: 'atl-usuario',
  nome: 'Gustavo Drager',
  apelido: 'Gustavo Drager',
  cidade: 'Praia Grande',
  estado: 'SP',
  lado: 1
};

export const usuarioAtleta = {
  id: 'usr-atleta',
  nome: 'Gustavo Drager',
  email: 'gustavo.e2e@quebranunca.local',
  perfil: 3,
  atletaId: atletaLogado.id,
  atleta: atletaLogado,
  permitirUsoLocalizacao: false
};

export const atletasBusca = [
  { id: 'atl-marina', nome: 'Marina Costa', apelido: 'Marina Costa', cidade: 'Praia Grande', estado: 'SP' },
  { id: 'atl-rafael', nome: 'Rafael Lima', apelido: 'Rafael Lima', cidade: 'Santos', estado: 'SP' },
  { id: 'atl-bruna', nome: 'Bruna Alves', apelido: 'Bruna Alves', cidade: 'Sao Vicente', estado: 'SP' },
  { id: 'atl-carlos', nome: 'Carlos Souza', apelido: 'Carlos Souza', cidade: 'Praia Grande', estado: 'SP' },
  { id: 'atl-paula', nome: 'Paula Mendes', apelido: 'Paula Mendes', cidade: 'Santos', estado: 'SP' }
];

export const sugestoesPartida = {
  parceirosFrequentes: [
    { id: 'atl-marina', nome: 'Marina Costa', totalPartidas: 12 },
    { id: 'atl-rafael', nome: 'Rafael Lima', totalPartidas: 9 }
  ],
  rivaisFrequentes: [
    { id: 'atl-bruna', nome: 'Bruna Alves', totalPartidas: 8 },
    { id: 'atl-carlos', nome: 'Carlos Souza', totalPartidas: 7 },
    { id: 'atl-paula', nome: 'Paula Mendes', totalPartidas: 6 }
  ]
};

export const partidaRegistrada = {
  id: 'partida-e2e-001',
  tipoRegistroResultado: 'ApenasResultado',
  duplaVencedora: 1,
  nomeGrupo: 'Partida avulsa',
  nomeDuplaAAtleta1: 'Gustavo Drager',
  nomeDuplaAAtleta2: 'Marina Costa',
  nomeDuplaBAtleta1: 'Bruna Alves',
  nomeDuplaBAtleta2: 'Carlos Souza',
  dataAtualizacao: '2026-06-11T12:00:00.000Z'
};
