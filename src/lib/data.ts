import { db } from './firebase';
import {
  collection,
  doc,
  updateDoc,
  arrayUnion,
  writeBatch,
  setDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

import type { User, Group, Task } from './types';
import { PlaceHolderImages } from './placeholder-images';
import { format } from 'date-fns';
import type { User as FirebaseUser } from 'firebase/auth';

// --- Data Creation and Mutation Functions ---

/**
 * Creates a user profile document in Firestore.
 */
export const createUserProfile = async (firebaseUser: FirebaseUser, data: Partial<User>) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    
    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
    const newUser: User = {
        id: firebaseUser.uid,
        firebaseId: firebaseUser.uid, 
        firstName: data.firstName || 'Test',
        lastName: data.lastName || 'User',
        fullName: fullName || 'Test User',
        email: data.email || firebaseUser.email || '',
        avatarUrl: PlaceHolderImages.find(p => p.id === 'user3')?.imageUrl || '',
        coins: 0,
        goals: '',
        habits: '',
        groups: [],
        occupation: data.specialization || 'Developer',
        taskHistory: [],
        university: data.university || 'TUIT',
        specialization: data.specialization || 'Software Engineering',
        course: data.course || '3',
        telegram: data.telegram || '',
        createdAt: serverTimestamp(),
    };
    await setDoc(userDocRef, newUser);
};

export const createGroup = async (groupData: Omit<Group, 'id' | 'firebaseId' | 'imageUrl' | 'imageHint' | 'members'>, adminId: string): Promise<string> => {
    const groupImages = PlaceHolderImages.filter(p => p.id.startsWith('group'));
    const randomImage = groupImages[Math.floor(Math.random() * groupImages.length)];

    const newGroupRef = doc(collection(db, 'groups'));
    
    const newGroup: Group = {
        ...groupData,
        id: newGroupRef.id,
        firebaseId: newGroupRef.id,
        imageUrl: randomImage.imageUrl,
        imageHint: randomImage.imageHint,
        members: [adminId],
    };

    await setDoc(newGroupRef, newGroup);
    
    const userDocRef = doc(db, 'users', adminId);
    await updateDoc(userDocRef, {
        groups: arrayUnion(newGroup.id)
    });
    
    return newGroup.id;
};

export const createTask = async (taskData: Omit<Task, 'id'>): Promise<string> => {
    const newTaskRef = collection(db, 'tasks');
    const docRef = await addDoc(newTaskRef, taskData);
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
};

export const addUserToGroup = async (userId: string, groupId: string, taskIds: string[]): Promise<void> => {
    const userDocRef = doc(db, "users", userId);
    const groupDocRef = doc(db, "groups", groupId);

    const batch = writeBatch(db);
    batch.update(userDocRef, { groups: arrayUnion(groupId) });
    batch.update(groupDocRef, { members: arrayUnion(userId) });

    await batch.commit();
};

export const completeUserTask = async (userId: string, taskId: string, coins: number): Promise<void> => {
    const userDocRef = doc(db, 'users', userId);
    
    // We get the latest user data within a transaction to avoid race conditions
    // but for this simplified app, we'll just read and then write.
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
        throw new Error("User not found");
    }
    const user = userSnap.data();

    const today = format(new Date(), 'yyyy-MM-dd');
    const alreadyCompleted = user.taskHistory.some(
        (h: { taskId: string; date: string; }) => h.taskId === taskId && h.date === today
    );

    if (alreadyCompleted) {
        console.warn("Task already completed today.");
        return; 
    }

    const newCoins = (user.coins || 0) + coins;
    const newTaskHistory = { taskId, date: today };

    await updateDoc(userDocRef, {
        coins: newCoins,
        taskHistory: arrayUnion(newTaskHistory),
    });
};

export const updateUserProfile = async (userId: string, data: { goals?: string; habits?: string }): Promise<void> => {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, data);
};
