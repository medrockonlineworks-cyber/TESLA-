import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function signInWithGooglePopup() {
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}
