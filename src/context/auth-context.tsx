
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserById, createUserProfile } from '@/lib/data';
import type { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (data: Omit<User, 'id' | 'firebaseId' | 'avatarUrl' | 'coins' | 'goals' | 'habits' | 'groups' | 'taskHistory' | 'fullName' | 'occupation'> & { password: string }) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const appUser = await getUserById(fbUser.uid);
          setUser(appUser || null);
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const login = (email: string, password: string) => {
     return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (data: Omit<User, 'id' | 'firebaseId' | 'avatarUrl' | 'coins' | 'goals' | 'habits' | 'groups' | 'taskHistory' | 'fullName' | 'occupation'> & { password: string }) => {
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const { password, ...profileData } = data;
    await createUserProfile(userCredential.user, profileData);
    return userCredential;
  };

  const logout = async () => {
    return await signOut(auth);
  };

  const value = { user, firebaseUser, loading, login, signup, logout };

  return (
    <AuthContext.Provider value={value}>
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
