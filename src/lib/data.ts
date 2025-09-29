
'use server';

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
  addDoc,
  Timestamp,
} from 'firebase/firestore';

import type { User, Group, Task, TaskHistory, WeeklyMeeting, UserTask } from './types';
import { PlaceHolderImages } from './placeholder-images';
import { format } from 'date-fns';

// --- Helper Functions ---

// A helper to safely stringify and parse to avoid object reference issues.
const deepCopy = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// --- Data Access Functions (Firestore) ---

async function getDocByCustomId<T>(collectionName: string, id: string): Promise<(T & { firebaseId: string }) | undefined> {
  const q = query(collection(db, collectionName), where('id', '==', id), limit(1));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return undefined;
  }
  const docSnap = querySnapshot.docs[0];
  return { ...docSnap.data() as T, firebaseId: docSnap.id };
}

async function getDocByFirebaseId<T>(collectionName: string, firebaseId: string): Promise<T | undefined> {
    const docRef = doc(db, collectionName, firebaseId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as T;
    }
    return undefined;
}


// Generic function to get all documents from a collection
async function getCollection<T>(collectionName: string): Promise<T[]> {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({ ...doc.data() as T, firebaseId: doc.id }));
}

export const createUserProfile = async (uid: string, fullName: string, email: string) => {
    const newUser: User = {
        id: uid,
        firebaseId: uid, // In 'users' collection, we can use auth UID as document ID
        fullName,
        email,
        avatarUrl: PlaceHolderImages.find(p => p.id === 'user3')?.imageUrl || '',
        coins: 0,
        goals: '',
        habits: '',
        groups: [],
        occupation: '',
        taskHistory: [],
    };
    // Here, we use the uid as the document ID for easy lookup
    await addDoc(collection(db, 'users'), newUser);
    return newUser;
};

export const getGroups = async (): Promise<Group[]> => {
  return getCollection<Group>('groups');
};

export const getGroupById = async (id: string): Promise<Group | undefined> => {
  return getDocByCustomId<Group>('groups', id);
};

export const getGroupsByUserId = async (userId: string): Promise<Group[]> => {
  if (!userId) return [];
  const user = await getUserById(userId);
  if (!user || user.groups.length === 0) return [];

  const groupsQuery = query(collection(db, 'groups'), where('id', 'in', user.groups));
  const querySnapshot = await getDocs(groupsQuery);
  return querySnapshot.docs.map(doc => doc.data() as Group);
};

export const getTasksByGroupId = async (groupId: string): Promise<Task[]> => {
  const tasksQuery = query(collection(db, 'tasks'), where('groupId', '==', groupId));
  const querySnapshot = await getDocs(tasksQuery);
  return querySnapshot.docs.map(doc => doc.data() as Task);
};

export const getMeetingsByGroupId = async (groupId: string): Promise<WeeklyMeeting[]> => {
    const meetingsQuery = query(collection(db, 'meetings'), where('groupId', '==', groupId));
    const querySnapshot = await getDocs(meetingsQuery);
    return querySnapshot.docs.map(doc => doc.data() as WeeklyMeeting);
};

export const getUsers = async (): Promise<User[]> => {
  return getCollection<User>('users');
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  if (!id) return undefined;
  // In the 'users' collection, the document ID is the Firebase Auth UID
  return getDocByCustomId<User>('users', id);
};

export const getTopUsers = async (): Promise<User[]> => {
  const usersQuery = query(collection(db, 'users'), where('coins', '>', 0));
  const users = (await getDocs(usersQuery)).docs.map(d => d.data() as User);
  return [...users].sort((a, b) => b.coins - a.coins).slice(0, 10);
};

export const getTopGroups = async (): Promise<(Group & { coins: number })[]> => {
  const groups = await getGroups();
  const usersSnapshot = await getDocs(query(collection(db, 'users'), where('coins', '>', 0)));
  const userMap = new Map(usersSnapshot.docs.map(d => {
      const u = d.data() as User;
      return [u.id, u];
  }));

  return groups.map(group => {
    const groupCoins = group.members.reduce((total, memberId) => {
      return total + (userMap.get(memberId)?.coins || 0);
    }, 0);
    return { ...group, coins: groupCoins };
  }).sort((a, b) => b.coins - a.coins).slice(0, 10);
};

