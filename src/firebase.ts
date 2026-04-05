import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, collection, onSnapshot, query, where, orderBy, limit, setDoc, updateDoc, deleteDoc, addDoc, getDoc, getDocs, arrayUnion, arrayRemove, increment, writeBatch } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Connection test
export async function checkConnection() {
  try {
    await getDocFromServer(doc(db, 'settings', 'features'));
    return { success: true };
  } catch (error: any) {
    if (error.message.includes('the client is offline')) {
      return { success: false, error: 'Klient jest offline. Sprawdź konfigurację Firebase.' };
    }
    return { success: false, error: error.message };
  }
}
checkConnection();

export { signInWithPopup, signOut, onAuthStateChanged, type User, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile };
export { collection, onSnapshot, query, where, orderBy, limit, setDoc, updateDoc, deleteDoc, addDoc, getDoc, getDocs, doc, arrayUnion, arrayRemove, increment, writeBatch };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
