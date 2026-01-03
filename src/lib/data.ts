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
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import type { User, Group, Task, UserTask, WeeklyMeeting, UserTaskSchedule, ChatMessage, PersonalTask } from './types';
import { format, isSameDay, startOfDay, isPast } from 'date-fns';

type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';


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
    const taskSchedules = Array.isArray(userData.taskSchedules) ? userData.taskSchedules : [];
    return { ...userData, id: userSnap.id, firebaseId: userSnap.id, taskHistory, groups, taskSchedules } as User;
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

export const getUserTasks = async (user: User): Promise<UserTask[]> => {
    if (!user || !user.groups || user.groups.length === 0) {
      return [];
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const dayOfWeek = format(new Date(), 'EEEE') as DayOfWeek;
    
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

export const getPersonalTasksForUser = async (userId: string): Promise<PersonalTask[]> => {
    if (!userId) return [];
    const tasksQuery = query(collection(db, 'personal_tasks'), where('userId', '==', userId));
    const tasksSnapshot = await getDocs(tasksQuery);
    return tasksSnapshot.docs.map(doc => ({ ...doc.data() as PersonalTask, id: doc.id }));
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
    // Remove orderby from here to avoid needing a composite index
    const meetingsQuery = query(collection(db, 'meetings'), where('groupId', '==', groupId));
    
    const [membersData, tasksSnapshot, meetingsSnapshot] = await Promise.all([
        Promise.all(memberPromises),
        getDocs(tasksQuery),
        getDocs(meetingsQuery)
    ]);

    const members = membersData.filter(Boolean) as User[];
    const tasks = tasksSnapshot.docs.map(d => ({ ...d.data() as Task, id: d.id }));
    // Sort in-memory after fetching
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

export async function getUnreadMessageCount(groupId: string, lastRead: Timestamp): Promise<number> {
    const messagesQuery = query(
        collection(db, 'groups', groupId, 'messages'),
        where('createdAt', '>', lastRead)
    );
    const snapshot = await getDocs(messagesQuery);
    return snapshot.size;
}


// --- Write Functions ---

export const createGroup = async (groupData: Omit<Group, 'id' | 'firebaseId' | 'members'>, adminId: string): Promise<string> => {
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

export const createTask = async (taskData: Omit<Task, 'id'>): Promise<string> => {
    const newTaskRef = collection(db, 'tasks');
    const docRef = await addDoc(newTaskRef, { ...taskData, createdAt: serverTimestamp() });
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
};

export const createPersonalTask = async (taskData: Omit<PersonalTask, 'id' | 'createdAt'>): Promise<PersonalTask> => {
    const docRef = await addDoc(collection(db, 'personal_tasks'), {
        ...taskData,
        createdAt: serverTimestamp()
    });
    await updateDoc(docRef, { id: docRef.id });
    const docSnap = await getDoc(docRef);
    return { ...docSnap.data(), id: docRef.id } as PersonalTask;
};

export const updateTask = async (taskId: string, data: Partial<Pick<Task, 'title' | 'description' | 'coins' | 'time'>>): Promise<void> => {
    const taskDocRef = doc(db, 'tasks', taskId);
    await updateDoc(taskDocRef, data);
};

export const addUserToGroup = async (userId: string, groupId: string, taskSchedules: UserTaskSchedule[]): Promise<void> => {
    const userDocRef = doc(db, "users", userId);
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
    
    const groupDocRef = doc(db, "groups", groupId);
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

export const updateUserProfile = async (userId: string, data: { goals?: string | null; habits?: string | null; avatarUrl?: string }): Promise<void> => {
    const userDocRef = doc(db, 'users', userId);
    const updateData: { [key: string]: any } = {};

    if (data.goals !== undefined && data.goals !== null) {
        updateData.goals = data.goals;
    }
    if (data.habits !== undefined && data.habits !== null) {
        updateData.habits = data.habits;
    }
     if (data.avatarUrl) {
        updateData.avatarUrl = data.avatarUrl;
    }
    
    if (Object.keys(updateData).length > 0) {
      await updateDoc(userDocRef, updateData);
    }
};

export const uploadAvatar = async (userId: string, file: Blob): Promise<string> => {
    const filePath = `avatars/${userId}/${Date.now()}.jpg`;
    const storageRef = ref(storage, filePath);
    const snapshot = await uploadBytes(storageRef, file);
    const newAvatarUrl = await getDownloadURL(snapshot.ref);
    return newAvatarUrl;
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

    // This is not efficient for large datasets, but fine for a demo.
    // A real-world app would use a dedicated search service like Algolia or Elasticsearch.
    
    const usersQuery = getAllUsers();
    const groupsQuery = getAllGroups();

    const [allUsers, allGroups] = await Promise.all([usersQuery, groupsQuery]);


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
}> => {
    if (!user || !user.groups || user.groups.length === 0) {
        return { todayTasks: [], overdueTasks: [], todayMeetings: [] };
    }

    const today = startOfDay(new Date());
    const todayDayOfWeek = format(today, 'EEEE') as DayOfWeek;

    const userSchedules = user.taskSchedules || [];

    // 1. Get Today's Meetings
    const groupIds = user.groups.slice(0, 30);
    const meetingsQuery = query(collection(db, 'meetings'), where('groupId', 'in', groupIds), where('day', '==', todayDayOfWeek));
    const groupsQuery = query(collection(db, 'groups'), where('__name__', 'in', groupIds));

    const [meetingsSnapshot, groupsSnapshot] = await Promise.all([getDocs(meetingsQuery), getDocs(groupsQuery)]);
    
    const groupMap = new Map(groupsSnapshot.docs.map(doc => [doc.id, doc.data().name]));

    const todayMeetings = meetingsSnapshot.docs.map(doc => {
        const meeting = doc.data() as WeeklyMeeting;
        return {
            ...meeting,
            id: doc.id,
            groupName: groupMap.get(meeting.groupId) || 'Noma\'lum guruh'
        };
    });


    // 2. Get All Scheduled Tasks
    const scheduledTaskIds = userSchedules.map(s => s.taskId);
    if (scheduledTaskIds.length === 0) {
         return { todayTasks: [], overdueTasks: [], todayMeetings };
    }
    const allScheduledTasksQuery = query(collection(db, 'tasks'), where('__name__', 'in', scheduledTaskIds.slice(0, 30)));
    const allTasksSnapshot = await getDocs(allScheduledTasksQuery);
    const allScheduledTasks = allTasksSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task));

    const todayTasks: UserTask[] = [];
    const overdueTasks: UserTask[] = [];
    
    const taskSchedulesMap = new Map(userSchedules.map(s => [s.taskId, s.days]));

    for (const task of allScheduledTasks) {
        const scheduleDays = taskSchedulesMap.get(task.id);
        if (!scheduleDays) continue;

        // Check for today's tasks
        if (scheduleDays.includes(todayDayOfWeek)) {
            const isCompletedToday = user.taskHistory.some(h => h.taskId === task.id && isSameDay(new Date(h.date), today));
            if (!isCompletedToday) {
                 todayTasks.push({
                    ...task,
                    groupName: groupMap.get(task.groupId) || 'Noma\'lum guruh',
                    isCompleted: false,
                });
            }
        }
        
        // Check for overdue tasks from past scheduled days
        for (let i = 1; i < 7; i++) { // check last 6 days
            const pastDate = startOfDay(new Date().setDate(today.getDate() - i));
            const pastDayOfWeek = format(pastDate, 'EEEE') as DayOfWeek;

            if (scheduleDays.includes(pastDayOfWeek)) {
                const wasCompleted = user.taskHistory.some(h => h.taskId === task.id && isSameDay(new Date(h.date), pastDate));
                if (!wasCompleted) {
                    // Avoid adding duplicates
                    if (!overdueTasks.some(t => t.id === task.id)) {
                        overdueTasks.push({
                            ...task,
                            groupName: groupMap.get(task.groupId) || 'Noma\'lum guruh',
                            isCompleted: false,
                        });
                    }
                }
            }
        }
    }

    return { todayTasks, overdueTasks, todayMeetings };
};

export const updateUserLastRead = async (userId: string, groupId: string) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        [`lastRead.${groupId}`]: Timestamp.now()
    });
};
