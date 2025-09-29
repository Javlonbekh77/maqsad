
'use server';

import type { User, Group, Task, TaskHistory, WeeklyMeeting } from './types';
import { PlaceHolderImages } from './placeholder-images';
import { subDays, format } from 'date-fns';

// --- In-memory store ---
// This is a simple in-memory store. In a real application, you would use a database.
let usersStore: User[] = [];
let groupsStore: Group[] = [];
let tasksStore: Task[] = [];
let meetingsStore: WeeklyMeeting[] = [];

const getUserAvatar = (id: string) => PlaceHolderImages.find((img) => img.id === id)?.imageUrl || '';
const getGroupImage = (id: string) => PlaceHolderImages.find((img) => img.id === id)?.imageUrl || '';
const getGroupImageHint = (id: string) => PlaceHolderImages.find((img) => img.id === id)?.imageHint || '';

const generateTaskHistory = (tasks: {taskId: string, frequency: number}[]): TaskHistory[] => {
    const history: TaskHistory[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
        const date = subDays(today, i);
        tasks.forEach(taskInfo => {
             if (Math.random() < taskInfo.frequency) {
                history.push({ taskId: taskInfo.taskId, date: format(date, 'yyyy-MM-dd') });
            }
        })
    }
    return history;
}

function initializeData() {
  const initialUsers: User[] = [
    {
      id: 'user-1',
      fullName: 'Sarah Johnson',
      avatarUrl: getUserAvatar('user1'),
      coins: 1250,
      goals: 'Run a 5k, read 12 books this year',
      habits: 'Morning jogs, reading before bed',
      groups: ['group-1', 'group-2'],
      occupation: 'Graphic Designer at Studio Ghibli',
      taskHistory: generateTaskHistory([{taskId: 'task-1', frequency: 0.8}, {taskId: 'task-3', frequency: 0.9}]),
    },
    {
      id: 'user-2',
      fullName: 'David Martinez',
      avatarUrl: getUserAvatar('user2'),
      coins: 980,
      goals: 'Learn Next.js, contribute to an open-source project',
      habits: 'Daily coding challenges, reviewing pull requests',
      groups: ['group-3'],
      occupation: 'Student at Astrum IT Academy',
      taskHistory: generateTaskHistory([{taskId: 'task-5', frequency: 0.7}]),
    },
    {
      id: 'user-3',
      fullName: 'Emily White',
      avatarUrl: getUserAvatar('user3'),
      coins: 1500,
      goals: 'Workout 4 times a week',
      habits: 'Gym sessions, meal prepping',
      groups: ['group-1', 'group-4'],
      occupation: 'Fitness Coach at Ecofit',
      taskHistory: generateTaskHistory([{taskId: 'task-1', frequency: 0.6}, {taskId: 'task-7', frequency: 0.95}]),
    },
    {
      id: 'user-4',
      fullName: 'Michael Brown',
      avatarUrl: getUserAvatar('user4'),
      coins: 720,
      goals: 'Read more classic literature',
      habits: 'Weekend reading sprints',
      groups: ['group-2'],
      occupation: 'Librarian at National Library',
      taskHistory: generateTaskHistory([{taskId: 'task-3', frequency: 0.5}]),
    },
  ];

  const initialGroups: Group[] = [
    {
      id: 'group-1',
      name: 'Morning Runners',
      description: 'A group for early birds who love to start their day with a run.',
      imageUrl: getGroupImage('group1'),
      imageHint: getGroupImageHint('group1'),
      members: ['user-1', 'user-3'],
      adminId: 'user-1',
    },
    {
      id: 'group-2',
      name: 'Book Worms Society',
      description: 'Discussing a new book every month. From classics to modern sci-fi.',
      imageUrl: getGroupImage('group2'),
      imageHint: getGroupImageHint('group2'),
      members: ['user-1', 'user-4'],
      adminId: 'user-4',
    },
    {
      id: 'group-3',
      name: 'Code Crafters',
      description: 'For developers passionate about building amazing things with code.',
      imageUrl: getGroupImage('group3'),
      imageHint: getGroupImageHint('group3'),
      members: ['user-2'],
      adminId: 'user-2',
    },
      {
      id: 'group-4',
      name: 'Fitness Fanatics',
      description: 'Share workout plans, nutrition tips, and stay accountable.',
      imageUrl: getGroupImage('group4'),
      imageHint: getGroupImageHint('group4'),
      members: ['user-3'],
      adminId: 'user-3',
    },
  ];

  const initialTasks: Task[] = [
    {
      id: 'task-1',
      groupId: 'group-1',
      title: 'Complete a 3-mile run',
      description: 'Log a run of at least 3 miles. Share your time if you feel like it!',
      coins: 50,
    },
    {
      id: 'task-2',
      groupId: 'group-1',
      title: 'Post a sunrise picture from your run',
      description: 'Share the beauty of the morning with the group.',
      coins: 20,
    },
    {
      id: 'task-3',
      groupId: 'group-2',
      title: 'Finish this month\'s book',
      description: 'Complete "Dune" by Frank Herbert and prepare for the discussion.',
      coins: 100,
    },
    {
      id: 'task-4',
      groupId: 'group-2',
      title: 'Share a quote from the book',
      description: 'Post your favorite quote in the group chat.',
      coins: 15,
    },
    {
      id: 'task-5',
      groupId: 'group-3',
      title: 'Solve a LeetCode problem',
      description: 'Pick a problem (medium difficulty) and share your solution.',
      coins: 75,
    },
    {
      id: 'task-6',
      groupId: 'group-3',
      title: 'Review a PR',
      description: 'Provide a constructive review on a project PR.',
      coins: 40,
    },
    {
        id: 'task-7',
        groupId: 'group-4',
        title: 'Complete 3 workouts this week',
        description: 'Log at least 3 separate workout sessions.',
        coins: 80,
    },
    {
        id: 'task-8',
        groupId: 'group-4',
        title: 'Share a healthy recipe',
        description: 'Post a recipe you love in the group resources.',
        coins: 25,
    }
  ];

  const initialMeetings: WeeklyMeeting[] = [
    { id: 'meet-1', groupId: 'group-1', title: 'Weekly Sync & Motivation', day: 'Mondays', time: '8:00 AM', url: 'https://meet.google.com' },
    { id: 'meet-2', groupId: 'group-2', title: 'Book Discussion: Dune Ch. 1-5', day: 'Wednesdays', time: '7:00 PM', url: 'https://meet.google.com' },
    { id: 'meet-3', groupId: 'group-3', title: 'Code Review & Pairing Session', day: 'Thursdays', time: '4:00 PM', url: 'https://meet.google.com' },
    { id: 'meet-4', groupId: 'group-4', title: 'Workout Plan Review', day: 'Sundays', time: '10:00 AM', url: 'https://meet.google.com' },
  ];

  // Deep copy to avoid mutation issues in hot-reloading environments
  usersStore = JSON.parse(JSON.stringify(initialUsers));
  groupsStore = JSON.parse(JSON.stringify(initialGroups));
  tasksStore = JSON.parse(JSON.stringify(initialTasks));
  meetingsStore = JSON.parse(JSON.stringify(initialMeetings));
}

