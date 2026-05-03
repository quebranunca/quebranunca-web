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

## Fluxos já adotados
- `Competições` já concentra atalhos para categorias e inscrições; preservar esse papel antes de criar navegação paralela
- `Locais` é cadastro próprio e `Competições` apenas referencia o local escolhido
- `Inscrições` aceita dupla existente ou criação no fluxo a partir de `Jogador 1` e `Jogador 2`
- `Meu Perfil` existe para qualquer usuário e concentra vínculo `Usuario` ↔ `Atleta`
- Usuário comum (`Atleta`) não vincula atleta existente; cria apenas o próprio atleta com o mesmo nome e e-mail do usuário
- `Competições` para atleta funciona como vitrine de campeonatos com inscrições abertas; para gestor continua sendo tela de gestão
- `Inscrições` para atleta permite escolher campeonato/categoria e se inscrever com dupla própria ou parceiro ainda pendente
- `Usuários` existe apenas para administrador; esconder rota e menu fora desse perfil
- `Partidas` deve exibir a tabela de jogos da categoria; administrador e organizador podem gerar/alterar jogos, respeitando ownership da competição
- `Partidas` em grupo deve permitir fluxo único: frontend coleta nomes completos ou seleção de atletas existentes, e a API reaproveita ou cria atleta e dupla no próprio registro da partida
- Em dupla eliminação, `Partidas` deve deixar claro se o jogo pertence à chave vencedora, perdedora, final ou final reset
- `Ranking` já possui modos de liga e competição; o da liga é consolidado e o da competição segue separado por categoria
- `Ranking` deve exibir atletas sem usuário como pendentes no mesmo ranking, sem tela ou cálculo paralelo de pontos
- `Pendências` centraliza aprovar/contestar partidas e completar contato de atleta pendente; o frontend só reflete as pendências e ações retornadas pela API
- `Modelos de importação` já oferece download e upload CSV por tipo de cadastro
- Aceite de convite deve tratar o código no formato curto `000-000`, sem depender do frontend para definir perfil, validade ou regras de uso do convite
- E-mail e WhatsApp são canais do mesmo convite; a interface não deve sugerir que reenviar por outro canal cria convite ou código diferente
- Todo campo de seleção (dropdown) deve possuir indicação visual clara (ex: ícone de seta) para melhorar a usabilidade

## Acesso no frontend
- Centralizar guardas de rota, landing page e menu a partir de perfil e estado do usuário
- Perfis principais: Visitante, Atleta, Organizador e Administrador
- Estados de acesso podem incluir `PrimeiroAcesso`, `CadastroIncompleto` e `Ativo`; se a API ainda não expuser o estado de forma explícita, o frontend pode inferi-lo de maneira previsível a partir da sessão atual
- `Meu Perfil` é a tela padrão para conclusão de `PrimeiroAcesso` e de `CadastroIncompleto`
- Organizador e administrador não devem ser forçados a criar atleta para concluir o acesso
- Preservar as rotas existentes sempre que possível; preferir aliases e redirecionamentos pontuais a uma quebra ampla de URLs
