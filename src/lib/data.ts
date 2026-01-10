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
  type FieldValue,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import type { User, Group, Task, UserTask, WeeklyMeeting, UserTaskSchedule, ChatMessage, PersonalTask, TaskSchedule, DayOfWeek, UnreadMessageInfo, JournalEntry } from './types';
import { format, isSameDay, startOfDay, isPast, addDays, isWithinInterval, parseISO, isBefore, isAfter } from 'date-fns';

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
    // Ensure fields are arrays and numbers are initialized
    const taskHistory = Array.isArray(userData.taskHistory) ? userData.taskHistory : [];
    const groups = Array.isArray(userData.groups) ? userData.groups : [];
    const taskSchedules = Array.isArray(userData.taskSchedules) ? userData.taskSchedules : [];
    const coins = typeof userData.coins === 'number' ? userData.coins : 0;
    const silverCoins = typeof userData.silverCoins === 'number' ? userData.silverCoins : 0;
    return { ...userData, id: userSnap.id, firebaseId: userSnap.id, taskHistory, groups, taskSchedules, coins, silverCoins } as User;
  }
  return null;
}

export const getAllUsers = async (): Promise<User[]> => {
    const usersQuery = collection(db, 'users');
    const snapshot = await getDocs(usersQuery);
    return snapshot.docs.map(doc => ({ ...doc.data() as User, id: doc.id, firebaseId: doc.id }));
}

export const getAllGroups = async (): Promise<Group[]> => {
    const groupsQuery = query(collection(db, 'groups'), orderBy('members', 'desc'));
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

    const userHistory = Array.isArray(user.taskHistory) ? user.taskHistory : [];
    const userSchedules = Array.isArray(user.taskSchedules) ? user.taskSchedules : [];
    
    // 1. Fetch all personal tasks for the user
    const personalTasksQuery = query(collection(db, 'personal_tasks'), where('userId', '==', user.id));
    const personalTasksSnapshot = await getDocs(personalTasksQuery);
    const personalTasks = personalTasksSnapshot.docs.map(doc => ({ ...doc.data() as PersonalTask, id: doc.id, createdAt: doc.data().createdAt || serverTimestamp() }));

    // 2. Fetch only group tasks that the user has explicitly added to their schedule
    const scheduledGroupTaskIds = userSchedules.map(schedule => schedule.taskId);
    let groupTasks: Task[] = [];

    if (scheduledGroupTaskIds.length > 0) {
        const taskIdsInChunks: string[][] = [];
        for (let i = 0; i < scheduledGroupTaskIds.length; i += 30) {
            taskIdsInChunks.push(scheduledGroupTaskIds.slice(i, i + 30));
        }

        const taskPromises = taskIdsInChunks.map(chunk => 
            getDocs(query(collection(db, 'tasks'), where('__name__', 'in', chunk)))
        );

        const taskSnapshots = await Promise.all(taskPromises);
        groupTasks = taskSnapshots.flatMap(snapshot => 
            snapshot.docs.map(doc => ({ ...doc.data() as Task, id: doc.id, createdAt: doc.data().createdAt || serverTimestamp() }))
        );
    }

    // Get all group names in one go for the fetched tasks
    let groupMap = new Map<string, string>();
    if (groupTasks.length > 0) {
        const groupIds = [...new Set(groupTasks.map(t => t.groupId))].slice(0, 30);
        if (groupIds.length > 0) {
            const allGroupsSnapshot = await getDocs(query(collection(db, 'groups'), where('__name__', 'in', groupIds)));
            groupMap = new Map(allGroupsSnapshot.docs.map(doc => [doc.id, doc.data().name]));
        }
    }
    
    const allTasks: UserTask[] = [];

    // Process personal tasks
    personalTasks.forEach(task => {
        allTasks.push({
            ...task,
            isCompleted: false, // will be checked on the client
            taskType: 'personal',
            coins: PERSONAL_TASK_COINS,
            history: user.taskHistory?.filter(h => h.taskId === task.id) || [],
            createdAt: task.createdAt,
            addedAt: task.createdAt, // For personal tasks, addedAt is the same as createdAt
        });
    });

    // Process group tasks
    groupTasks.forEach(task => {
        const userScheduleForTask = userSchedules.find(s => s.taskId === task.id);
        if (userScheduleForTask) {
            allTasks.push({
                ...task,
                groupName: groupMap.get(task.groupId) || 'Noma\'lum Guruh',
                isCompleted: false, // will be checked on the client
                taskType: 'group',
                schedule: userScheduleForTask.schedule,
                history: user.taskHistory?.filter(h => h.taskId === task.id) || [],
                createdAt: task.createdAt,
                addedAt: userScheduleForTask.addedAt, // CRITICAL: Date user added the task
            });
        }
    });

    return allTasks;
};


