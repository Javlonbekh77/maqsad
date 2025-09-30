
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, type User as FirebaseUser, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserById, createUserProfile } from '@/lib/data';
import type { User } from '@/lib/types';
import { useRouter } from '@/navigation';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (data: Omit<User, 'id' | 'firebaseId' | 'avatarUrl' | 'coins' | 'goals' | 'habits' | 'groups' | 'taskHistory' | 'fullName' | 'occupation'> & { password?: string }) => Promise<any>;
  logout: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true); 
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          const appUser = await getUserById(fbUser.uid);
          if (appUser) {
            setUser(appUser);
          } else {
             // This is a critical point. If the user is in Auth but not in Firestore,
             // it means profile creation might have failed or is pending.
             // We'll create it now to be safe.
            console.warn("User document not found in Firestore for UID:", fbUser.uid, "Attempting to create it.");
            const profileData = {
                email: fbUser.email || '',
                firstName: fbUser.displayName?.split(' ')[0] || 'New',
                lastName: fbUser.displayName?.split(' ')[1] || 'User',
            };
            const newAppUser = await createUserProfile(fbUser.uid, profileData);
            setUser(newAppUser);
          }
        } catch (error) {
            console.error("Failed to fetch or create user profile:", error);
            setUser(null);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (email: string, password: string) => {
    // To ensure the test user exists in Firebase Auth for the demo
    if (email === 'test@example.com') {
      return signInWithEmailAndPassword(auth, email, password).catch(error => {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          console.log('Test user not found, creating it...');
          return createUserWithEmailAndPassword(auth, email, password);
        }
        throw error;
      });
    }
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (data: Omit<User, 'id' | 'firebaseId' | 'avatarUrl' | 'coins' | 'goals' | 'habits' | 'groups' | 'taskHistory' | 'fullName' | 'occupation'> & { password?: string }) => {
    if (!data.email || !data.password) {
      throw new Error("Email and password are required for signup.");
    }
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    
    const { password, ...profileData } = data;

    await createUserProfile(userCredential.user.uid, profileData);
    
    // Manually set the user state after signup to avoid waiting for onAuthStateChanged
    const newUser = await getUserById(userCredential.user.uid);
    if (newUser) {
      setUser(newUser);
    }
    
    return userCredential;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
