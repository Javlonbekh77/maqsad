

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
  deleteDoc,
  Timestamp,
  arrayRemove,
  getCountFromServer
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import type { User, Group, Task, UserTask, WeeklyMeeting, UserTaskSchedule, ChatMessage, PersonalTask, TaskSchedule, DayOfWeek, UnreadMessageInfo } from './types';
import { format, isSameDay, startOfDay, isPast, addDays, isWithinInterval, parseISO, isYesterday, getDay } from 'date-fns';

const PERSONAL_TASK_COINS = 1; // 1 Silver Coin

// --- Read Functions ---

export const getTask = async (taskId: string): Promise<Task | null> => {
  if (!taskId) return null;
  const taskDocRef = doc(db, 'tasks', taskId);
  const taskSnap = await getDoc(taskDocRef);
  if (taskSnap.exists()) {
    return { ...taskSnap.data(), id: taskSnap.id } as Task;
  }
  return null;
};

export const getPersonalTask = async (taskId: string): Promise<PersonalTask | null> => {
    if (!taskId) return null;
    const taskDocRef = doc(db, 'personal_tasks', taskId);
    const taskSnap = await getDoc(taskDocRef);
    if (taskSnap.exists()) {
        return { ...taskSnap.data(), id: taskSnap.id } as PersonalTask;
    }
    return null;
}


export const getUser = async (userId: string): Promise<User | null> => {
  if (!userId) return null;
  const userDocRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userDocRef);
  if (userSnap.exists()) {
    const userData = userSnap.data();

    // Get journal entries count
    const journalEntriesRef = collection(db, 'users', userId, 'journal_entries');
    const journalSnapshot = await getCountFromServer(journalEntriesRef);
    const journalEntriesCount = journalSnapshot.data().count;

    // Ensure fields are arrays and numbers are initialized
    const taskHistory = Array.isArray(userData.taskHistory) ? userData.taskHistory : [];
    const groups = Array.isArray(userData.groups) ? userData.groups : [];
    const taskSchedules = Array.isArray(userData.taskSchedules) ? userData.taskSchedules : [];
    const coins = typeof userData.coins === 'number' ? userData.coins : 0;
    const silverCoins = typeof userData.silverCoins === 'number' ? userData.silverCoins : 0;
    return { ...userData, id: userSnap.id, firebaseId: userSnap.id, taskHistory, groups, taskSchedules, coins, silverCoins, journalEntriesCount } as User;
  }
  return null;
}

export const getAllUsers = async (): Promise<User[]> => {
    const usersQuery = collection(db, 'users');
    const snapshot = await getDocs(usersQuery);
    return snapshot.docs.map(doc => ({ ...doc.data() as User, id: doc.id, firebaseId: doc.id }));
}

