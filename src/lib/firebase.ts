import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Web app's Firebase configuration provided by user
const firebaseConfig = {
  apiKey: "AIzaSyDudQ7V-ZSR0lBCM0GYJp6crVeNlxkKws0",
  authDomain: "manufacturing-erp-system-b4776.firebaseapp.com",
  projectId: "manufacturing-erp-system-b4776",
  storageBucket: "manufacturing-erp-system-b4776.firebasestorage.app",
  messagingSenderId: "345994281749",
  appId: "1:345994281749:web:ffe36d2506e8fe88559f1c"
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

