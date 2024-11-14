import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

export default function JoinGame() {
  const navigate = useNavigate();
  const [gamePin, setGamePin] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Find game by PIN instead of using PIN as document ID
      const gamesRef = collection(db, 'games');
      const q = query(gamesRef, where('pin', '==', gamePin.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast.error('Game not found!');
        return;
      }

      const gameDoc = querySnapshot.docs[0];
      const gameData = gameDoc.data();

      if (gameData.status !== 'waiting') {
        toast.error('Game has already started!');
        return;
      }

      const playerId = crypto.randomUUID();
      await updateDoc(gameDoc.ref, {
        players: arrayUnion({
          id: playerId,
          name: playerName,
          score: 0
        })
      });

      navigate(`/game/${gameDoc.id}?playerId=${playerId}`);
    } catch (error) {
      console.error('Error joining game:', error);
      toast.error('Failed to join game');
    } finally {
      setLoading(false);
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

        <h2 className="text-3xl font-bold text-center text-gray-900">Join a Game</h2>

        <form onSubmit={handleJoinGame} className="space-y-6">
          <div>
            <label htmlFor="gamePin" className="block text-sm font-medium text-gray-700">
              Game PIN
            </label>
            <input
              type="text"
              id="gamePin"
              value={gamePin}
              onChange={(e) => setGamePin(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit PIN"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              maxLength={6}
              required
            />
          </div>

          <div>
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-700">
              Your Name
            </label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Joining...' : 'Join Game'}
          </button>
        </form>
      </div>
    </div>
  );
}