import { Link } from 'react-router-dom';

export function HomeSecaoCabecalho({ titulo, descricao, linkTexto, linkPara }) {
  return (
    <div className="home-secao-cabecalho">
      <div>
        <h3>{titulo}</h3>
        {descricao && <p>{descricao}</p>}
      </div>
      {linkTexto && linkPara && (
        <Link to={linkPara} className="link-acao">
          {linkTexto}
        </Link>
      )}
    </div>
  );
}