export const getUserTasks = async (userId: string): Promise<UserTask[]> => {
    const user = await getUserById(userId);
    if (!user) return [];

    const today = format(new Date(), 'yyyy-MM-dd');
    
    if (user.groups.length === 0) {
      return [];
    }

    const tasksQuery = query(collection(db, 'tasks'), where('groupId', 'in', user.groups));
    const tasksSnapshot = await getDocs(tasksQuery);
    const tasksForUser = tasksSnapshot.docs.map(doc => doc.data() as Task);
    
    const allGroups = await getGroups();
    const groupMap = new Map(allGroups.map(g => [g.id, g.name]));

    return tasksForUser.map(task => {
        const isCompletedToday = user.taskHistory.some(h => h.taskId === task.id && h.date === today);
        return {
            ...task,
            groupName: groupMap.get(task.groupId) || 'Unknown Group',
            isCompleted: isCompletedToday,
        };
    });
};

export const getGoalMates = async (userId: string): Promise<User[]> => {
    const currentUser = await getUserById(userId);
    if (!currentUser || currentUser.groups.length === 0) return [];

    const groupsSnapshot = await getDocs(query(collection(db, 'groups'), where('id', 'in', currentUser.groups)));
    const memberIds = new Set<string>();
    groupsSnapshot.forEach(doc => {
        const group = doc.data() as Group;
        group.members.forEach(memberId => {
            if (memberId !== userId) {
                memberIds.add(memberId);
            }
        });
    });
    
    if (memberIds.size === 0) return [];

    const goalMatesQuery = query(collection(db, 'users'), where('id', 'in', Array.from(memberIds)));
    const goalMatesSnapshot = await getDocs(goalMatesQuery);

    return goalMatesSnapshot.docs.map(doc => doc.data() as User);
};


// --- Mutation functions (Firestore) ---

export const addUserToGroup = async (userId: string, groupId: string): Promise<void> => {
    const userDocRef = await getDocByCustomId('users', userId);
    const groupDocRef = await getDocByCustomId('groups', groupId);

    if (userDocRef && groupDocRef) {
        const userFirestoreDoc = doc(db, 'users', userDocRef.firebaseId);
        const groupFirestoreDoc = doc(db, 'groups', groupDocRef.firebaseId);

        const batch = writeBatch(db);
        
        batch.update(userFirestoreDoc, {
            groups: arrayUnion(groupId)
        });
        
        batch.update(groupFirestoreDoc, {
            members: arrayUnion(userId)
        });
        
        await batch.commit();
    } else {
        console.error("User or Group not found by custom ID");
    }
};

export const completeUserTask = async (userId: string, taskId: string, coins: number): Promise<void> => {
    const userDocRef = await getDocByCustomId('users', userId);
    if (!userDocRef) {
        console.error("User not found by custom ID");
        return;
    }
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const alreadyCompleted = userDocRef.taskHistory.some(
        h => h.taskId === taskId && h.date === today
    );

    if (alreadyCompleted) {
        console.log("Task already completed today.");
        return;
    }

    const userFirestoreDoc = doc(db, 'users', userDocRef.firebaseId);
    const newCoins = (userDocRef.coins || 0) + coins;
    await updateDoc(userFirestoreDoc, {
        coins: newCoins,
        taskHistory: arrayUnion({ taskId, date: today }),
    });
};

export const updateUserProfile = async (userId: string, data: { goals?: string; habits?: string }): Promise<void> => {
    const userDocRef = await getDocByCustomId('users', userId);
    if (userDocRef) {
        const userFirestoreDoc = doc(db, 'users', userDocRef.firebaseId);
        await updateDoc(userFirestoreDoc, data);
    } else {
        console.error("User not found by custom ID for update");
        throw new Error("User not found");
    }
};