export const getAllGroups = async (): Promise<Group[]> => {
    const groupsQuery = query(collection(db, 'groups'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(groupsQuery);
    return snapshot.docs.map(doc => ({ ...doc.data() as Group, id: doc.id, firebaseId: doc.id }));
}

export const getUserGroups = async(userId: string): Promise<Group[]> => {
    const user = await getUser(userId);
    if (!user || !user.groups || user.groups.length === 0) {
        return [];
    }
    const groupIds = user.groups.slice(0, 30);
    const groupsQuery = query(collection(db, 'groups'), where('__name__', 'in', groupIds));
    const snapshot = await getDocs(groupsQuery);
    return snapshot.docs.map(d => ({...d.data() as Group, id: d.id, firebaseId: d.id}));
}

export const getScheduledTasksForUser = async (user: User): Promise<UserTask[]> => {
    if (!user) return [];

    // 1. Fetch all personal tasks for the user
    const personalTasksQuery = query(collection(db, 'personal_tasks'), where('userId', '==', user.id));
    const personalTasksPromise = getDocs(personalTasksQuery);

    // 2. Fetch all groups the user is a member of
    const userGroupIds = Array.isArray(user.groups) ? user.groups : [];
    let groupTasksPromise: Promise<Task[]> = Promise.resolve([]);

    if (userGroupIds.length > 0) {
        // Firestore 'in' query is limited to 30 elements in array.
        const groupChunks = [];
        for (let i = 0; i < userGroupIds.length; i += 30) {
            groupChunks.push(userGroupIds.slice(i, i + 30));
        }

        const taskPromises = groupChunks.map(chunk => 
            getDocs(query(collection(db, 'tasks'), where('groupId', 'in', chunk)))
        );

        groupTasksPromise = Promise.all(taskPromises).then(snapshots => 
            snapshots.flatMap(snapshot => 
                snapshot.docs.map(doc => ({ ...doc.data() as Task, id: doc.id }))
            )
        );
    }
    
    // Fetch group details for names
    let groupMapPromise: Promise<Map<string, string>> = Promise.resolve(new Map());
    if (userGroupIds.length > 0) {
        const groupIds = user.groups.slice(0, 30);
        groupMapPromise = getDocs(query(collection(db, 'groups'), where('__name__', 'in', groupIds)))
            .then(snap => new Map(snap.docs.map(d => [d.id, d.data().name])));
    }

    const [personalTasksSnapshot, groupTasks, groupMap] = await Promise.all([
        personalTasksPromise, 
        groupTasksPromise,
        groupMapPromise
    ]);

    const allTasks: UserTask[] = [];

    // Process personal tasks
    personalTasksSnapshot.docs.forEach(doc => {
        const task = { ...doc.data(), id: doc.id } as PersonalTask;
        allTasks.push({
            ...task,
            taskType: 'personal',
            coins: PERSONAL_TASK_COINS, // Silver coin
            history: user.taskHistory?.filter(h => h.taskId === task.id) || [],
        });
    });
    
    // Process group tasks
    const userSchedules = new Map(user.taskSchedules?.map(s => [s.taskId, s.schedule]));
    groupTasks.forEach(task => {
        const schedule = userSchedules.get(task.id) || task.schedule;
        allTasks.push({
            ...task,
            groupName: groupMap.get(task.groupId) || 'Noma\'lum guruh',
            taskType: 'group',
            schedule: schedule,
            history: user.taskHistory?.filter(h => h.taskId === task.id) || [],
        });
    });

    return allTasks.map(t => ({...t, isCompleted: false}));
};


export const getTasksForUserGroups = async (groupIds: string[]): Promise<Task[]> => {
  if (groupIds.length === 0) return [];
  const chunkedGroupIds = groupIds.slice(0, 30); // Firestore 'in' query limit
  const tasksQuery = query(collection(db, 'tasks'), where('groupId', 'in', chunkedGroupIds));
  const tasksSnapshot = await getDocs(tasksQuery);
  return tasksSnapshot.docs.map(doc => ({ ...doc.data() as Task, id: doc.id, createdAt: doc.data().createdAt || serverTimestamp() }));
}

export const getPersonalTasksForUser = async (userId: string, publicOnly = false): Promise<PersonalTask[]> => {
    if (!userId) return [];
    let tasksQuery;
    if (publicOnly) {
        tasksQuery = query(collection(db, 'personal_tasks'), where('userId', '==', userId), where('visibility', '==', 'public'));
    } else {
        tasksQuery = query(collection(db, 'personal_tasks'), where('userId', '==', userId));
    }
    const tasksSnapshot = await getDocs(tasksQuery);
    const tasks = tasksSnapshot.docs.map(doc => ({ ...doc.data() as PersonalTask, id: doc.id, createdAt: doc.data().createdAt || serverTimestamp() }));
    
    // Sort tasks by createdAt timestamp in descending order on the client side
    return tasks.sort((a, b) => {
        const aTimestamp = a.createdAt as Timestamp;
        const bTimestamp = b.createdAt as Timestamp;
        if (aTimestamp && bTimestamp) {
            return bTimestamp.toMillis() - aTimestamp.toMillis();
        }
        return 0;
    });
};

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
    const tasks = tasksSnapshot.docs.map(d => ({ ...d.data() as Task, id: d.id, createdAt: d.data().createdAt || serverTimestamp() }));
    const meetings = meetingsSnapshot.docs
        .map(d => ({ ...d.data(), id: d.id } as WeeklyMeeting))
        .sort((a, b) => {
            const aTimestamp = a.createdAt as Timestamp;
            const bTimestamp = b.createdAt as Timestamp;
            if (aTimestamp && bTimestamp) {
                return bTimestamp.toMillis() - aTimestamp.toMillis();
            }
            return 0;
        });


    return { group: groupData, members, tasks, meetings };
};


export const getLeaderboardData = async (): Promise<{ topUsers: User[], topGroups: (Group & { coins: number })[], topSilverCoinUsers: User[] }> => {
    const usersQuery = query(collection(db, 'users'), orderBy('coins', 'desc'), limit(10));
    const silverUsersQuery = query(collection(db, 'users'), orderBy('silverCoins', 'desc'), limit(10));
    
    const groupsPromise = getDocs(collection(db, 'groups'));

    const [usersSnapshot, silverUsersSnapshot, groupsSnapshot] = await Promise.all([
        getDocs(usersQuery),
        getDocs(silverUsersQuery),
        groupsPromise
    ]);
    
    // Fetch journal entry counts for top users
    const topUsersPromises = usersSnapshot.docs.map(async (d) => {
        const user = { ...d.data(), id: d.id, firebaseId: d.id } as User;
        const journalSnapshot = await getCountFromServer(collection(db, 'users', user.id, 'journal_entries'));
        user.journalEntriesCount = journalSnapshot.data().count;
        return user;
    });

    const topSilverCoinUsersPromises = silverUsersSnapshot.docs.map(async (d) => {
        const user = { ...d.data(), id: d.id, firebaseId: d.id } as User;
        const journalSnapshot = await getCountFromServer(collection(db, 'users', user.id, 'journal_entries'));
        user.journalEntriesCount = journalSnapshot.data().count;
        return user;
    });

    const topUsers = await Promise.all(topUsersPromises);
    const topSilverCoinUsers = await Promise.all(topSilverCoinUsersPromises);

    // Calculate group scores
    const groups = groupsSnapshot.docs.map(d => ({ ...d.data() as Group, id: d.id, firebaseId: d.id }));
    const allUsersSnapshot = await getDocs(collection(db, 'users'));
    const allUsers = allUsersSnapshot.docs.map(d => ({ ...d.data() as User, id: d.id, firebaseId: d.id }));
    const userMap = new Map(allUsers.map(u => [u.id, u]));

    const calculatedTopGroups = groups.map(group => {
      const groupCoins = group.members.reduce((total, memberId) => {
        return total + (userMap.get(memberId)?.coins || 0);
      }, 0);
      return { ...group, coins: groupCoins };
    }).sort((a, b) => b.coins - a.coins).slice(0, 10);
    
    return { topUsers, topGroups: calculatedTopGroups, topSilverCoinUsers };
};


export const getUserProfileData = async (userId: string): Promise<{user: User, userGroups: Group[], publicPersonalTasks: PersonalTask[], allUsers: User[] } | null> => {
     const user = await getUser(userId);
     if (!user) return null;

     const allUsersPromise = getAllUsers();
     const publicTasksPromise = getPersonalTasksForUser(userId, true);
     
     let groupsPromise: Promise<Group[]> = Promise.resolve([]);
      if (user.groups && user.groups.length > 0) {
        const groupIds = user.groups.slice(0, 30);
        const groupsQuery = query(collection(db, 'groups'), where('__name__', 'in', groupIds));
        groupsPromise = getDocs(groupsQuery).then(snap => snap.docs.map(d => ({...d.data() as Group, id: d.id, firebaseId: d.id})));
      }
    
    const [userGroups, allUsers, publicTasks] = await Promise.all([
        groupsPromise,
        allUsersPromise,
        publicTasksPromise,
    ]);

    return { user, userGroups, allUsers, publicPersonalTasks: publicTasks };
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
};

export async function getUnreadMessageCount(groupId: string, lastRead: Timestamp): Promise<number> {
    const messagesQuery = query(
        collection(db, 'groups', groupId, 'messages'),
        where('createdAt', '>', lastRead)
    );
    const snapshot = await getDocs(messagesQuery);
    return snapshot.size;
}


// --- Write Functions ---

export const createGroup = async (groupData: Omit<Group, 'id' | 'firebaseId' | 'members' | 'createdAt'>, adminId: string): Promise<string> => {
    const newGroupRef = doc(collection(db, 'groups'));
    
    const newGroup: Group = {
        ...groupData,
        id: newGroupRef.id,
        firebaseId: newGroupRef.id,
        members: [adminId],
        createdAt: serverTimestamp(),
    };

    await setDoc(newGroupRef, newGroup);
    
    const userDocRef = doc(db, 'users', adminId);
    await updateDoc(userDocRef, {
        groups: arrayUnion(newGroup.id)
    });
    
    return newGroup.id;
};

export const createTask = async (taskData: Omit<Task, 'id' | 'createdAt'>): Promise<string> => {
    const newTaskRef = collection(db, 'tasks');
    const dataToSave = { ...taskData, createdAt: serverTimestamp() };
    const docRef = await addDoc(newTaskRef, dataToSave);
    return docRef.id;
};

export const createPersonalTask = async (taskData: Omit<PersonalTask, 'id' | 'createdAt'>): Promise<PersonalTask> => {
    const { schedule, ...restOfTaskData } = taskData;

    // Build the data object with only defined values
    const dataToSave: { [key: string]: any } = {
        ...restOfTaskData,
        createdAt: serverTimestamp(),
    };

    if (restOfTaskData.estimatedTime === "") {
        delete dataToSave.estimatedTime;
    }
    if (restOfTaskData.hasTimer === undefined) {
         dataToSave.hasTimer = false;
    }
    if (!dataToSave.hasTimer) {
        delete dataToSave.timerDuration;
    }


    // Build a clean schedule object
    const cleanedSchedule: { [key: string]: any } = { type: schedule.type };
    if (schedule.type === 'one-time' && schedule.date) {
        cleanedSchedule.date = schedule.date;
    } else if (schedule.type === 'date-range' && schedule.startDate && schedule.endDate) {
        cleanedSchedule.startDate = schedule.startDate;
        cleanedSchedule.endDate = schedule.endDate;
    } else if (schedule.type === 'recurring' && schedule.days && schedule.days.length > 0) {
        cleanedSchedule.days = schedule.days;
    }
    dataToSave.schedule = cleanedSchedule;

    // Create the document
    const docRef = await addDoc(collection(db, 'personal_tasks'), dataToSave);
    await updateDoc(docRef, { id: docRef.id });

    // Return the created task
    const docSnap = await getDoc(docRef);
    return { ...docSnap.data(), id: docRef.id } as PersonalTask;
};

export const updateTask = async (taskId: string, data: Partial<Task>): Promise<void> => {
    const taskDocRef = doc(db, 'tasks', taskId);
    await updateDoc(taskDocRef, data);
};

export const updatePersonalTask = async (taskId: string, data: Partial<PersonalTask>): Promise<void> => {
    const taskDocRef = doc(db, 'personal_tasks', taskId);
    await updateDoc(taskDocRef, data);
};

export const deletePersonalTask = async (taskId: string): Promise<void> => {
    const taskDocRef = doc(db, 'personal_tasks', taskId);
    await deleteDoc(taskDocRef);
    // Note: This does not delete the task from users' taskHistory.
    // A more complex implementation would involve a Cloud Function to clean this up.
};

export const addUserToGroup = async (userId: string, groupId: string, taskSchedules: UserTaskSchedule[]): Promise<void> => {
    const userDocRef = doc(db, "users", userId);

    const batch = writeBatch(db);
    batch.update(userDocRef, { 
      groups: arrayUnion(groupId),
      taskSchedules: arrayUnion(...taskSchedules)
    });
    
    const groupDocRef = doc(db, "groups", groupId);
    batch.update(groupDocRef, { members: arrayUnion(userId) });

    await batch.commit();
};

export const completeUserTask = async (userId: string, task: UserTask): Promise<void> => {
    const userDocRef = doc(db, 'users', userId);
    
    const user = await getUser(userId);
    if (!user) {
        throw new Error("User not found");
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const alreadyCompleted = user.taskHistory.some(
        (h: { taskId: string; date: string; }) => h.taskId === task.id && h.date === today
    );

    if (alreadyCompleted) {
        console.warn("Task already completed today.");
        return; 
    }

    const updateData: { [key: string]: any } = {};
    
    if (task.taskType === 'personal') {
        updateData.silverCoins = (user.silverCoins || 0) + PERSONAL_TASK_COINS;
    } else {
        updateData.coins = (user.coins || 0) + task.coins;
    }

    const newTaskHistory = { taskId: task.id, date: today, taskType: task.taskType };
    updateData.taskHistory = arrayUnion(newTaskHistory);

    await updateDoc(userDocRef, updateData);
};


export const updateUserProfile = async (userId: string, data: Partial<User>): Promise<void> => {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, data);
};

// --- Group Task / Schedule Helpers ---

export const getGroupTasksForUser = async (user: User): Promise<UserTask[]> => {
    if (!user) return [];
    const groupIds = Array.isArray(user.groups) ? user.groups.slice(0, 30) : [];
    if (groupIds.length === 0) return [];

    const tasksQuery = query(collection(db, 'tasks'), where('groupId', 'in', groupIds));
    const tasksSnapshot = await getDocs(tasksQuery);
    const tasks = tasksSnapshot.docs.map(d => ({ ...d.data() as Task, id: d.id, createdAt: d.data().createdAt || serverTimestamp() }));

    // Map each task to a UserTask with user's schedule if exists
    const userSchedules: UserTaskSchedule[] = Array.isArray(user.taskSchedules) ? user.taskSchedules : [];
    const grouped = tasks.map(task => {
        const userScheduleForTask = userSchedules.find(s => s.taskId === task.id);
        return {
            ...task,
            groupName: task.groupId || 'Unknown Group',
            isCompleted: false,
            taskType: 'group' as const,
            coins: task.coins || 0,
            schedule: userScheduleForTask ? userScheduleForTask.schedule : (task.schedule as TaskSchedule),
            history: user.taskHistory?.filter(h => h.taskId === task.id) || [],
            createdAt: task.createdAt,
        } as UserTask;
    });

    return grouped;
};

export const updateGroupTaskSchedule = async (userId: string, taskId: string, schedule: TaskSchedule): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    const user = await getUser(userId);
    if (!user) throw new Error('User not found');

    const existingSchedules: UserTaskSchedule[] = Array.isArray(user.taskSchedules) ? user.taskSchedules : [];
    const idx = existingSchedules.findIndex(s => s.taskId === taskId);
    if (idx >= 0) {
        existingSchedules[idx].schedule = schedule;
    } else {
        existingSchedules.push({ taskId, schedule });
    }

    await updateDoc(userRef, { taskSchedules: existingSchedules });
};

