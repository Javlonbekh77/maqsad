
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, type User as FirebaseUser } from 'firebase/auth';
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
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true); // Always start with loading state
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          const appUser = await getUserById(fbUser.uid);
          if (appUser) {
            setUser(appUser);
          } else {
             // This case might happen if Firestore profile creation failed or is delayed.
             // For now, we'll treat it as not logged in to the app.
             console.warn("User is authenticated with Firebase but no profile found in Firestore.");
             setUser(null);
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
          setUser(null); // Clear user on error
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false); // End loading state after all async operations are done
    });

    return () => unsubscribe();
  }, []);
  
  const login = (email: string, password: string) => {
     return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (data: Omit<User, 'id' | 'firebaseId' | 'avatarUrl' | 'coins' | 'goals' | 'habits' | 'groups' | 'taskHistory' | 'fullName' | 'occupation'> & { password?: string }) => {
    if (!data.email || !data.password) {
      throw new Error("Email and password are required for signup.");
    }
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const { password, ...profileData } = data;

    // The onAuthStateChanged listener will handle fetching the user data after creation,
    // but we still need to create the profile document.
    await createUserProfile(userCredential.user, profileData);
    
    // The listener will automatically update the state, no need to call fetchAppData here.
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
