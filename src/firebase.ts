import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'vaishnavi-bupara-casting',
  appId: '1:763322264851:web:720ba82b724ff279093ee6',
  storageBucket: 'vaishnavi-bupara-casting.firebasestorage.app',
  apiKey: 'AIzaSyCPFDtJ463qgsTUN_Ma0DShHTtBCUI3sZw',
  authDomain: 'vaishnavi-bupara-casting.firebaseapp.com',
  messagingSenderId: '763322264851',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export const db = getFirestore(app);

export const TEAM_PASSCODE = 'BUPARA2026';
export const LIVE_SHARE_URL = 'https://vaishnavi-bupara-casting.web.app';