export const removeGroupTaskFromUserSchedule = async (userId: string, taskId: string): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    const user = await getUser(userId);
    if (!user) throw new Error('User not found');

    const existingSchedules: UserTaskSchedule[] = Array.isArray(user.taskSchedules) ? user.taskSchedules : [];
    const filtered = existingSchedules.filter(s => s.taskId !== taskId);
    await updateDoc(userRef, { taskSchedules: filtered });
};

export const removeUserFromGroup = async (userId: string, groupId: string, removeTasks = false): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    const groupRef = doc(db, 'groups', groupId);
    const user = await getUser(userId);
    if (!user) throw new Error('User not found');

    const batch = writeBatch(db);
    batch.update(userRef, { groups: arrayRemove(groupId) });
    batch.update(groupRef, { members: arrayRemove(userId) });

    if (removeTasks) {
        // remove all taskSchedules for tasks belonging to this group
        const tasksSnapshot = await getDocs(query(collection(db, 'tasks'), where('groupId', '==', groupId)));
        const taskIds = tasksSnapshot.docs.map(d => d.id);
        const existingSchedules: UserTaskSchedule[] = Array.isArray(user.taskSchedules) ? user.taskSchedules : [];
        const filtered = existingSchedules.filter(s => !taskIds.includes(s.taskId));
        batch.update(userRef, { taskSchedules: filtered });
    }

    await batch.commit();
};

