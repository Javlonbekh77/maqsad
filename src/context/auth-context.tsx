'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, type User as FirebaseUser, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type SignupData = Omit<User, 'id' | 'firebaseId' | 'coins' | 'silverCoins' | 'goals' | 'habits' | 'groups' | 'taskHistory' | 'fullName' | 'occupation' | 'createdAt' | 'avatarUrl' | 'taskSchedules'> & { password: string; };

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (data: SignupData) => Promise<any>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateUserEmail: (currentPassword: string, newEmail: string) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }
  }, []);

  const fetchAppUser = useCallback(async (fbUser: FirebaseUser | null) => {
    if (fbUser) {
      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const appUser = { ...docSnap.data(), id: docSnap.id, firebaseId: docSnap.id } as User;
          setUser(appUser);
          await requestNotificationPermission(); // Request permission after user is fetched
        } else {
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
  }, [requestNotificationPermission]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setLoading(true);
      setFirebaseUser(fbUser);
      fetchAppUser(fbUser);
    });

    return () => unsubscribe();
  }, [fetchAppUser]);
  
  const login = (email: string, password: string) => {
     return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (data: SignupData) => {
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const { password, ...profileData } = data;
    
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
    
    const defaultAvatar = PlaceHolderImages.find(img => img.id === 'user-default');
    if (!defaultAvatar) {
        throw new Error("Default user avatar not found in placeholder images.");
    }

    const newUser: Omit<User, 'id'> = {
      firebaseId: userCredential.user.uid,
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: fullName,
      email: data.email,
      avatarUrl: defaultAvatar.imageUrl,
      coins: 0,
      silverCoins: 0,
      goals: '',
      habits: '',
      groups: [],
      occupation: data.specialization || '',
      taskHistory: [],
      taskSchedules: [],
      university: data.university || '',
      specialization: data.specialization || '',
      course: data.course || '',
      telegram: data.telegram || '',
      createdAt: serverTimestamp(),
    };
    
    await setDoc(userDocRef, newUser);
    const createdUser = { ...newUser, id: userCredential.user.uid } as User;
    setUser(createdUser);
    await requestNotificationPermission(); // Request permission on signup
    
    return userCredential;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  const refreshAuth = useCallback(async () => {
    // Re-fetch the app user data without re-authenticating
    if (firebaseUser) {
      setLoading(true);
      await fetchAppUser(firebaseUser);
      setLoading(false);
    }
  }, [firebaseUser, fetchAppUser]);

  const reauthenticate = async (currentPassword: string): Promise<void> => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error("Foydalanuvchi tizimga kirmagan yoki email manzili mavjud emas.");
    }
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
  };

  const updateUserEmail = async (currentPassword: string, newEmail: string) => {
    if (!auth.currentUser) throw new Error("Foydalanuvchi topilmadi.");

    await reauthenticate(currentPassword);
    await updateEmail(auth.currentUser, newEmail);
    // Update email in Firestore as well
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userDocRef, { email: newEmail });
    // Refresh local user data
    await refreshAuth();
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    if (!auth.currentUser) throw new Error("Foydalanuvchi topilmadi.");

    await reauthenticate(currentPassword);
    await updatePassword(auth.currentUser, newPassword);
  };

  const value = { user, firebaseUser, loading, login, signup, logout, refreshAuth, updateUserEmail, updateUserPassword };

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