export const getTasksForUserGroups = async (groupIds: string[]): Promise<Task[]> => {
  if (groupIds.length === 0) return [];
  const chunkedGroupIds = groupIds.slice(0, 30); // Firestore 'in' query limit
  const tasksQuery = query(collection(db, 'tasks'), where('groupId', 'in', chunkedGroupIds));
  const tasksSnapshot = await getDocs(tasksQuery);
  return tasksSnapshot.docs.map(doc => ({ ...doc.data() as Task, id: doc.id, createdAt: doc.data().createdAt || serverTimestamp() }));
}

export const getPersonalTasksForUser = async (userId: string): Promise<PersonalTask[]> => {
    if (!userId) return [];
    const tasksQuery = query(collection(db, 'personal_tasks'), where('userId', '==', userId));
    const tasksSnapshot = await getDocs(tasksQuery);
    const tasks = tasksSnapshot.docs.map(doc => ({ ...doc.data() as PersonalTask, id: doc.id, createdAt: doc.data().createdAt || serverTimestamp() }));
    
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
    const allGroups = await getAllGroups();
    
    const [usersSnapshot, silverUsersSnapshot] = await Promise.all([
        getDocs(usersQuery),
        getDocs(silverUsersQuery),
    ]);
    
    const topUsers = usersSnapshot.docs.map(d => ({ ...d.data() as User, id: d.id, firebaseId: d.id }));
    const topSilverCoinUsers = silverUsersSnapshot.docs.map(d => ({ ...d.data() as User, id: d.id, firebaseId: d.id }));
    
    // Sort groups by member count for the main page leaderboard
    const topGroupsByMembers = [...allGroups].sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0));

    return { topUsers, topGroups: topGroupsByMembers as (Group & { coins: number })[], topSilverCoinUsers };
};


export const getUserProfileData = async (userId: string): Promise<{user: User, userGroups: Group[], allUsers: User[], publicPersonalTasks: PersonalTask[]} | null> => {
     const user = await getUser(userId);
     if (!user) return null;

     const allUsersPromise = getAllUsers();
     
     let groupsPromise: Promise<Group[]> = Promise.resolve([]);
      if (user.groups && user.groups.length > 0) {
        const groupIds = user.groups.slice(0, 30);
        const groupsQuery = query(collection(db, 'groups'), where('__name__', 'in', groupIds));
        groupsPromise = getDocs(groupsQuery).then(snap => snap.docs.map(d => ({...d.data() as Group, id: d.id, firebaseId: d.id})));
      }
    
    const publicTasksQuery = query(collection(db, 'personal_tasks'), where('userId', '==', userId), where('visibility', '==', 'public'));
    const publicTasksPromise = getDocs(publicTasksQuery);
      
    const [userGroups, allUsers, publicTasksSnapshot] = await Promise.all([
        groupsPromise,
        allUsersPromise,
        publicTasksPromise
    ]);
    
    const publicPersonalTasks = publicTasksSnapshot.docs.map(doc => ({ ...doc.data() as PersonalTask, id: doc.id }));

    return { user, userGroups, allUsers, publicPersonalTasks };
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
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
};

export const createPersonalTask = async (taskData: Omit<PersonalTask, 'id' | 'createdAt'>): Promise<PersonalTask> => {
    const { schedule, ...restOfTaskData } = taskData;

    const cleanedSchedule: Partial<TaskSchedule> = { type: schedule.type };
    if (schedule.type === 'one-time' && schedule.date) {
        cleanedSchedule.date = schedule.date;
    } else if (schedule.type === 'date-range' && schedule.startDate) {
        cleanedSchedule.startDate = schedule.startDate;
        if (schedule.endDate) {
            cleanedSchedule.endDate = schedule.endDate;
        }
    } else if (schedule.type === 'recurring' && schedule.days) {
        cleanedSchedule.days = schedule.days;
    }

    const dataToSave = {
        ...restOfTaskData,
        schedule: cleanedSchedule,
        createdAt: serverTimestamp(),
        addedAt: serverTimestamp() // For personal tasks, addedAt is the same as createdAt
    };
    
    const docRef = await addDoc(collection(db, 'personal_tasks'), dataToSave);
    await updateDoc(docRef, { id: docRef.id });
    
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
};