export const updateGroupDetails = async (groupId: string, data: { name?: string, description?: string }): Promise<void> => {
    const groupDocRef = doc(db, 'groups', groupId);
    const updateData: { [key: string]: any } = {};

    if (data.name) {
        updateData.name = data.name;
    }
    if (data.description) {
        updateData.description = data.description;
    }

    if (Object.keys(updateData).length > 0) {
        await updateDoc(groupDocRef, updateData);
    }
};

export const deleteGroup = async (groupId: string): Promise<void> => {
    const batch = writeBatch(db);

    const groupRef = doc(db, 'groups', groupId);
    batch.delete(groupRef);

    const tasksQuery = query(collection(db, 'tasks'), where('groupId', '==', groupId));
    const tasksSnapshot = await getDocs(tasksQuery);
    tasksSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    
    // Cloud Function would be better for this, but for now we remove it from users who are online.
    const usersSnapshot = await getDocs(query(collection(db, 'users'), where('groups', 'array-contains', groupId)));
    usersSnapshot.forEach(userDoc => {
        batch.update(userDoc.ref, { groups: arrayRemove(groupId) });
    });

    await batch.commit();
};


export const performSearch = async (searchTerm: string): Promise<{ users: User[], groups: Group[] }> => {
    if (!searchTerm.trim()) {
        return { users: [], groups: [] };
    }
    const term = searchTerm.toLowerCase();

    const allUsers = await getAllUsers();
    const allGroups = await getAllGroups();

    const filteredUsers = allUsers.filter(u => 
        u.fullName.toLowerCase().includes(term) || 
        u.email.toLowerCase().includes(term)
    ).slice(0, 5);
    
    const filteredGroups = allGroups.filter(g => 
        g.name.toLowerCase().includes(term)
    ).slice(0, 5);
    
    return { users: filteredUsers, groups: filteredGroups };
};

