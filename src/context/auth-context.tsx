
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
      if (fbUser) {
        setFirebaseUser(fbUser);
        // Only fetch user profile if we haven't already.
        if (!user || user.id !== fbUser.uid) {
            try {
              const appUser = await getUserById(fbUser.uid);
              if (appUser) {
                setUser(appUser);
              } else {
                 // This might happen right after signup before the DB document is created.
                 // We will rely on the signup function to set the user manually.
                 console.warn(`User document not found for UID: ${fbUser.uid}. Awaiting creation...`);
                 setUser(null);
              }
            } catch (error) {
              console.error("Failed to fetch user profile:", error);
              setUser(null);
            }
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only once.

  const login = async (email: string, password: string) => {
     setLoading(true);
     return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (data: Omit<User, 'id' | 'firebaseId' | 'avatarUrl' | 'coins' | 'goals' | 'habits' | 'groups' | 'taskHistory' | 'fullName' | 'occupation'> & { password?: string }) => {
    setLoading(true);
    if (!data.email || !data.password) {
      throw new Error("Email and password are required for signup.");
    }
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const { password, ...profileData } = data;

    try {
        await createUserProfile(userCredential.user.uid, profileData);
        // After creating the profile, fetch the new user data to update the context
        const newUser = await getUserById(userCredential.user.uid);
        if (newUser) {
          setUser(newUser);
        } else {
            throw new Error("Failed to retrieve newly created user profile.");
        }
    } catch (dbError) {
        console.error("Failed to create user profile in Firestore:", dbError);
        // Rollback Firebase auth user if DB profile creation fails
        await userCredential.user.delete();
        setUser(null);
        setFirebaseUser(null);
        throw new Error("User creation failed. Could not save profile to database.");
    } finally {
        setLoading(false);
    }
    
    return userCredential;
  };

  const logout = async () => {
    await signOut(auth);
    // Reset state immediately and redirect
    setUser(null);
    setFirebaseUser(null);
    setLoading(true); // Set to loading until redirection is complete
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
