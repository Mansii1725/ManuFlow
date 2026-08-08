import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Default config from firebase-applet-config.json or prompt config
let firebaseConfig = {
  apiKey: "AIzaSyDj9K2p0MLhBZ6oHGTEi5D9sJL9LtAg4EQ",
  authDomain: "fundamental-jigsaw-3mbw7.firebaseapp.com",
  projectId: "fundamental-jigsaw-3mbw7",
  storageBucket: "fundamental-jigsaw-3mbw7.firebasestorage.app",
  messagingSenderId: "540711315608",
  appId: "1:540711315608:web:8b7c71432ca22354f408ed"
};

let customDatabaseId = "ai-studio-manufacturingmrp-8fd9f608-b5a6-4034-9857-443c898ae255";

try {
  // Try importing config if runtime supports or standard JSON
  const config = import('../../firebase-applet-config.json');
  if (config) {
    // using loaded configuration
  }
} catch (e) {
  // fallback
}

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, customDatabaseId);
