import { useNavigate } from 'react-router-dom';
import styles from '../styles/Home.module.css';
import { useEffect, useState } from 'react';
import API_URL from '../api/api';
import Navbar from '../components/Navbar'; 

export default function Home() {
    const navigate = useNavigate();
    const [ranking, setRanking] = useState([]);
    const [lastGame, setLastGame] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const resRanking = await fetch(`${API_URL}/ranking`);
                const resGame = await fetch(`${API_URL}/jogos/ultimo`);
                
                const rankingData = await resRanking.json();
                const lastGameData = await resGame.json();

                setRanking(rankingData);
                setLastGame(lastGameData);
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
            }
        }
           fetchData();
    }, []);

    const handleLogout = () => {
        navigate('/login');
    };

    return (
        <>
            <Navbar />
            <div className={styles.container}>
            <h1 className={styles.title}>Ranking</h1>
            <ul className={styles.rankingList}>
                {ranking.map((player, index) => (
                <li key={index}>
                    {index + 1}º {player.name} - {player.wins} vitórias
                </li>
                ))}
            </ul>

            <h2 className={styles.subtitle}>Último jogo</h2>
            <div className={styles.lastGameBox}>
                {lastGame ? (
                <p>
                    {lastGame.teamA.join(' & ')} {lastGame.scoreA} x {lastGame.scoreB} {lastGame.teamB.join(' & ')}
                </p>
                ) : (
                <p>Nenhum jogo registrado.</p>
                )}
            </div>

            <button onClick={() => navigate('/novo-jogo')} className={styles.button}>
                Novo Jogo
            </button>
            <button onClick={handleLogout} className={styles.button}>
                Sair
            </button>
            </div>
        </>
    );
}
