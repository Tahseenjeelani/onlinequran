// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDxzYDYSksX-zIzDE8eS34gG-Reugx71LU",
  authDomain: "quranpwa.firebaseapp.com",
  projectId: "quranpwa",
  storageBucket: "quranpwa.firebasestorage.app",
  messagingSenderId: "385785159434",
  appId: "1:385785159434:web:9ea70ad6568f5d5e96e4f3",
  measurementId: "G-36CEN2ZX7K"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

export { db, storage };