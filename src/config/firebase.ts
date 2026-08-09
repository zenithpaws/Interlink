import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDPF-mzgwCl9qa2mzlnZcD8TPIUjBJGk3k",
  authDomain: "interlink-cf7f0.firebaseapp.com",
  projectId: "interlink-cf7f0",
  storageBucket: "interlink-cf7f0.firebasestorage.app",
  messagingSenderId: "88324823460",
  appId: "1:88324823460:web:833a197083acea9c6f4931",
  measurementId: "G-PYNV06HJ34"
};

// Initialize App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Exports
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
