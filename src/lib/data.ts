
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
  DocumentReference,
} from 'firebase/firestore';

import type { User, Group, Task, TaskHistory, WeeklyMeeting, UserTask } from './types';
import { PlaceHolderImages } from './placeholder-images';
import { format } from 'date-fns';

// --- Data Access Functions ---

export const createUserProfile = async (uid: string, data: Partial<User>) => {
    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
    const newUser: User = {
        id: uid,
        firebaseId: uid, 
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
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, newUser);
    return newUser;
};

export const getGroups = async (): Promise<Group[]> => {
  const querySnapshot = await getDocs(collection(db, 'groups'));
  return querySnapshot.docs.map(doc => ({ ...doc.data() as Group, firebaseId: doc.id }));
};

const getDocRefByCustomId = async (collectionName: string, id: string): Promise<DocumentReference | undefined> => {
  const q = query(collection(db, collectionName), where('id', '==', id), limit(1));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return undefined;
  }
  return querySnapshot.docs[0].ref;
}

export const getGroupById = async (id: string): Promise<Group | undefined> => {
  const groupRef = await getDocRefByCustomId('groups', id);
  if (!groupRef) return undefined;
  const docSnap = await getDoc(groupRef);
  return docSnap.exists() ? { ...docSnap.data() as Group, firebaseId: docSnap.id } : undefined;
};

export const getGroupsByUserId = async (userId: string): Promise<Group[]> => {
  if (!userId) return [];
  const user = await getUserById(userId);
  if (!user || !user.groups || user.groups.length === 0) return [];

  // Firestore 'in' query has a limit of 30 items.
  const groupIds = user.groups.slice(0, 30);
  if(groupIds.length === 0) return [];

  const groupsQuery = query(collection(db, 'groups'), where('id', 'in', groupIds));
  const querySnapshot = await getDocs(groupsQuery);
  return querySnapshot.docs.map(doc => doc.data() as Group);
};

export const getTasksByGroupId = async (groupId: string): Promise<Task[]> => {
  const tasksQuery = query(collection(db, 'tasks'), where('groupId', '==', groupId));
  const querySnapshot = await getDocs(tasksQuery);
  return querySnapshot.docs.map(doc => ({...doc.data() as Task, id: doc.id}));
};

export const getMeetingsByGroupId = async (groupId: string): Promise<WeeklyMeeting[]> => {
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
  const docRef = doc(db, "users", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { ...docSnap.data() as User, id: docSnap.id, firebaseId: docSnap.id };
  }
  return undefined;
};

export const getTopUsers = async (): Promise<User[]> => {
  const usersQuery = query(collection(db, 'users'), where('coins', '>', 0));
  const usersSnapshot = await getDocs(usersQuery);
  const users = usersSnapshot.docs.map(d => d.data() as User);
  return [...users].sort((a, b) => b.coins - a.coins).slice(0, 10);
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
    if (!user) return [];

    const today = format(new Date(), 'yyyy-MM-dd');
    
    if (!user.groups || user.groups.length === 0) {
      return [];
    }

    // Firestore 'in' query has a limit of 30 items
    const groupIds = user.groups.slice(0, 30);
    if(groupIds.length === 0) return [];

    const tasksQuery = query(collection(db, 'tasks'), where('groupId', 'in', groupIds));
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

    const groupIds = currentUser.groups.slice(0, 30);
    if(groupIds.length === 0) return [];

    const groupsSnapshot = await getDocs(query(collection(db, 'groups'), where('id', 'in', groupIds)));
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
    
    // Firestore 'in' query is limited to 30 items. Chunking is needed for more.
    const memberIdChunks = [];
    const ids = Array.from(memberIds);
    for (let i = 0; i < ids.length; i += 30) {
      memberIdChunks.push(ids.slice(i, i + 30));
    }

    const matesPromises = memberIdChunks.map(chunk => 
      getDocs(query(collection(db, 'users'), where('id', 'in', chunk)))
    );

    const snapshots = await Promise.all(matesPromises);
    const goalMates = snapshots.flatMap(snapshot => snapshot.docs.map(doc => doc.data() as User));

    return goalMates;
};


// --- Mutation functions (Firestore) ---

export const addUserToGroup = async (userId: string, groupId: string): Promise<void> => {
    const userDocRef = doc(db, "users", userId);
    
    const groupsQuery = query(collection(db, 'groups'), where('id', '==', groupId), limit(1));
    const groupSnapshot = await getDocs(groupsQuery);

    if (!groupSnapshot.empty) {
        const groupDocRef = groupSnapshot.docs[0].ref;

        const batch = writeBatch(db);
        batch.update(userDocRef, { groups: arrayUnion(groupId) });
        batch.update(groupDocRef, { members: arrayUnion(userId) });
        await batch.commit();
    } else {
        console.error(`Group with custom ID ${groupId} not found`);
        throw new Error("Group not found");
    }
};

export const completeUserTask = async (userId: string, taskId: string, coins: number): Promise<void> => {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
        console.error("User not found by ID:", userId);
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
    await updateDoc(userDocRef, data);
};
