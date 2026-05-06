# Regras específicas do frontend

- Usar `src/services` para acesso HTTP e manter autenticação e URL base centralizadas em `src/services/http.js`
- Preferir páginas com estado local; só extrair hook ou componente quando isso reduzir duplicação real
- Reutilizar `utils/erros.js` e `utils/formatacao.js` antes de criar lógica equivalente dentro das páginas
- Sempre que exibir o nome de um atleta no frontend, priorizar o apelido. Caso não exista apelido preenchido, usar o nome. Centralizar essa lógica em utilitário reutilizável e evitar duplicação.
- Não colocar regra de negócio da competição no cliente; refletir dados e validações vindos da API
- Exibir feedback claro para carregamento, erro, sucesso e ações destrutivas
- Quando um endpoint existir no repositório, mas a tela receber `404` ou falha de conexão, verificar primeiro a instância local da API, o `baseURL` em `src/services/http.js`, o proxy do Vite e o `.env` antes de alterar código
- Em problema de integração local, preferir reiniciar ou atualizar o backend e alinhar a porta usada pelo frontend com a porta realmente disponível da API
- Não deixar `.env` local, export de build ou configuração temporária de porta/API entrar na branch `master`
- Na tela de inscrições, manter o fluxo simples: primeiro tentar dupla existente; se não houver, permitir informar os dois jogadores e deixar a API criar/reaproveitar atleta e dupla
- Na tela de atletas, trabalhar com nome completo; não reintroduzir edição manual livre de apelido sem necessidade real
- Na tela de aceite de convite, aceitar e exibir código curto `000-000`; manter o frontend como coletor do código e deixar validação, perfil e estado do convite para a API
- Em páginas de ranking e competição, preservar a navegação já simplificada e evitar filtros ou blocos extras sem ganho claro
- Em telas de campeonato, refletir a fase da partida quando existir e não esconder campos que já são obrigatórios no backend para esse tipo de competição
- Autocomplete no registro de partidas só deve consultar sugestões da competição quando houver competição selecionada e termo com ao menos 3 caracteres; sem competição, preservar o fluxo atual
- Banner rotativo reutilizável deve aceitar slides de imagem e componente

## NAVIGATION_RULES
- O header global deve ser centralizado no `AppHeader`.
- Telas raiz exibem Menu.
- Telas de ação simples exibem Menu + Home.
- Telas de contexto exibem Voltar + Home.
- Nunca exibir Menu e Voltar simultaneamente.
- Fluxos de uma única tela não devem exibir botão Voltar.
- Botão Home deve estar disponível em telas internas e navegar para `/app`.
- Manter navegação simples, clara e mobile-first.