// Initialize data if the store is empty
if (usersStore.length === 0) {
  initializeData();
}

// --- Data Access Functions ---
// All functions are now async to simulate a real database call.

export const getGroups = async (): Promise<Group[]> => {
  return Promise.resolve(JSON.parse(JSON.stringify(groupsStore)));
};

export const getGroupById = async (id: string): Promise<Group | undefined> => {
  const group = groupsStore.find((g) => g.id === id);
  return Promise.resolve(group ? JSON.parse(JSON.stringify(group)) : undefined);
};

export const getGroupsByUserId = async (userId: string): Promise<Group[]> => {
  const user = await getUserById(userId);
  if (!user) {
    return [];
  }
  const allGroups = await getGroups();
  const userGroups = allGroups.filter(group => user.groups.includes(group.id));
  return userGroups;
};

export const getTasksByGroupId = async (groupId: string): Promise<Task[]> => {
  const tasks = tasksStore.filter((t) => t.groupId === groupId);
  return Promise.resolve(JSON.parse(JSON.stringify(tasks)));
};

export const getMeetingsByGroupId = async (groupId: string): Promise<WeeklyMeeting[]> => {
  const meetings = meetingsStore.filter((m) => m.groupId === groupId);
  return Promise.resolve(JSON.parse(JSON.stringify(meetings)));
};

