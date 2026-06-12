# Contexto local do frontend

Seguir o `AGENTS.md` da raiz. Neste diretório, além disso:

## Diretrizes
- Manter React + Vite em JavaScript, seguindo a organização atual por `pages`, `services`, `contexts`, `hooks`, `layouts` e `utils`
- Reutilizar `services`, `http.js`, utilitários e layout existente antes de criar abstrações novas
- Só extrair componente, hook ou helper quando houver reutilização real ou simplificação clara
- Não introduzir TypeScript, estado global, biblioteca de UI ou biblioteca de formulário sem necessidade real
- Não duplicar regra de negócio do backend no cliente; o frontend deve refletir dados, estados e mensagens vindos da API
- Tratar loading, erro, vazio e sucesso de forma explícita
- Priorizar fluxo simples, responsivo e legível
- Não versionar `.env` local nem embutir URL de API de ambiente real direto no código; usar `.env.example` e variáveis de build quando necessário
- Antes de ajustar integração, conferir primeiro `src/services/http.js`, `vite.config.js` e os arquivos `.env*` para não mascarar problema de ambiente com mudança de código

## Home logada
- A Home logada deve manter a ordem de módulos controlada por `src/components/home/homeSectionsConfig.js`
- Para adicionar, ocultar ou reordenar módulos da Home, atualizar primeiro a configuração central e reaproveitar o renderizador existente em `HomeDashboard.jsx`
- Novos módulos da Home devem ser componentes simples, com estados vazio/carregando/erro explícitos quando aplicável, sem criar framework próprio de widgets
- Não duplicar chamadas de dados em módulos filhos quando a Home ou o container já entregar os dados por props

