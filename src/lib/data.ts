
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


// --- Data Access Functions (Getters) ---

export const getGroups = async (): Promise<Group[]> => {
  const querySnapshot = await getDocs(collection(db, 'groups'));
  return querySnapshot.docs.map(doc => ({ ...doc.data() as Group, id: doc.id, firebaseId: doc.id }));
};

const getDocRefByCustomId = async (collectionName: string, id: string): Promise<DocumentReference | undefined> => {
  if (!id) return undefined;
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docRef : undefined;
}

export const getGroupById = async (id: string): Promise<Group | undefined> => {
  if (!id) return undefined;
  const groupRef = await getDocRefByCustomId('groups', id);
  if (!groupRef) return undefined;
  const docSnap = await getDoc(groupRef);
  return docSnap.exists() ? { ...docSnap.data() as Group, id: docSnap.id, firebaseId: docSnap.id } : undefined;
};

export const getGroupsByUserId = async (userId: string): Promise<Group[]> => {
  if (!userId) return [];
  const user = await getUserById(userId);
  if (!user || !user.groups || user.groups.length === 0) return [];
  
  const groupIds = user.groups.slice(0, 30);
  if(groupIds.length === 0) return [];

  const groupsQuery = query(collection(db, 'groups'), where('__name__', 'in', groupIds));
  const querySnapshot = await getDocs(groupsQuery);
  return querySnapshot.docs.map(doc => ({...doc.data() as Group, id: doc.id, firebaseId: doc.id}));
};

export const getTasksByGroupId = async (groupId: string): Promise<Task[]> => {
  if (!groupId) return [];
  const tasksQuery = query(collection(db, 'tasks'), where('groupId', '==', groupId));
  const querySnapshot = await getDocs(tasksQuery);
  return querySnapshot.docs.map(doc => ({...doc.data() as Task, id: doc.id }));
};

export const getMeetingsByGroupId = async (groupId: string): Promise<WeeklyMeeting[]> => {
    if (!groupId) return [];
    const meetingsQuery = query(collection(db, 'meetings'), where('groupId', '==', groupId));
    const querySnapshot = await getDocs(meetingsQuery);
    return querySnapshot.docs.map(doc => doc.data() as WeeklyMeeting);
};

export const getUsers = async (): Promise<User[]> => {
  const querySnapshot = await getDocs(collection(db, 'users'));
  return querySnapshot.docs.map(doc => ({ ...doc.data() as User, id: doc.id, firebaseId: doc.id }));
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  if (!id) return undefined;
  const docRef = doc(db, 'users', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { ...docSnap.data() as User, id: docSnap.id, firebaseId: docSnap.id } : undefined;

};


export const getTopUsers = async (): Promise<User[]> => {
  const usersQuery = query(collection(db, 'users'), orderBy('coins', 'desc'), limit(10));
  const usersSnapshot = await getDocs(usersQuery);
  return usersSnapshot.docs.map(d => ({ ...d.data() as User, id: d.id, firebaseId: d.id }));
};

export const getTopGroups = async (): Promise<(Group & { coins: number })[]> => {
  const [groups, users] = await Promise.all([
    getGroups(),
    getUsers()
  ]);
  
  const userMap = new Map(users.map(u => [u.id, u]));

  return groups.map(group => {
    const groupCoins = group.members.reduce((total, memberId) => {
      return total + (userMap.get(memberId)?.coins || 0);
    }, 0);
    return { ...group, coins: groupCoins };
  }).sort((a, b) => b.coins - a.coins).slice(0, 10);
};

export const getUserTasks = async (userId: string): Promise<UserTask[]> => {
    const user = await getUserById(userId);
    if (!user || !user.groups || user.groups.length === 0) {
      return [];
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    
    const groupIds = user.groups.slice(0, 30);
    if(groupIds.length === 0) return [];

    const tasksQuery = query(collection(db, 'tasks'), where('groupId', 'in', groupIds));
    const tasksSnapshot = await getDocs(tasksQuery);
    const tasksForUser = tasksSnapshot.docs.map(doc => doc.data() as Task);
    
    const allGroupsSnapshot = await getDocs(query(collection(db, 'groups'), where('__name__', 'in', groupIds)));
    const groupMap = new Map(allGroupsSnapshot.docs.map(doc => [doc.id, doc.data().name]));

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

    const groupIds = currentUser.groups.slice(0, 30);
    if(groupIds.length === 0) return [];

    const groupsSnapshot = await getDocs(query(collection(db, 'groups'), where('__name__', 'in', groupIds)));
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
    
    const memberIdChunks = [];
    const ids = Array.from(memberIds);
    for (let i = 0; i < ids.length; i += 30) {
      memberIdChunks.push(ids.slice(i, i + 30));
    }

    const matesPromises = memberIdChunks.map(chunk => 
      getDocs(query(collection(db, 'users'), where('firebaseId', 'in', chunk)))
    );

    const snapshots = await Promise.all(matesPromises);
    const goalMates = snapshots.flatMap(snapshot => snapshot.docs.map(doc => doc.data() as User));

    return goalMates;
};


// --- Mutation functions (Setters/Updaters) ---

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