export const addUserToGroup = async (userId: string, groupId: string, taskSchedules: UserTaskSchedule[]): Promise<void> => {
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
        throw new Error("User not found");
    }
    const userData = userSnap.data();

    // 1. Prepare new schedules with a concrete timestamp
    const newSchedules = taskSchedules.map(ts => ({ 
        taskId: ts.taskId, 
        schedule: ts.schedule,
        addedAt: Timestamp.now() // Use a concrete timestamp
    }));

    // 2. Combine with existing schedules
    const existingSchedules = userData.taskSchedules || [];
    const allSchedules = [...existingSchedules, ...newSchedules];

    // 3. Combine with existing groups
    const existingGroups = userData.groups || [];
    const allGroups = [...existingGroups, groupId];

    // 4. Update user document with the new combined arrays
    await updateDoc(userDocRef, { 
      groups: allGroups,
      taskSchedules: allSchedules
    });
    
    // 5. Update group document
    const groupDocRef = doc(db, "groups", groupId);
    await updateDoc(groupDocRef, { members: arrayUnion(userId) });
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
    const updateData: { [key: string]: any } = {};

    if (data.firstName && data.lastName) {
        updateData.firstName = data.firstName;
        updateData.lastName = data.lastName;
        updateData.fullName = `${data.firstName} ${data.lastName}`.trim();
    }
    if (data.goals !== undefined) updateData.goals = data.goals;
    if (data.habits !== undefined) updateData.habits = data.habits;
    if (data.avatarUrl) updateData.avatarUrl = data.avatarUrl;
    if (data.notificationsLastCheckedAt) updateData.notificationsLastCheckedAt = data.notificationsLastCheckedAt;
    if (data.occupation !== undefined) updateData.occupation = data.occupation;
    if (data.university !== undefined) updateData.university = data.university;
    if (data.specialization !== undefined) updateData.specialization = data.specialization;
    if (data.course !== undefined) updateData.course = data.course;
    if (data.telegram !== undefined) updateData.telegram = data.telegram;
    
    if (Object.keys(updateData).length > 0) {
      await updateDoc(userDocRef, updateData);
    }
};

export const getGroupTasksForUser = async (user: User): Promise<UserTask[]> => {
    if (!user || !Array.isArray(user.taskSchedules)) return [];

    const taskIds = user.taskSchedules.map(s => s.taskId);
    if (taskIds.length === 0) return [];
    
    const groupIds = new Set<string>();

    const taskChunks: string[][] = [];
    for (let i = 0; i < taskIds.length; i += 30) {
        taskChunks.push(taskIds.slice(i, i + 30));
    }
    
    const taskPromises = taskChunks.map(chunk => 
        getDocs(query(collection(db, 'tasks'), where('__name__', 'in', chunk)))
    );

    const taskSnapshots = await Promise.all(taskPromises);
    const tasks = taskSnapshots.flatMap(snapshot => 
        snapshot.docs.map(doc => {
            const task = { ...doc.data() as Task, id: doc.id, createdAt: doc.data().createdAt || serverTimestamp() };
            if (task.groupId) groupIds.add(task.groupId);
            return task;
        })
    );

    let groupMap = new Map<string, string>();
    if (groupIds.size > 0) {
        const groupIdsArray = Array.from(groupIds);
        const groupChunks: string[][] = [];
        for (let i=0; i<groupIdsArray.length; i+=30) {
            groupChunks.push(groupIdsArray.slice(i, i+30));
        }

        const groupPromises = groupChunks.map(chunk => getDocs(query(collection(db, 'groups'), where('__name__', 'in', chunk))));
        const groupSnapshots = await Promise.all(groupPromises);

        groupSnapshots.forEach(snapshot => {
             snapshot.docs.forEach(doc => {
                groupMap.set(doc.id, doc.data().name);
            });
        })
    }

    const userTasks = tasks.map(task => {
        const userSchedule = user.taskSchedules.find(s => s.taskId === task.id);
        return {
            ...task,
            groupName: groupMap.get(task.groupId) || 'Noma\'lum Guruh',
            isCompleted: false,
            taskType: 'group' as const,
            schedule: userSchedule ? userSchedule.schedule : task.schedule,
            history: user.taskHistory?.filter(h => h.taskId === task.id) || [],
            addedAt: userSchedule?.addedAt,
        } as UserTask;
    });

    return userTasks;
};

