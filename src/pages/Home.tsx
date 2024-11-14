import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Users } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">QuizMaster</h1>
          <p className="text-gray-600">Host or join an interactive quiz game</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/host')}
            className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white px-6 py-4 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Gamepad2 className="w-6 h-6" />
            <span className="text-lg font-semibold">Host a Game</span>
          </button>

          <button
            onClick={() => navigate('/join')}
            className="w-full flex items-center justify-center gap-3 bg-purple-600 text-white px-6 py-4 rounded-xl hover:bg-purple-700 transition-colors"
          >
            <Users className="w-6 h-6" />
            <span className="text-lg font-semibold">Join a Game</span>
          </button>
        </div>
      </div>
    </div>
  );
}