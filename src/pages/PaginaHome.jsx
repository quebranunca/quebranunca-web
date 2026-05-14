import { PartidaGeralContainer } from '../containers/partidas/PartidaGeralContainer';
import { Atleta } from '../components/atleta/Atleta';
import { HomeResumoUsuario } from '../components/home/HomeResumoUsuario';

export function PaginaHome() {
  return (
    <section className="home-secao">  

      <Atleta />        
      
      <PartidaGeralContainer />

    </section>    
  );
}