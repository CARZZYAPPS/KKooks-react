import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBJvA5q7ba31qS_ULZLagi8O4bG80vTeRI',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'kkooks-app.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'kkooks-app',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'kkooks-app.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '569396783402',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:569396783402:web:7847e4a45f1f57608bd653'
}

const firebaseReady = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
)

export const app = firebaseReady ? initializeApp(firebaseConfig) : null
export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
export { firebaseReady }
