
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
  logout: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchAppData = useCallback(async (fbUser: FirebaseUser | null) => {
    if (fbUser) {
      setFirebaseUser(fbUser);
      try {
        const appUser = await getUserById(fbUser.uid);
        if (appUser) {
          setUser(appUser);
        } else {
          // This can happen if the user record is not yet created in Firestore after signup.
          // We will retry once after a short delay.
           console.warn(`User document not found for UID: ${fbUser.uid}. Retrying...`);
           setTimeout(async () => {
              const retryUser = await getUserById(fbUser.uid);
              setUser(retryUser || null);
              if (!retryUser) console.error("Retry failed. User document not found.");
              setLoading(false);
           }, 2000);
           return; // Keep loading true until retry is complete
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        setUser(null); // Ensure user is null on error
      }
    } else {
      setFirebaseUser(null);
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setLoading(true); // Always set loading to true when auth state changes
      fetchAppData(fbUser);
    });

    return () => unsubscribe();
  }, [fetchAppData]);
  
  const login = (email: string, password: string) => {
     return signInWithEmailAndPassword(auth, email, password);
  };

 const signup = async (data: Omit<User, 'id' | 'firebaseId' | 'avatarUrl' | 'coins' | 'goals' | 'habits' | 'groups' | 'taskHistory' | 'fullName' | 'occupation'> & { password?: string }) => {
    if (!data.email || !data.password) {
      throw new Error("Email and password are required for signup.");
    }
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const { password, ...profileData } = data;

    try {
        // This function MUST NOT be called from the server.
        // The signup flow happens on the client, so this is safe.
        await createUserProfile(userCredential.user, profileData);
        // The onAuthStateChanged listener will handle setting the user state.
    } catch (dbError) {
        console.error("Failed to create user profile in Firestore:", dbError);
        // Best effort to roll back Firebase auth user if DB profile creation fails
        try {
           await userCredential.user.delete();
        } catch (deleteError) {
            console.error("Failed to rollback (delete) Firebase Auth user:", deleteError);
        }
        throw new Error("User creation failed. Could not save profile to database.");
    }
    
    return userCredential;
  };

  const logout = async () => {
    await signOut(auth);
    // The onAuthStateChanged listener will handle clearing user state
    // and the router.push will happen in components that protect routes.
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