## Fluxos já adotados
- `Competições` já concentra atalhos para categorias e inscrições; preservar esse papel antes de criar navegação paralela
- `Arena` é o cadastro principal de local esportivo; `Competições` e `Grupos` podem referenciar a Arena escolhida
- A interface não deve introduzir cadastros principais paralelos de `Local`, `Quadra` ou `Rede`; espaços internos pertencem à Arena
- Partidas e treinos podem indicar Arena, mantendo válido o registro de partida avulsa sem Arena
- `Inscrições` aceita dupla existente ou criação no fluxo a partir de `Jogador 1` e `Jogador 2`
- `Meu Perfil` existe para qualquer usuário e concentra vínculo `Usuario` ↔ `Atleta`
- `Meu Perfil` deve manter Perfil Esportivo separado de Medidas e Uniformes; arena principal deve usar seleção de Arena cadastrada, sem texto livre.
- Medidas e Uniformes devem exibir apenas campos compatíveis com o sexo/gênero do atleta, usando selects e mantendo preenchimento opcional.
- `Meu Perfil` também concentra preferências de privacidade; e-mail público, localização e imagem/foto devem respeitar as preferências retornadas pela API
- `Meu Perfil` deve manter acessíveis as ações globais de atualizar o aplicativo e sair da conta.
- Usuário comum (`Atleta`) não vincula atleta existente; cria apenas o próprio atleta com o mesmo nome e e-mail do usuário
- `Competições` para atleta funciona como vitrine de campeonatos com inscrições abertas; para gestor continua sendo tela de gestão
- `Inscrições` para atleta permite escolher campeonato/categoria e se inscrever com dupla própria ou parceiro ainda pendente
- `Usuários` existe apenas para administrador; esconder rota e menu fora desse perfil
- `Partidas` deve exibir a tabela de jogos da categoria; administrador e organizador podem gerar/alterar jogos, respeitando ownership da competição
- `Partidas` em grupo deve permitir fluxo único: frontend coleta nomes completos ou seleção de atletas existentes, e a API reaproveita ou cria atleta, dupla e vínculo ao grupo no próprio registro da partida. O usuário autenticado que registra precisa pertencer ao grupo; atletas informados não precisam estar previamente no grupo e a API vincula automaticamente os ausentes ao salvar.
- Registro de partida deve usar uma tela única, rápida e sem wizard por etapas, com modo padrão "Apenas vencedor", placar completo como opção avançada e compartilhamento como próxima ação após salvar.
- Edição básica de partida deve aparecer apenas para criador ou administrador, permitir alterar atletas, placares e grupo quando aplicável, e usar fluxo visual consistente com o registro de partida
- Registro de partida deve consultar a validação de possível duplicidade do backend antes de salvar e exibir confirmação visual; não usar `window.confirm` para esse aviso quando houver modal visual no fluxo
- `Minhas partidas registradas` deve listar partidas cadastradas pelo usuário logado e não deve ser misturada com `Meus Jogos`, que lista partidas em que o atleta vinculado participou
- Em dupla eliminação, `Partidas` deve deixar claro se o jogo pertence à chave vencedora, perdedora, final ou final reset
- `Ranking` já possui modos de liga e competição; o da liga é consolidado e o da competição segue separado por categoria
- `Ranking` deve exibir atletas sem usuário como pendentes no mesmo ranking, sem tela ou cálculo paralelo de pontos
- Rankings de grupo devem considerar todos os atletas membros do grupo e/ou participantes de partidas do grupo, mesmo sem pontuação. Não filtrar atletas apenas por pontos, vitórias ou partidas vencidas.
- `Pendências` centraliza aprovar/contestar partidas e completar contato de atleta pendente; o frontend só reflete as pendências e ações retornadas pela API
- `Modelos de importação` já oferece download e upload CSV por tipo de cadastro
- Aceite de convite deve tratar o código no formato curto `000-000`, sem depender do frontend para definir perfil, validade ou regras de uso do convite
- Aceite de convite deve exigir Política de Privacidade e Termos de Uso; localização e imagem/foto são consentimentos separados e opcionais
- Foto de perfil é enviada pelo frontend para a API usando `multipart/form-data`; o frontend nunca chama Cloudinary diretamente, usa apenas a URL retornada pela API e mantém fallback visual com iniciais quando não houver foto.
- Avatar de usuário deve usar componente reutilizável, sempre priorizando `fotoPerfilUrl` quando disponível e voltando para iniciais quando não houver foto ou a imagem falhar.
- Avatar de grupo é opcional e deve usar componente/helper reutilizável, priorizando `imagemUrl` quando disponível e mantendo fallback visual consistente quando não houver foto ou a imagem falhar.
- Cards de dashboard devem reutilizar padrões visuais existentes, tratar estados vazios de forma amigável e evitar badges ou atalhos soltos sem contexto visual; no mobile, estatísticas simples devem preferir chips/mini-cards compactos, sem empilhar cards grandes para dados curtos, e cards de destaque devem priorizar leitura rápida com baixa altura.
- Dashboards de entidades principais devem usar Hero Cards com CTA principal destacado; informações de resumo vêm antes das ações administrativas, que devem ficar em área separada.
- E-mail e WhatsApp são canais do mesmo convite; a interface não deve sugerir que reenviar por outro canal cria convite ou código diferente
- Todo campo de seleção (dropdown) deve possuir indicação visual clara (ex: ícone de seta) para melhorar a usabilidade

## Acesso no frontend
- Centralizar guardas de rota, landing page e menu a partir de perfil e estado do usuário
- Rotas públicas de leitura devem permanecer acessíveis para visitante e usuário logado; botões de criação/edição/exclusão só aparecem quando o usuário pode executar a ação
- Páginas públicas não devem exibir e-mail ou dados pessoais sensíveis sem permissão explícita; manter estados vazios/ocultos sem quebrar ranking, partidas e dashboards
- Perfis principais: Visitante, Atleta, Organizador e Administrador
- Estados de acesso podem incluir `PrimeiroAcesso`, `CadastroIncompleto` e `Ativo`; se a API ainda não expuser o estado de forma explícita, o frontend pode inferi-lo de maneira previsível a partir da sessão atual
- `Meu Perfil` é a tela padrão para conclusão de `PrimeiroAcesso` e de `CadastroIncompleto`
- Organizador e administrador não devem ser forçados a criar atleta para concluir o acesso
- Preservar as rotas existentes sempre que possível; preferir aliases e redirecionamentos pontuais a uma quebra ampla de URLs
- No mobile autenticado, priorizar layout mobile first com header simples e bottom navigation fixa; evitar sidebar, rodapé tradicional e menu hambúrguer como navegação principal.

## Testes E2E
- Testes E2E do Web usam Playwright e ficam em `e2e`.
- Priorizar seletores resilientes: `getByRole`, `getByLabel` e `getByPlaceholder`.
- Usar `data-testid` apenas quando nomes acessíveis repetidos tornarem o seletor ambíguo.