export const createOrUpdateMeeting = async (meetingData: Omit<WeeklyMeeting, 'id' | 'createdAt'>, meetingId?: string): Promise<WeeklyMeeting> => {
  const dataToSave = { ...meetingData, createdAt: serverTimestamp() };
  if (meetingId) {
    // Update existing meeting
    const meetingRef = doc(db, 'meetings', meetingId);
    await updateDoc(meetingRef, dataToSave);
    const docSnap = await getDoc(meetingRef);
    return { ...docSnap.data(), id: meetingId } as WeeklyMeeting;
  } else {
    // Create new meeting
    const meetingRef = await addDoc(collection(db, 'meetings'), dataToSave);
    await updateDoc(meetingRef, { id: meetingRef.id });
    const docSnap = await getDoc(meetingRef);
    return { ...docSnap.data(), id: meetingRef.id } as WeeklyMeeting;
  }
};

export const deleteMeeting = async (meetingId: string): Promise<void> => {
    const meetingRef = doc(db, 'meetings', meetingId);
    await deleteDoc(meetingRef);
};

export const updateChatMessage = async (groupId: string, messageId: string, newText: string): Promise<void> => {
  const messageRef = doc(db, `groups/${groupId}/messages`, messageId);
  await updateDoc(messageRef, {
    text: newText,
    isEdited: true,
  });
};

