import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBiY-YgKxd8qR6KHPzUzxG2AhXqb9bXcFE",
  authDomain: "stackblitz-quiz.firebaseapp.com",
  projectId: "stackblitz-quiz",
  storageBucket: "stackblitz-quiz.appspot.com",
  messagingSenderId: "850122115982",
  appId: "1:850122115982:web:7c8c8c8c8c8c8c8c8c8c8c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);