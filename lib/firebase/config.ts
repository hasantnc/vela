import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
// @ts-ignore – getReactNativePersistence is exported in the RN bundle but not in the main TS types
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAqpnXtUFODTdpvvGjoE03OKhc3YLQNKBs",
  authDomain: "vela-app-2b08a.firebaseapp.com",
  projectId: "vela-app-2b08a",
  storageBucket: "vela-app-2b08a.firebasestorage.app",
  messagingSenderId: "887243596745",
  appId: "1:887243596745:web:672d3ebc19baab25a17e18",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch {
  auth = getAuth(app);
}
export { auth };
export const db = getFirestore(app);
export default app;