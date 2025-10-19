import { db, storage } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
  writeBatch,
  setDoc,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  or
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import type { User, Group, Task, UserTask, WeeklyMeeting, UserTaskSchedule } from './types';
import { format } from 'date-fns';

// --- Read Functions ---

export const getUser = async (userId: string): Promise<User | null> => {
  if (!userId) return null;
  const userDocRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userDocRef);
  if (userSnap.exists()) {
    const userData = userSnap.data();
    // Ensure taskHistory and groups are arrays
    const taskHistory = Array.isArray(userData.taskHistory) ? userData.taskHistory : [];
    const groups = Array.isArray(userData.groups) ? userData.groups : [];
    return { ...userData, id: userSnap.id, firebaseId: userSnap.id, taskHistory, groups } as User;
  }
  return null;
}

export const getAllUsers = async (): Promise<User[]> => {
    const usersQuery = collection(db, 'users');
    const snapshot = await getDocs(usersQuery);
    return snapshot.docs.map(doc => ({ ...doc.data() as User, id: doc.id, firebaseId: doc.id }));
}

export const getAllGroups = async (): Promise<Group[]> => {
    const groupsQuery = collection(db, 'groups');
    const snapshot = await getDocs(groupsQuery);
    return snapshot.docs.map(doc => ({ ...doc.data() as Group, id: doc.id, firebaseId: doc.id }));
}