export const deleteChatMessage = async (groupId: string, messageId: string): Promise<void> => {
    const messageRef = doc(db, `groups/${groupId}/messages`, messageId);
    await deleteDoc(messageRef);
  };


export const getNotificationsData = async (user: User): Promise<{
    todayTasks: UserTask[];
    overdueTasks: UserTask[];
    todayMeetings: (WeeklyMeeting & { groupName: string })[];
    unreadMessages: UnreadMessageInfo[];
}> => {
    if (!user) {
        return { todayTasks: [], overdueTasks: [], todayMeetings: [], unreadMessages: [] };
    }

    const lastChecked = user.notificationsLastCheckedAt || new Timestamp(0, 0);
    const lastCheckedDate = lastChecked.toDate();

    const today = startOfDay(new Date());
    const yesterday = startOfDay(addDays(today, -1));
    const todayDayOfWeek = format(today, 'EEEE') as DayOfWeek;

    // 1. Get Today's Meetings
    let todayMeetings: (WeeklyMeeting & { groupName: string })[] = [];
    if (user.groups && user.groups.length > 0) {
        const groupIds = user.groups.slice(0, 30);
        const meetingsQuery = query(
            collection(db, 'meetings'), 
            where('groupId', 'in', groupIds), 
            where('day', '==', todayDayOfWeek)
        );
        const groupsQuery = query(collection(db, 'groups'), where('__name__', 'in', groupIds));

        const [meetingsSnapshot, groupsSnapshot] = await Promise.all([getDocs(meetingsQuery), getDocs(groupsQuery)]);
        
        const groupMap = new Map(groupsSnapshot.docs.map(doc => [doc.id, doc.data().name]));

        todayMeetings = meetingsSnapshot.docs
            .map(doc => {
                const meeting = doc.data() as WeeklyMeeting;
                return {
                    ...meeting,
                    id: doc.id,
                    groupName: groupMap.get(meeting.groupId) || 'Noma\'lum guruh'
                };
            })
            .filter(meeting => {
                const createdAt = (meeting.createdAt as Timestamp)?.toDate();
                return createdAt ? createdAt > lastCheckedDate : true;
            });
    }
    
    // 2. Get unread messages
    let unreadMessages: UnreadMessageInfo[] = [];
     if (user.groups && user.groups.length > 0) {
        const groupDetails = await getUserGroups(user.id);
        const unreadCounts = await Promise.all(
            groupDetails.map(async (group) => {
                const lastRead = user.lastRead?.[group.id] || new Timestamp(0, 0);
                // Only consider messages that are newer than the last time notifications were checked
                if (lastRead.toDate() > lastCheckedDate) { 
                     const count = await getUnreadMessageCount(group.id, lastRead);
                     if (count > 0) {
                        return { groupId: group.id, groupName: group.name, count };
                     }
                }
                return null;
            })
        );
        unreadMessages = unreadCounts.filter(Boolean) as UnreadMessageInfo[];
    }


    // 3. Get All Scheduled Tasks (to find today's and overdue)
    const allScheduledTasks = await getScheduledTasksForUser(user);
    
    const todayIncompletedTasks: UserTask[] = [];
    const overdueTasks: UserTask[] = [];

    allScheduledTasks.forEach(task => {
        const taskCreatedAt = (task.createdAt as Timestamp)?.toDate();
        if (!taskCreatedAt) return;

        // Check only for yesterday's overdue tasks, and only if the task is "new" since last check
        if (isTaskScheduledForDate(task, yesterday) && taskCreatedAt < yesterday && taskCreatedAt > lastCheckedDate) {
             const isCompletedYesterday = user.taskHistory.some(h => h.taskId === task.id && h.date === format(yesterday, 'yyyy-MM-dd'));
             if (!isCompletedYesterday) {
                overdueTasks.push(task);
             }
        }
        
        // Check for today's tasks, and only if the task is "new" since last check
        if (isTaskScheduledForDate(task, today) && taskCreatedAt > lastCheckedDate) {
            const isCompletedToday = user.taskHistory.some(h => h.taskId === task.id && h.date === format(today, 'yyyy-MM-dd'));
            if (!isCompletedToday) {
                todayIncompletedTasks.push(task);
            }
        }
    });


    return { todayTasks: todayIncompletedTasks, overdueTasks, todayMeetings, unreadMessages };
};

