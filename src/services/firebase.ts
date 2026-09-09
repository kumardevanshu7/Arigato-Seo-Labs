import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import type { KeywordItem, SeoCategory, UserProfile, SecuritySettings } from '../types/seo';

// Firebase configuration with environment variable support & production fallbacks
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBG0HNIRMsveBLm7fl2FFvyKxP_XJEyNfI',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'pro6-arigatoseolabs.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'pro6-arigatoseolabs',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'pro6-arigatoseolabs.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '345690547077',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:345690547077:web:d79281156819e17aafdaec',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-1EMPJE3XCJ',
};

// Initialize Firebase App singleton
export const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Cloud Firestore instance
export const db: Firestore = getFirestore(firebaseApp);

// Initialize Firebase Authentication instance
export const auth = getAuth(firebaseApp);

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

/**
 * Sign out current authenticated user
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Listen to auth state changes
 */
export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Save user profile (name, gender, onboarding state)
 * Path: /users/{userId}/profile/data
 */
export async function saveUserProfile(
  userId: string,
  profile: Partial<UserProfile>
): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'profile', 'data');
    await setDoc(
      docRef,
      {
        ...profile,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('[Firestore] Error saving user profile:', error);
    throw error;
  }
}

/**
 * Fetch user profile from Cloud Firestore
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, 'users', userId, 'profile', 'data');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('[Firestore] Error fetching user profile:', error);
    return null;
  }
}

/**
 * Save security settings (Keyword Lock passcode)
 * Path: /users/{userId}/settings/security
 */
export async function saveSecuritySettings(
  userId: string,
  settings: SecuritySettings
): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'settings', 'security');
    await setDoc(docRef, settings, { merge: true });
  } catch (error) {
    console.error('[Firestore] Error saving security settings:', error);
    throw error;
  }
}

/**
 * Fetch security settings (Keyword Lock passcode)
 */
export async function fetchSecuritySettings(userId: string): Promise<SecuritySettings | null> {
  try {
    const docRef = doc(db, 'users', userId, 'settings', 'security');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as SecuritySettings;
    }
    return null;
  } catch (error) {
    console.error('[Firestore] Error fetching security settings:', error);
    return null;
  }
}

/**
 * Save keywords collection to User-isolated Cloud Firestore
 * Document path: /users/{userId}/keywords/{category}
 */
export async function saveKeywordsToFirestore(
  userId: string,
  category: SeoCategory,
  keywords: KeywordItem[]
): Promise<void> {
  if (!userId) {
    console.warn('[Firestore] Skipped save: No authenticated user ID.');
    return;
  }
  try {
    const docRef = doc(db, 'users', userId, 'keywords', category);
    await setDoc(docRef, {
      category,
      items: keywords,
      updatedAt: new Date().toISOString(),
    });
    console.log(`[Firestore] Saved ${keywords.length} ${category} keywords for user ${userId}.`);
  } catch (error) {
    console.error(`[Firestore] Error saving ${category} keywords:`, error);
    throw error;
  }
}

/**
 * Fetch keywords from User-isolated Cloud Firestore
 */
export async function fetchKeywordsFromFirestore(
  userId: string,
  category: SeoCategory
): Promise<KeywordItem[] | null> {
  if (!userId) return null;
  try {
    const docRef = doc(db, 'users', userId, 'keywords', category);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return Array.isArray(data.items) ? (data.items as KeywordItem[]) : [];
    }
    return null;
  } catch (error) {
    console.error(`[Firestore] Error fetching ${category} keywords:`, error);
    return null;
  }
}

/**
 * Real-time subscription to keywords updates in User-isolated Cloud Firestore
 */
export function subscribeToKeywords(
  userId: string,
  category: SeoCategory,
  onUpdate: (keywords: KeywordItem[]) => void
): () => void {
  if (!userId) return () => {};
  try {
    const docRef = doc(db, 'users', userId, 'keywords', category);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.items)) {
            onUpdate(data.items as KeywordItem[]);
          }
        }
      },
      (error) => {
        console.warn(`[Firestore] Real-time listener warning for ${category}:`, error.message);
      }
    );
  } catch (error) {
    console.error(`[Firestore] Failed to attach listener for ${category}:`, error);
    return () => {};
  }
}

