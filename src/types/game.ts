export interface Player {
  id: string;
  name: string;
  score: number;
  lastAnswerTime?: number;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
}

export interface Game {
  pin: string;
  hostId: string;
  status: 'waiting' | 'active' | 'finished';
  players: Player[];
  currentQuestion?: number;
  questions: Question[];
  startTime?: number;
}