export function isTaskScheduledForDate(task: UserTask, date: Date): boolean {
    const schedule = task.schedule;
    if (!schedule) return false;

    const taskCreationDate = task.createdAt instanceof Timestamp ? startOfDay(task.createdAt.toDate()) : new Date(0);
    const checkDate = startOfDay(date);

    if (checkDate < taskCreationDate) {
        return false;
    }
    
    switch(schedule.type) {
        case 'one-time':
            return schedule.date ? isSameDay(parseISO(schedule.date), checkDate) : false;
        case 'date-range':
            if (schedule.startDate && schedule.endDate) {
                 const start = startOfDay(parseISO(schedule.startDate));
                 const end = startOfDay(parseISO(schedule.endDate));
                 return isWithinInterval(checkDate, { start, end });
            }
            return false;
        case 'recurring':
            const dayIndex = getDay(checkDate); // Sunday = 0, Monday = 1...
            const dayOfWeek: DayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex];
            return schedule.days?.includes(dayOfWeek) ?? false;
        default:
            return false;
    }
}


export const updateUserLastRead = async (userId: string, groupId: string) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        [`lastRead.${groupId}`]: Timestamp.now()
    });
};

// --- Chat History Functions ---

export type ChatHistoryMessage = {
  id: string;
  role: 'user' | 'model';
  content: string;
  createdAt: Timestamp;
};

