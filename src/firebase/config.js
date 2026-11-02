import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBDiLdNxmDPkMWu1ZbrgHX5rBnYoB1-kQM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'gym-erp-demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'gym-erp-demo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'gym-erp-demo.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1042216377771',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1042216377771:web:d4489d45b7e4d6097e46ee',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