export const addTaskToUserSchedule = async (userId: string, taskId: string, schedule: TaskSchedule): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    const user = await getUser(userId);
    if (!user) {
        throw new Error("User not found");
    }
    
    const newTaskSchedule: UserTaskSchedule = {
        taskId,
        schedule,
        addedAt: Timestamp.now(),
    };
    
    const existingSchedules = user.taskSchedules || [];
    const updatedSchedules = [...existingSchedules, newTaskSchedule];

    await updateDoc(userRef, { taskSchedules: updatedSchedules });
};

export const updateGroupTaskSchedule = async (userId: string, taskId: string, schedule: TaskSchedule): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    const user = await getUser(userId);
    if (!user) throw new Error('User not found');

    const existingSchedules: UserTaskSchedule[] = Array.isArray(user.taskSchedules) ? user.taskSchedules : [];
    const idx = existingSchedules.findIndex(s => s.taskId === taskId);
    if (idx >= 0) {
        existingSchedules[idx] = { 
            taskId, 
            schedule,
            addedAt: existingSchedules[idx].addedAt || Timestamp.now()
        };
    } else {
        existingSchedules.push({ 
            taskId, 
            schedule,
            addedAt: Timestamp.now()
        });
    }

    await updateDoc(userRef, { taskSchedules: existingSchedules });
};

export const removeGroupTaskFromUserSchedule = async (userId: string, taskId: string): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    const user = await getUser(userId);
    if (!user) throw new Error('User not found');

    const existingSchedules: UserTaskSchedule[] = Array.isArray(user.taskSchedules) ? user.taskSchedules : [];
    const updatedSchedules = existingSchedules.filter(s => s.taskId !== taskId);

    await updateDoc(userRef, { taskSchedules: updatedSchedules });
};

export const removeUserFromGroup = async (userId: string, groupId: string, removeTasks = false): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    const groupRef = doc(db, 'groups', groupId);
    const user = await getUser(userId);
    if (!user) throw new Error('User not found');

    const batch = writeBatch(db);
    batch.update(userRef, { groups: (user.groups || []).filter((g: string) => g !== groupId) });
    batch.update(groupRef, { members: arrayRemove(userId) });

    if (removeTasks) {
        const tasksSnapshot = await getDocs(query(collection(db, 'tasks'), where('groupId', '==', groupId)));
        const taskIds = tasksSnapshot.docs.map(d => d.id);
        const existingSchedules: UserTaskSchedule[] = Array.isArray(user.taskSchedules) ? user.taskSchedules : [];
        const filtered = existingSchedules.filter(s => !taskIds.includes(s.taskId));
        batch.update(userRef, { taskSchedules: filtered });
    }

    await batch.commit();
};

