import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/RegisterGame.module.css';
import api from '../api/api';
import Navbar from "../components/Navbar";

export default function RegisterGame() {
  const [jogadorLogado, setJogadorLogado] = useState({ nome: '', email: '', id: '' });
  const [teamAPlayer1, setTeamAPlayer1] = useState('');
  const [teamAPlayer2, setTeamAPlayer2] = useState('');
  const [teamBPlayer1, setTeamBPlayer1] = useState('');
  const [teamBPlayer2, setTeamBPlayer2] = useState('');
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');

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
        setJogadorLogado({
          nome: data.nome,
          email: data.email,
          id: data.id
        });
      })
      .catch(err => {
        console.error("Erro ao carregar jogador:", err);
        alert("Erro ao carregar dados do jogador logado.");
      }
    );
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const gameData = {
      timeA: [jogadorLogado.id, teamAPlayer2],
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

  const handleBack = () => {
    navigate('/home');
  };

  return ( 
  <>
    <Navbar />
    <div className={styles.container}>
      <h1 className={styles.title}>Registrar Jogo</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          value={jogadorLogado.nome}
          disabled
          className={styles.input}
        />
        <input
          type="text"
          placeholder="Jogador 2 (Dupla A)"
          value={teamAPlayer2}
          onChange={(e) => setTeamAPlayer2(e.target.value)}
          className={styles.input}
          required
        />
        <input
          type="text"
          placeholder="Jogador 1 (Dupla B)"
          value={teamBPlayer1}
          onChange={(e) => setTeamBPlayer1(e.target.value)}
          className={styles.input}
          required
        />
        <input
          type="text"
          placeholder="Jogador 2 (Dupla B)"
          value={teamBPlayer2}
          onChange={(e) => setTeamBPlayer2(e.target.value)}
          className={styles.input}
          required
        />
        <input
          type="number"
          placeholder="Placar Dupla A"
          value={scoreA}
          onChange={(e) => setScoreA(e.target.value)}
          className={styles.input}
          required
        />
        <input
          type="number"
          placeholder="Placar Dupla B"
          value={scoreB}
          onChange={(e) => setScoreB(e.target.value)}
          className={styles.input}
          required
        />
        <button type="submit" className={styles.button}>
          Registrar Jogo
        </button>
          <button onClick={handleBack} className={styles.button}>
        Voltar
      </button>
      </form>
    </div>
  </>
  );
}