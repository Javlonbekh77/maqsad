import { db } from './firebase';
import {
  collection,
  getDocs,
  query,
  where,
  limit,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  writeBatch,
  setDoc,
  DocumentReference,
  orderBy,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

import type { User, Group, Task, TaskHistory, WeeklyMeeting, UserTask } from './types';
import { PlaceHolderImages } from './placeholder-images';
import { format } from 'date-fns';
import type { User as FirebaseUser } from 'firebase/auth';

// --- Data Creation Functions ---

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
    // Get a random placeholder image for the group
    const groupImages = PlaceHolderImages.filter(p => p.id.startsWith('group'));
    const randomImage = groupImages[Math.floor(Math.random() * groupImages.length)];

    const newGroupRef = doc(collection(db, 'groups'));
    
    const newGroup: Group = {
        ...groupData,
        id: newGroupRef.id,
        firebaseId: newGroupRef.id,
        imageUrl: randomImage.imageUrl,
        imageHint: randomImage.imageHint,
        members: [adminId], // The creator is the first member and admin
    };

    await setDoc(newGroupRef, newGroup);
    
    // Also add this group to the user's list of groups
    const userDocRef = doc(db, 'users', adminId);
    await updateDoc(userDocRef, {
        groups: arrayUnion(newGroup.id)
    });
    
    return newGroup.id;
};

export const createTask = async (taskData: Omit<Task, 'id'>): Promise<string> => {
    const newTaskRef = doc(collection(db, 'tasks'));
    const newTask: Task = {
        ...taskData,
        id: newTaskRef.id,
    };
    await setDoc(newTaskRef, newTask);
    return newTask.id;
};

// --- This file no longer contains data fetching functions (getters) ---
// --- All data fetching is now done directly in the client components ---
// --- to ensure they only run on the client-side. ---

export const addUserToGroup = async (userId: string, groupId: string, taskIds: string[]): Promise<void> => {
    const userDocRef = doc(db, "users", userId);
    
    const groupDocRef = doc(db, "groups", groupId);
    const groupSnapshot = await getDoc(groupDocRef);


    if (!groupSnapshot.exists()) {
        console.error(`Group with ID ${groupId} not found`);
        throw new Error("Group not found");
    }

    const batch = writeBatch(db);
    batch.update(userDocRef, { groups: arrayUnion(groupId) });
    batch.update(groupDocRef, { members: arrayUnion(userId) });
    
    console.log(`User ${userId} joined group ${groupId} and committed to tasks: ${taskIds.join(', ')}`);

    await batch.commit();
};

export const completeUserTask = async (userId: string, taskId: string, coins: number): Promise<void> => {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
        console.error("User not found by ID:", userId);
        throw new Error("User not found");
    }
    const user = userDocSnap.data() as User;
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const alreadyCompleted = user.taskHistory.some(
        h => h.taskId === taskId && h.date === today
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