export const uploadAvatar = async (userId: string, file: Blob): Promise<string> => {
    const filePath = `avatars/${userId}/${Date.now()}.jpg`;
    const storageRef = ref(storage, filePath);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
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
    const meetingRef = doc(db, 'meetings', meetingId);
    await updateDoc(meetingRef, dataToSave);
    const docSnap = await getDoc(meetingRef);
    return { ...docSnap.data(), id: meetingId } as WeeklyMeeting;
  } else {
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

/**
 * Checks if a task is scheduled for a specific date, considering when the user added it.
 * This is the core logic for displaying tasks in schedules and habit trackers.
 */
export function isTaskScheduledForDate(task: UserTask, date: Date): boolean {
    const schedule = task.schedule;
    if (!schedule) return false;

    // --- CRITICAL CHECK 1: Check if the user has added the task by this date ---
    const addedAtTimestamp = task.addedAt as Timestamp;
    if (addedAtTimestamp) {
        const addedAtDate = addedAtTimestamp.toDate();
        // If the date we are checking is before the day the user added the task, it's not scheduled for them.
        if (isBefore(startOfDay(date), startOfDay(addedAtDate))) {
            return false;
        }
    } else {
        // Fallback for older data that might not have `addedAt`.
        // We assume it was added when the task was created.
        const createdAtTimestamp = task.createdAt as Timestamp;
        if (createdAtTimestamp) {
            const createdAtDate = createdAtTimestamp.toDate();
            if (isBefore(startOfDay(date), startOfDay(createdAtDate))) {
                return false;
            }
        } else {
             // If no date information is available, assume it's not scheduled.
             return false;
        }
    }
    
    // --- CRITICAL CHECK 2: Check if the task's own schedule matches the date ---
    switch(schedule.type) {
        case 'one-time':
            // Check if the date is the same as the one-time date.
            return schedule.date === format(date, 'yyyy-MM-dd');
            
        case 'date-range':
            // Check if the date falls within the start and end dates of the range.
            if (schedule.startDate && schedule.endDate) {
                 const start = parseISO(schedule.startDate);
                 const end = parseISO(schedule.endDate);
                 // isWithinInterval is exclusive of the end date, so we check isSameDay as well.
                 return isWithinInterval(date, { start, end }) || isSameDay(date, start) || isSameDay(date, end);
            }
            return false;
            
        case 'recurring':
            // Check if the day of the week matches one of the recurring days.
            const dayOfWeek = format(date, 'EEEE') as DayOfWeek;
            return schedule.days?.includes(dayOfWeek) ?? false;
            
        default:
            return false;
    }
}


export const getNotificationsData = async (user: User): Promise<{
    overdueTasks: UserTask[];
    unreadMessages: UnreadMessageInfo[];
}> => {
    if (!user) {
        return { overdueTasks: [], unreadMessages: [] };
    }

    const lastChecked = user.notificationsLastCheckedAt || new Timestamp(0, 0);
    
    let unreadMessages: UnreadMessageInfo[] = [];
     if (user.groups && user.groups.length > 0) {
        const groupDetails = await getUserGroups(user.id);
        const unreadCounts = await Promise.all(
            groupDetails.map(async (group) => {
                const count = await getUnreadMessageCount(group.id, lastChecked);
                if (count > 0) {
                   return { groupId: group.id, groupName: group.name, count };
                }
                return null;
            })
        );
        unreadMessages = unreadCounts.filter(Boolean) as UnreadMessageInfo[];
    }

    const allScheduledTasks = await getScheduledTasksForUser(user);
    const yesterday = startOfDay(addDays(new Date(), -1));
    
    const overdueTasks: UserTask[] = [];

    allScheduledTasks.forEach(task => {
        if (isTaskScheduledForDate(task, yesterday)) {
             const isCompletedYesterday = user.taskHistory.some(h => h.taskId === task.id && h.date === format(yesterday, 'yyyy-MM-dd'));
             if (!isCompletedYesterday) {
                overdueTasks.push(task);
             }
        }
    });

    return { overdueTasks, unreadMessages };
};


export const updateUserLastRead = async (userId: string, groupId: string) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        [`lastRead.${groupId}`]: Timestamp.now()
    });
};


export const getJournalEntry = async (userId: string, date: string): Promise<JournalEntry | null> => {
    const entryRef = doc(db, `users/${userId}/journal/${date}`);
    const docSnap = await getDoc(entryRef);
    if (docSnap.exists()) {
        return { ...docSnap.data(), id: docSnap.id } as JournalEntry;
    }
    return null;
}

export const getAllJournalEntries = async (userId: string): Promise<JournalEntry[]> => {
    const entriesQuery = query(collection(db, `users/${userId}/journal`), orderBy('date', 'desc'));
    const snapshot = await getDocs(entriesQuery);
    return snapshot.docs.map(doc => ({ ...doc.data() as JournalEntry, id: doc.id }));
}

export const saveJournalEntry = async (userId: string, date: string, content: string): Promise<void> => {
    const entryRef = doc(db, `users/${userId}/journal/${date}`);
    const userRef = doc(db, 'users', userId);
    const user = await getUser(userId);

    const data = {
        userId,
        date,
        content,
        updatedAt: serverTimestamp(),
    };

    const docSnap = await getDoc(entryRef);

    if (docSnap.exists()) {
        await updateDoc(entryRef, data);
    } else {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        // Award silver coin if it's a new entry for today and not already awarded
        if (date === todayStr && user?.lastJournalRewardDate !== todayStr) {
             await setDoc(entryRef, { ...data, createdAt: serverTimestamp() });
             await updateDoc(userRef, {
                silverCoins: (user.silverCoins || 0) + 1,
                lastJournalRewardDate: todayStr,
            });
        } else {
            await setDoc(entryRef, { ...data, createdAt: serverTimestamp() });
        }
    }
}
