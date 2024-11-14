import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { Game, Player, Question } from '../types/game';

export default function GameRoom() {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const isHost = searchParams.get('host') === 'true';
  const playerId = searchParams.get('playerId');

  const [game, setGame] = useState<Game | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!gameId) return;

    // Verify player access
    if (!isHost && !playerId) {
      toast.error('Unauthorized access');
      navigate('/');
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'games', gameId), (doc) => {
      if (!doc.exists()) {
        toast.error('Game not found');
        navigate('/');
        return;
      }

      const data = doc.data() as Game;
      
      // Verify player is part of the game
      if (!isHost && !data.players.find(p => p.id === playerId)) {
        toast.error('Player not found in game');
        navigate('/');
        return;
      }

      setGame(data);

      if (data.status === 'active' && data.currentQuestion !== undefined) {
        setCurrentQuestion(data.questions[data.currentQuestion]);
        setTimeLeft(data.questions[data.currentQuestion].timeLimit);
      }
    });

    return () => unsubscribe();
  }, [gameId, isHost, playerId, navigate]);

  useEffect(() => {
    if (!timeLeft || !currentQuestion) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (isHost) {
            showAnswer();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, currentQuestion, isHost]);

  const handleAnswer = async (answerIndex: number) => {
    if (!game || !currentQuestion || selectedAnswer !== null || !playerId) return;

    setSelectedAnswer(answerIndex);
    const answerTime = Date.now();

    try {
      const playerIndex = game.players.findIndex((p) => p.id === playerId);
      if (playerIndex === -1) return;

      const newPlayers = [...game.players];
      const scoreIncrement = answerIndex === currentQuestion.correctAnswer ? 
        Math.ceil((timeLeft / currentQuestion.timeLimit) * 1000) : 0;

      newPlayers[playerIndex] = {
        ...newPlayers[playerIndex],
        score: newPlayers[playerIndex].score + scoreIncrement,
        lastAnswerTime: answerTime
      };

      await updateDoc(doc(db, 'games', gameId!), {
        players: newPlayers
      });
    } catch (error) {
      toast.error('Failed to submit answer');
    }
  };

  const showAnswer = async () => {
    if (!isHost) return;
    
    setShowResults(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    if (!game) return;

    const nextQuestionIndex = (game.currentQuestion || 0) + 1;
    if (nextQuestionIndex >= game.questions.length) {
      await updateDoc(doc(db, 'games', gameId!), {
        status: 'finished'
      });
    } else {
      await updateDoc(doc(db, 'games', gameId!), {
        currentQuestion: nextQuestionIndex,
        startTime: Date.now()
      });
      setShowResults(false);
      setSelectedAnswer(null);
    }
  };

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-2xl text-white">Loading game...</div>
      </div>
    );
  }

  if (game.status === 'finished') {
    const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">Final Results</h2>
          <div className="space-y-4">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-gray-700">#{index + 1}</span>
                  <span className="text-lg font-medium">{player.name}</span>
                </div>
                <span className="text-xl font-bold text-indigo-600">{player.score}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full mt-6 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-2xl text-white">Waiting for host to start...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-8 bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold text-indigo-600">
            Question {(game.currentQuestion || 0) + 1}/{game.questions.length}
          </div>
          <div className="text-xl font-mono bg-gray-100 px-4 py-2 rounded-lg">
            {timeLeft}s
          </div>
        </div>

        <div className="text-2xl font-medium text-center mb-8">
          {currentQuestion.text}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={selectedAnswer !== null || isHost}
              className={`p-4 text-lg font-medium rounded-xl transition-colors ${
                showResults
                  ? index === currentQuestion.correctAnswer
                    ? 'bg-green-500 text-white'
                    : index === selectedAnswer
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100'
                  : selectedAnswer === index
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {showResults && (
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">Current Standings</h3>
            <div className="space-y-2">
              {[...game.players]
                .sort((a, b) => b.score - a.score)
                .map((player) => (
                  <div
                    key={player.id}
                    className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                  >
                    <span>{player.name}</span>
                    <span className="font-bold">{player.score}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {isHost && !showResults && (
          <button
            onClick={showAnswer}
            className="w-full mt-4 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Show Answer
          </button>
        )}
      </div>
    </div>
  );
}