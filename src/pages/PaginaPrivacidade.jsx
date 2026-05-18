export function PaginaPrivacidade() {
  return (
    <section className="pagina pagina-privacidade">
      <div className="cabecalho-pagina">
        <span>QuebraNunca Futevôlei</span>
        <h2>Política de Privacidade</h2>
        <p>
          Esta página resume, em linguagem simples, como a plataforma trata dados pessoais para operar cadastros,
          partidas, rankings e estatísticas.
        </p>
      </div>

      <article className="cartao-lista privacidade-card">
        <h3>Dados coletados</h3>
        <p>
          Coletamos dados necessários para autenticação, identificação esportiva e operação da plataforma, como nome,
          e-mail de acesso, telefone quando informado, dados do atleta, vínculos com grupos, competições, partidas e
          registros de aceite.
        </p>
      </article>

      <article className="cartao-lista privacidade-card">
        <h3>Finalidade</h3>
        <p>
          Os dados são usados para permitir login, convites, cadastro de atletas, inscrições, registro de partidas,
          aprovação de resultados, cálculo de rankings, dashboards esportivos e comunicação operacional da plataforma.
        </p>
      </article>

      <article className="cartao-lista privacidade-card">
        <h3>Localização</h3>
        <p>
          A localização é opcional. Quando autorizada pelo usuário e pelo navegador, pode ser enviada no registro de uma
          partida para apoiar contexto e histórico do jogo. Recusar esse uso não bloqueia o acesso à plataforma.
        </p>
      </article>

      <article className="cartao-lista privacidade-card">
        <h3>Imagem e foto</h3>
        <p>
          O uso de foto ou imagem pessoal depende de consentimento separado. Quando houver foto de perfil, o usuário
          poderá controlar a autorização de uso e solicitar remoção pelos canais do perfil.
        </p>
      </article>

      <article className="cartao-lista privacidade-card">
        <h3>Ranking e estatísticas</h3>
        <p>
          Rankings, partidas e estatísticas preservam o histórico esportivo da plataforma. Mesmo quando uma conta é
          removida, o histórico compartilhado pode ser mantido com dados pessoais anonimizados para não afetar outros
          atletas.
        </p>
      </article>

      <article className="cartao-lista privacidade-card">
        <h3>Alteração ou exclusão</h3>
        <p>
          Usuários autenticados podem revisar preferências de privacidade em Meu Perfil. Para pedir alteração,
          anonimização ou exclusão de dados pessoais, use a opção de exclusão de conta no perfil ou entre em contato com
          a administração da plataforma.
        </p>
      </article>
    </section>
  );
}
