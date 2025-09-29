
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
  setDoc,
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

// Generic function to get all documents from a collection
async function getCollection<T>(collectionName: string): Promise<T[]> {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({ ...doc.data() as T, firebaseId: doc.id }));
}

export const createUserProfile = async (uid: string, data: Partial<User>) => {
    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
    const newUser: User = {
        id: uid,
        firebaseId: uid, // In users collection, firebaseId and id are the same (UID)
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        fullName: fullName,
        email: data.email || '',
        avatarUrl: PlaceHolderImages.find(p => p.id === 'user3')?.imageUrl || '',
        coins: 0,
        goals: '',
        habits: '',
        groups: [],
        occupation: data.specialization || '',
        taskHistory: [],
        university: data.university,
        specialization: data.specialization,
        course: data.course,
        telegram: data.telegram,
    };
    // Use setDoc with the user's UID as the document ID for direct lookup
    await setDoc(doc(db, 'users', uid), newUser);
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
  if (!user || !user.groups || user.groups.length === 0) return [];

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
  // In the 'users' collection, the document ID is the Firebase Auth UID, allowing direct access.
  const docRef = doc(db, "users", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as User;
  }
  // Fallback to query if direct lookup fails (e.g., if IDs don't match)
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
    
    if (!user.groups || user.groups.length === 0) {
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
    if (!currentUser || !currentUser.groups || currentUser.groups.length === 0) return [];

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
    const userDocSnap = await getDoc(doc(db, "users", userId));
    const groupDocRef = await getDocByCustomId('groups', groupId);

    if (userDocSnap.exists() && groupDocRef) {
        const userFirestoreDoc = doc(db, 'users', userDocSnap.id);
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
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
        console.error("User not found by custom ID");
        return;
    }
    const user = userDocSnap.data() as User;
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const alreadyCompleted = user.taskHistory.some(
        h => h.taskId === taskId && h.date === today
    );

    if (alreadyCompleted) {
        console.log("Task already completed today.");
        return;
    }

    const newCoins = (user.coins || 0) + coins;
    await updateDoc(userDocRef, {
        coins: newCoins,
        taskHistory: arrayUnion({ taskId, date: today }),
    });
};

export const updateUserProfile = async (userId: string, data: { goals?: string; habits?: string }): Promise<void> => {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        await updateDoc(userDocRef, data);
    } else {
        console.error("User not found for update");
        throw new Error("User not found");
    }
};
