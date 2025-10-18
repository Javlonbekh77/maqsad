'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { auth, db } from '@/lib/firebase';

type SignupData = Omit<User, 'id' | 'firebaseId' | 'coins' | 'goals' | 'habits' | 'groups' | 'taskHistory' | 'fullName' | 'occupation' | 'createdAt'> & { password: string; avatarUrl: string; };

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (data: SignupData) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const appUser = { ...docSnap.data(), id: docSnap.id, firebaseId: docSnap.id } as User;
            setUser(appUser);
          } else {
             // This might happen if user is created in auth but not in firestore yet
             // The signup function should handle creating the user doc.
             // We can attempt to fetch again after a short delay, or rely on signup to set the user.
            setUser(null);
          }
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

  const signup = async (data: SignupData) => {
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const { password, ...profileData } = data;
    
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();

    const newUser: User = {
      id: userCredential.user.uid,
      firebaseId: userCredential.user.uid,
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: fullName,
      email: data.email,
      avatarUrl: data.avatarUrl,
      coins: 0,
      goals: '',
      habits: '',
      groups: [],
      occupation: data.specialization || '',
      taskHistory: [],
      university: data.university || '',
      specialization: data.specialization || '',
      course: data.course || '',
      telegram: data.telegram || '',
      createdAt: serverTimestamp(),
    };
    
    await setDoc(userDocRef, newUser);
    setUser(newUser); // Immediately set user state after creation
    
    return userCredential;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
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
