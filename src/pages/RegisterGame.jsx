import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/RegisterGame.module.css';
import api from '../api/api';
import Navbar from "../components/Navbar";

export default function RegisterGame() {
  const [jogadorLogado, setJogadorLogado] = useState({ nome: '', email: '', id: '' });
  const [grupoNome, setGrupoNome] = useState('');
  const [teamAPlayer2, setTeamAPlayer2] = useState('');
  const [teamBPlayer1, setTeamBPlayer1] = useState('');
  const [teamBPlayer2, setTeamBPlayer2] = useState('');
  const [teamAPlayer2Id, setTeamAPlayer2Id] = useState('');
  const [teamBPlayer1Id, setTeamBPlayer1Id] = useState('');
  const [teamBPlayer2Id, setTeamBPlayer2Id] = useState('');
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');

  const [sugestoesA2, setSugestoesA2] = useState([]);
  const [sugestoesB1, setSugestoesB1] = useState([]);
  const [sugestoesB2, setSugestoesB2] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      alert("Token não encontrado. Faça login novamente.");
      navigate('/login');
      return;
    }

    api.get("/jogadores/me")
      .then(res => {
        const data = res.data;
        setJogadorLogado({ nome: data.nome, email: data.email, id: data.id });
      })
      .catch(err => {
        console.error("Erro ao carregar jogador:", err);
        alert("Erro ao carregar dados do jogador logado.");
      });
  }, [navigate]);

  const buscarJogadores = (texto, setSugestoes) => {
    if (texto.length >= 3) {
      api.get(`/jogadores/buscar?prefixo=${texto}`)
        .then(res => setSugestoes(res.data))
        .catch(() => setSugestoes([]));
    } else {
      setSugestoes([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const gameData = {
      grupoNome,
      timeA: [jogadorLogado.nome, teamAPlayer2],
      timeB: [teamBPlayer1, teamBPlayer2],
      placarA: Number(scoreA),
      placarB: Number(scoreB),
    };

    try {
      const response = await api.post("/jogos", gameData);
      console.log('Jogo registrado com sucesso:', response.data);
      navigate('/home');
    } catch (error) {
      console.error('Erro ao registrar o jogo:', error);
      alert('Erro ao registrar o jogo. Verifique os dados e tente novamente.');
    }
  };

  const handleBack = () => navigate('/home');

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <h1 className={styles.title}>Registrar Jogo</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            placeholder="Nome do Grupo"
            value={grupoNome}
            onChange={(e) => setGrupoNome(e.target.value)}
            className={styles.input}
            required
          />

          <input type="text" value={jogadorLogado.nome} disabled className={styles.input} />

          <input
            type="text"
            list="sugestoes-a2"
            placeholder="Jogador 2 (Dupla A)"
            value={teamAPlayer2}
            onChange={(e) => {
              const nome = e.target.value;
              setTeamAPlayer2(nome);
              buscarJogadores(nome, setSugestoesA2);
              const jogador = sugestoesA2.find(j => j.nome === nome);
              setTeamAPlayer2Id(jogador?.id || '');
            }}
            className={styles.input}
            required
          />
          <datalist id="sugestoes-a2">
            {sugestoesA2.map(j => <option key={j.id} value={j.nome} />)}
          </datalist>

          <input
            type="number"
            placeholder="Placar Dupla A"
            value={scoreA}
            onChange={(e) => setScoreA(e.target.value)}
            className={styles.input}
            required
          />

          <input
            type="text"
            list="sugestoes-b1"
            placeholder="Jogador 1 (Dupla B)"
            value={teamBPlayer1}
            onChange={(e) => {
              const nome = e.target.value;
              setTeamBPlayer1(nome);
              buscarJogadores(nome, setSugestoesB1);
              const jogador = sugestoesB1.find(j => j.nome === nome);
              setTeamBPlayer1Id(jogador?.id || '');
            }}
            className={styles.input}
            required
          />
          <datalist id="sugestoes-b1">
            {sugestoesB1.map(j => <option key={j.id} value={j.nome} />)}
          </datalist>

          <input
            type="text"
            list="sugestoes-b2"
            placeholder="Jogador 2 (Dupla B)"
            value={teamBPlayer2}
            onChange={(e) => {
              const nome = e.target.value;
              setTeamBPlayer2(nome);
              buscarJogadores(nome, setSugestoesB2);
              const jogador = sugestoesB2.find(j => j.nome === nome);
              setTeamBPlayer2Id(jogador?.id || '');
            }}
            className={styles.input}
            required
          />
          <datalist id="sugestoes-b2">
            {sugestoesB2.map(j => <option key={j.id} value={j.nome} />)}
          </datalist>

          <input
            type="number"
            placeholder="Placar Dupla B"
            value={scoreB}
            onChange={(e) => setScoreB(e.target.value)}
            className={styles.input}
            required
          />

          <button type="submit" className={styles.button}>Registrar Jogo</button>
          <button onClick={handleBack} className={styles.button}>Voltar</button>
        </form>
      </div>
    </>
  );
}