export const saveChatMessage = async (userId: string, message: { role: 'user' | 'model'; content: string }): Promise<ChatHistoryMessage> => {
    if (!userId) throw new Error("User ID is required to save chat message.");
    
    const messagesRef = collection(db, 'users', userId, 'chat_messages');
    const newMsg = {
        role: message.role,
        content: message.content,
        createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(messagesRef, newMsg);
    
    // We can't get the serverTimestamp back immediately, so we return with a placeholder
    // The onSnapshot listener will get the real data.
    return { id: docRef.id, ...newMsg, createdAt: Timestamp.now() } as ChatHistoryMessage;
};

export const getChatHistory = async (userId: string): Promise<ChatHistoryMessage[]> => {
    if (!userId) return [];
    
    const messagesRef = collection(db, 'users', userId, 'chat_messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(50));
    
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs
            .reverse()
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as ChatHistoryMessage));
    } catch (e) {
        console.error('Error fetching chat history', e);
        return [];
    }
};

// --- Journal Functions ---

export const getJournalEntry = async (userId: string, date: string): Promise<any | null> => {
    try {
        const entryDocRef = doc(db, `users/${userId}/journal_entries/${date}`);
        const entrySnap = await getDoc(entryDocRef);
        if (entrySnap.exists()) {
            return { ...entrySnap.data(), id: entrySnap.id, date };
        }
        return null;
    } catch (e) {
        console.error('Error fetching journal entry', e);
        return null;
    }
};

export const saveJournalEntry = async (userId: string, date: string, content: string): Promise<void> => {
    try {
        const entryDocRef = doc(db, `users/${userId}/journal_entries/${date}`);
        const now = serverTimestamp();
        
        const user = await getUser(userId);
        if (!user) throw new Error('User not found');
        
        const entryExists = await getJournalEntry(userId, date);
        const lastRewardDate = user.lastJournalRewardDate || '';
        
        const updateData: any = {
            content,
            updatedAt: now,
        };
        
        // Award 1 silver coin if this is first entry of the day
        if (!entryExists && lastRewardDate !== date) {
            updateData.createdAt = now;
            
            // Also update user's lastJournalRewardDate and silverCoins
            const userDocRef = doc(db, 'users', userId);
            await updateDoc(userDocRef, {
                lastJournalRewardDate: date,
                silverCoins: (user.silverCoins || 0) + 1,
            });
        } else if (!entryExists) {
            updateData.createdAt = now;
        }
        
        await setDoc(entryDocRef, updateData, { merge: true });
    } catch (e) {
        console.error('Error saving journal entry', e);
        throw e;
    }
};

export const getAllJournalEntries = async (userId: string): Promise<any[]> => {
    try {
        const entriesQuery = query(
            collection(db, `users/${userId}/journal_entries`),
            orderBy('date', 'desc')
        );
        const snapshot = await getDocs(entriesQuery);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, date: doc.id }));
    } catch (e) {
        console.error('Error fetching journal entries', e);
        return [];
    }
};
