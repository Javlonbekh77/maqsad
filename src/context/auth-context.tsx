
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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
          // Attempt to fetch the user profile from Firestore.
          const appUser = await getUserById(fbUser.uid);
          if (appUser) {
            setUser(appUser);
          } else {
            // This case can happen if the Firestore document is not yet created after signup.
            // We will not log the user out, but the 'user' state will remain null.
            // Components should handle this state gracefully.
             console.warn(`User document not found for UID: ${fbUser.uid}. The user might be new or data is still propagating.`);
            setUser(null);
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
          // In case of error, reset user state and log out to be safe
          setUser(null);
          setFirebaseUser(null);
          await signOut(auth);
        } finally {
           setLoading(false);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
     return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (data: Omit<User, 'id' | 'firebaseId' | 'avatarUrl' | 'coins' | 'goals' | 'habits' | 'groups' | 'taskHistory' | 'fullName' | 'occupation'> & { password?: string }) => {
    if (!data.email || !data.password) {
      throw new Error("Email and password are required for signup.");
    }
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const { password, ...profileData } = data;

    try {
        await createUserProfile(userCredential.user.uid, profileData);
        // Manually set the user state after signup to avoid waiting for onAuthStateChanged
        const newUser = await getUserById(userCredential.user.uid);
        if (newUser) {
          setUser(newUser);
        }
    } catch (dbError) {
        console.error("Failed to create user profile in Firestore:", dbError);
        // Optional: Delete the created Firebase Auth user to allow re-signup
        await userCredential.user.delete();
        throw new Error("User created in Auth, but failed to save profile to database. The user has been rolled back.");
    }
    
    return userCredential;
  };

  const logout = async () => {
    await signOut(auth);
    // Reset state immediately
    setUser(null);
    setFirebaseUser(null);
    setLoading(false); // No longer loading as we are logged out
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