export const getUsers = async (): Promise<User[]> => {
  return Promise.resolve(JSON.parse(JSON.stringify(usersStore)));
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  const user = usersStore.find((u) => u.id === id);
  return Promise.resolve(user ? JSON.parse(JSON.stringify(user)) : undefined);
};

export const getTopUsers = async (): Promise<User[]> => {
    const users = await getUsers();
    return [...users].sort((a, b) => b.coins - a.coins).slice(0, 10);
};

export const getTopGroups = async (): Promise<(Group & { coins: number })[]> => {
    const groups = await getGroups();
    const users = await getUsers();

    return groups.map(group => {
        const groupCoins = group.members.reduce((total, memberId) => {
            const user = users.find(u => u.id === memberId);
            return total + (user?.coins || 0);
        }, 0);
        return { ...group, coins: groupCoins };
    }).sort((a, b) => b.coins - a.coins).slice(0, 10);
};

export const getUserTasks = async (userId: string) => {
    const user = await getUserById(userId);
    if (!user) return [];
    
    const allTasks = await Promise.resolve(tasksStore);
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const tasksForUser = allTasks.filter(task => user.groups.includes(task.groupId));
    
    const userTasksWithDetails = await Promise.all(tasksForUser.map(async task => {
        const group = await getGroupById(task.groupId);
        const isCompletedToday = user.taskHistory.some(h => h.taskId === task.id && h.date === today);
        return {
            ...task,
            groupName: group?.name || 'Unknown Group',
            isCompleted: isCompletedToday,
        };
    }));

    return userTasksWithDetails;
};

export const getGoalMates = async (userId: string): Promise<User[]> => {
    const currentUser = await getUserById(userId);
    if (!currentUser) return [];

    const groupIds = currentUser.groups;
    const goalMatesMap = new Map<string, User>();

    for (const groupId of groupIds) {
        const group = await getGroupById(groupId);
        if (group) {
            for (const memberId of group.members) {
                if (memberId !== userId) {
                    const user = await getUserById(memberId);
                    if (user) {
                        goalMatesMap.set(user.id, user);
                    }
                }
            }
        }
    }

    return Array.from(goalMatesMap.values());
};

// --- Mutation functions ---

export const addUserToGroup = async (userId: string, groupId: string): Promise<void> => {
    usersStore = usersStore.map(user => {
        if (user.id === userId && !user.groups.includes(groupId)) {
            return { ...user, groups: [...user.groups, groupId] };
        }
        return user;
    });

    groupsStore = groupsStore.map(group => {
        if (group.id === groupId && !group.members.includes(userId)) {
            return { ...group, members: [...group.members, userId] };
        }
        return group;
    });
    return Promise.resolve();
};

export const completeUserTask = async (userId: string, taskId: string, coins: number): Promise<void> => {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  usersStore = usersStore.map(user => {
    if (user.id === userId) {
      const alreadyCompleted = user.taskHistory.some(
        h => h.taskId === taskId && h.date === today
      );
      
      if (!alreadyCompleted) {
        return {
          ...user,
          coins: user.coins + coins,
          taskHistory: [...user.taskHistory, { taskId, date: today }],
        };
      }
    }
    return user;
  });
  return Promise.resolve();
};

export const updateUserProfile = async (userId: string, data: { goals: string; habits: string }): Promise<void> => {
  usersStore = usersStore.map(user => {
    if (user.id === userId) {
      return { ...user, ...data };
    }
    return user;
  });
  return Promise.resolve();
};
