import { useEffect, useState } from 'react';
import { useAutenticacao } from '../hooks/useAutenticacao';
import { AvatarUsuario, obterFotoPerfilAvatar } from '../components/AvatarUsuario';
import { extrairMensagemErro } from '../utils/erros';
import { nomePerfil } from '../utils/perfis';
import { obterNomeExibicaoAtletaPerfil } from '../utils/atletaUtils';

export function PaginaPerfilUsuario() {
  const { usuario, recarregarUsuario } = useAutenticacao();
  const [usuarioDetalhe, setUsuarioDetalhe] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarPerfilUsuario();
  }, [usuario?.id]);

  async function carregarPerfilUsuario() {
    setCarregando(true);
    setErro('');

    try {
      if (!usuario) {
        setUsuarioDetalhe(null);
        return;
      }

      const dadosUsuario = await recarregarUsuario();
      setUsuarioDetalhe(dadosUsuario);
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) {
    return (
      <section className="pagina">
        <div className="cabecalho-pagina">
          <h2>Perfil Usuário</h2>
          <p>Carregando dados do usuário...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="pagina">
      <div className="cabecalho-pagina">
        <h2>Perfil Usuário</h2>
      </div>

      {erro && <p className="texto-erro">{erro}</p>}

      <div className="cartao-lista">
        <h3>Informações do usuário</h3>
      </div>

      <div className="cartao-lista">
        <div className="perfil-usuario-identidade">
          <AvatarUsuario
            nome={usuarioDetalhe?.nome || usuario?.nome}
            fotoPerfilUrl={obterFotoPerfilAvatar(usuarioDetalhe) || obterFotoPerfilAvatar(usuario)}
            tamanho="lg"
            className="perfil-usuario-avatar"
          />
          <div>
            <p>Nome: {usuarioDetalhe?.nome || usuario?.nome}</p>
            <p>Perfil: {nomePerfil(usuarioDetalhe?.perfil || usuario?.perfil)}</p>
          </div>
        </div>
        <p>E-mail: {usuarioDetalhe?.email || usuario?.email}</p>
        <p>Atleta vinculado: {obterNomeExibicaoAtletaPerfil(usuarioDetalhe?.atleta) || 'Nenhum atleta vinculado'}</p>
      </div>
    </section>
  );
}
