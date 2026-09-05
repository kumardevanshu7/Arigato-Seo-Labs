import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import type { KeywordItem, SeoCategory } from '../types/seo';

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

/**
 * Save keywords collection to Cloud Firestore
 * Document path: /keywords/pinterest or /keywords/site
 */
export async function saveKeywordsToFirestore(
  category: SeoCategory,
  keywords: KeywordItem[]
): Promise<void> {
  try {
    const docRef = doc(db, 'keywords', category);
    await setDoc(docRef, {
      category,
      items: keywords,
      updatedAt: new Date().toISOString(),
    });
    console.log(`[Firestore] Successfully saved ${keywords.length} ${category} keywords to Cloud Firestore.`);
  } catch (error) {
    console.error(`[Firestore] Error saving ${category} keywords:`, error);
    throw error;
  }
}

/**
 * Fetch keywords from Cloud Firestore
 */
export async function fetchKeywordsFromFirestore(
  category: SeoCategory
): Promise<KeywordItem[] | null> {
  try {
    const docRef = doc(db, 'keywords', category);
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
 * Real-time subscription to keywords updates in Cloud Firestore
 */
export function subscribeToKeywords(
  category: SeoCategory,
  onUpdate: (keywords: KeywordItem[]) => void
): () => void {
  try {
    const docRef = doc(db, 'keywords', category);
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
