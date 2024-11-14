import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Copy, Users } from 'lucide-react';
import { Game, Player } from '../types/game';

const sampleQuestions = [
  {
    id: '1',
    text: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswer: 2,
    timeLimit: 30
  },
  {
    id: '2',
    text: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctAnswer: 1,
    timeLimit: 30
  },
  {
    id: '3',
    text: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: 1,
    timeLimit: 30
  }
];

export default function HostGame() {
  const navigate = useNavigate();
  const [gameId, setGameId] = useState<string>('');
  const [gamePin, setGamePin] = useState<string>(Math.random().toString(36).substring(2, 8).toUpperCase());
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const initializeGame = async () => {
      try {
        const hostId = crypto.randomUUID();
        const gameData: Partial<Game> = {
          pin: gamePin,
          hostId,
          status: 'waiting',
          players: [],
          questions: sampleQuestions
        };

        const docRef = await addDoc(collection(db, 'games'), gameData);
        setGameId(docRef.id);

        const unsubscribe = onSnapshot(doc(db, 'games', docRef.id), (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as Game;
            setPlayers(data.players || []);
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error creating game:', error);
        toast.error('Failed to create game');
        navigate('/');
      }
    };

    initializeGame();
  }, [navigate, gamePin]);

  const copyGamePin = () => {
    navigator.clipboard.writeText(gamePin);
    toast.success('Game PIN copied to clipboard!');
  };

  const startGame = async () => {
    if (players.length < 1) {
      toast.error('Need at least one player to start');
      return;
    }

    try {
      await updateDoc(doc(db, 'games', gameId), {
        status: 'active',
        currentQuestion: 0,
        startTime: Date.now()
      });
      navigate(`/game/${gameId}?host=true`);
    } catch (error) {
      toast.error('Failed to start game');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </button>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Game Lobby</h2>
          
          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-600 mb-2">Game PIN:</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-mono font-bold text-indigo-600">{gamePin}</span>
              <button
                onClick={copyGamePin}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                title="Copy PIN"
              >
                <Copy className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 text-gray-700 mb-4">
              <Users className="w-5 h-5" />
              <span className="font-medium">Players ({players.length})</span>
            </div>
            {players.length === 0 ? (
              <div className="text-gray-500 italic">Waiting for players to join...</div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="bg-gray-50 p-3 rounded-lg shadow-sm"
                  >
                    {player.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={startGame}
            disabled={players.length === 0}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {players.length === 0 ? 'Waiting for Players...' : 'Start Game'}
          </button>
        </div>
      </div>
    </div>
  );
}