export const getUserTasks = async (user: User): Promise<UserTask[]> => {
    if (!user || !user.groups || user.groups.length === 0) {
      return [];
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const dayOfWeek = format(new Date(), 'EEEE'); // e.g., "Monday"
    
    const userSchedules = user.taskSchedules || [];

    // Filter for tasks scheduled for today
    const todaysScheduledTasks = userSchedules.filter(schedule => schedule.days.includes(dayOfWeek));
    const todaysTaskIds = todaysScheduledTasks.map(schedule => schedule.taskId);

    if (todaysTaskIds.length === 0) {
      return [];
    }
    
    // Firestore 'in' query has a limit of 30 elements in the array.
    const taskIds = todaysTaskIds.slice(0, 30);
    if(taskIds.length === 0) return [];

    const tasksQuery = query(collection(db, 'tasks'), where('__name__', 'in', taskIds));
    const tasksSnapshot = await getDocs(tasksQuery);
    const tasksForUser = tasksSnapshot.docs.map(doc => ({ ...doc.data() as Task, id: doc.id }));
    
    if (tasksForUser.length === 0) return [];

    const groupIds = [...new Set(tasksForUser.map(t => t.groupId))].slice(0,30);
    if(groupIds.length === 0) return [];
    
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

export const getTasksForUserGroups = async (groupIds: string[]): Promise<Task[]> => {
  if (groupIds.length === 0) return [];
  const chunkedGroupIds = groupIds.slice(0, 30); // Firestore 'in' query limit
  const tasksQuery = query(collection(db, 'tasks'), where('groupId', 'in', chunkedGroupIds));
  const tasksSnapshot = await getDocs(tasksQuery);
  return tasksSnapshot.docs.map(doc => ({ ...doc.data() as Task, id: doc.id }));
}

export const getGroupAndDetails = async (groupId: string): Promise<{ group: Group, members: User[], tasks: Task[], meetings: WeeklyMeeting[] } | null> => {
    const groupDocRef = doc(db, 'groups', groupId);
    const groupSnap = await getDoc(groupDocRef);

    if (!groupSnap.exists()) {
        return null;
    }
    const groupData = { ...groupSnap.data(), id: groupSnap.id, firebaseId: groupSnap.id } as Group;

    const memberPromises = (groupData.members || []).slice(0,30).map(memberId => getUser(memberId));
    
    const tasksQuery = query(collection(db, 'tasks'), where('groupId', '==', groupId));
    const meetingsQuery = query(collection(db, 'meetings'), where('groupId', '==', groupId));
    
    const [membersData, tasksSnapshot, meetingsSnapshot] = await Promise.all([
        Promise.all(memberPromises),
        getDocs(tasksQuery),
        getDocs(meetingsQuery)
    ]);

    const members = membersData.filter(Boolean) as User[];
    const tasks = tasksSnapshot.docs.map(d => ({ ...d.data() as Task, id: d.id }));
    const meetings = meetingsSnapshot.docs.map(d => ({ ...d.data(), id: d.id } as WeeklyMeeting));

    return { group: groupData, members, tasks, meetings };
};


export const getLeaderboardData = async (): Promise<{ topUsers: User[], topGroups: (Group & { coins: number })[] }> => {
    const usersQuery = query(collection(db, 'users'), orderBy('coins', 'desc'), limit(10));
    const usersPromise = getDocs(usersQuery);
    
    const groupsPromise = getDocs(collection(db, 'groups'));
    const allUsersPromise = getDocs(collection(db, 'users'));

    const [usersSnapshot, groupsSnapshot, allUsersSnapshot] = await Promise.all([usersPromise, groupsPromise, allUsersPromise]);
    
    const topUsers = usersSnapshot.docs.map(d => ({ ...d.data() as User, id: d.id, firebaseId: d.id }));
    const groups = groupsSnapshot.docs.map(d => ({ ...d.data() as Group, id: d.id, firebaseId: d.id }));
    const allUsers = allUsersSnapshot.docs.map(d => ({ ...d.data() as User, id: d.id, firebaseId: d.id }));
    
    const userMap = new Map(allUsers.map(u => [u.id, u]));

    const calculatedTopGroups = groups.map(group => {
      const groupCoins = group.members.reduce((total, memberId) => {
        return total + (userMap.get(memberId)?.coins || 0);
      }, 0);
      return { ...group, coins: groupCoins };
    }).sort((a, b) => b.coins - a.coins).slice(0, 10);
    
    return { topUsers, topGroups: calculatedTopGroups };
};

export const getUserProfileData = async (userId: string): Promise<{user: User, userGroups: Group[], allUsers: User[]} | null> => {
     const user = await getUser(userId);
     if (!user) return null;

     const allUsersPromise = getAllUsers();
     
     let groupsPromise: Promise<Group[]> = Promise.resolve([]);
      if (user.groups && user.groups.length > 0) {
        const groupIds = user.groups.slice(0, 30);
        const groupsQuery = query(collection(db, 'groups'), where('__name__', 'in', groupIds));
        groupsPromise = getDocs(groupsQuery).then(snap => snap.docs.map(d => ({...d.data() as Group, id: d.id, firebaseId: d.id})));
      }
      
      const [userGroups, allUsers] = await Promise.all([
        groupsPromise,
        allUsersPromise,
      ]);

      return { user, userGroups, allUsers };
}

export const getGoalMates = async (userId: string): Promise<User[]> => {
    const currentUser = await getUser(userId);
    if (!currentUser || !currentUser.groups || currentUser.groups.length === 0) {
        return [];
    }

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
    
    const memberIdChunks: string[][] = [];
    const ids = Array.from(memberIds);
    for (let i = 0; i < ids.length; i += 30) {
      memberIdChunks.push(ids.slice(i, i + 30));
    }

    const matesPromises = memberIdChunks.map(async chunk => {
        if (chunk.length === 0) return [];
        const matesSnapshot = await getDocs(query(collection(db, 'users'), where('firebaseId', 'in', chunk)));
        return matesSnapshot.docs.map(doc => ({...doc.data() as User, id: doc.id, firebaseId: doc.id}));
    });
    
    const snapshots = await Promise.all(matesPromises);
    return snapshots.flat();
}


// --- Write Functions ---

export const createGroup = async (groupData: Omit<Group, 'id' | 'firebaseId' | 'members'>, adminId: string): Promise<string> => {
    const newGroupRef = doc(collection(db, 'groups'));
    
    const newGroup: Group = {
        ...groupData,
        id: newGroupRef.id,
        firebaseId: newGroupRef.id,
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

export const addUserToGroup = async (userId: string, groupId: string, taskSchedules: UserTaskSchedule[]): Promise<void> => {
    const userDocRef = doc(db, "users", userId);
    const groupDocRef = doc(db, "groups", groupId);
    const user = await getUser(userId);

    if (!user) {
        throw new Error("User not found");
    }

    // Filter out old schedules for the tasks in the current group
    const tasksInGroupQuery = query(collection(db, 'tasks'), where('groupId', '==', groupId));
    const tasksInGroupSnapshot = await getDocs(tasksInGroupQuery);
    const taskIdsInGroup = tasksInGroupSnapshot.docs.map(doc => doc.id);

    const existingSchedules = user.taskSchedules || [];
    const updatedSchedules = existingSchedules.filter(schedule => !taskIdsInGroup.includes(schedule.taskId));
    
    // Add the new schedules
    taskSchedules.forEach(newSchedule => {
        updatedSchedules.push(newSchedule);
    });

    const batch = writeBatch(db);
    batch.update(userDocRef, { 
      groups: arrayUnion(groupId),
      taskSchedules: updatedSchedules
    });
    batch.update(groupDocRef, { members: arrayUnion(userId) });

    await batch.commit();
};

export const completeUserTask = async (userId: string, taskId: string, coins: number): Promise<void> => {
    const userDocRef = doc(db, 'users', userId);
    
    const user = await getUser(userId);
    if (!user) {
        throw new Error("User not found");
    }

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

export const updateUserProfile = async (userId: string, data: { goals?: string | null; habits?: string | null; avatarFile?: File | null }): Promise<void> => {
    const userDocRef = doc(db, 'users', userId);
    const updateData: { [key: string]: any } = {};

    if (data.goals !== undefined && data.goals !== null) {
        updateData.goals = data.goals;
    }
    if (data.habits !== undefined && data.habits !== null) {
        updateData.habits = data.habits;
    }

    if (data.avatarFile) {
        const storageRef = ref(storage, `avatars/${userId}/${data.avatarFile.name}`);
        const snapshot = await uploadBytes(storageRef, data.avatarFile);
        const downloadURL = await getDownloadURL(snapshot.ref);
        updateData.avatarUrl = downloadURL;
    }
    
    if (Object.keys(updateData).length > 0) {
      await updateDoc(userDocRef, updateData);
    }
};

export const updateGroupImage = async (groupId: string, imageFile: File): Promise<string> => {
    const groupDocRef = doc(db, 'groups', groupId);

    const storageRef = ref(storage, `group-images/${groupId}/${imageFile.name}`);
    const snapshot = await uploadBytes(storageRef, imageFile);
    const downloadURL = await getDownloadURL(snapshot.ref);

    await updateDoc(groupDocRef, {
        imageUrl: downloadURL
    });

    return downloadURL;
};

export const performSearch = async (searchTerm: string): Promise<{ users: User[], groups: Group[] }> => {
    if (!searchTerm.trim()) {
        return { users: [], groups: [] };
    }
    const term = searchTerm.toLowerCase();

    // For simplicity, we'll fetch all and filter client-side.
    // For production, you would use a search service like Algolia or a more complex query.
    const allUsers = await getAllUsers();
    const allGroups = await getAllGroups();

    const filteredUsers = allUsers.filter(u => u.fullName.toLowerCase().includes(term)).slice(0, 5);
    const filteredGroups = allGroups.filter(g => g.name.toLowerCase().includes(term)).slice(0, 5);
    
    return { users: filteredUsers, groups: filteredGroups };
};
