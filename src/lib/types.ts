import { FieldValue, Timestamp } from "firebase/firestore";

export type Task = {
  id: string;
  title: string;
  description: string;
  coins: number;
  groupId: string;
  time?: string; // Optional time for the task
  createdAt: FieldValue;
};

export type PersonalTask = {
  id: string;
  userId: string;
  title: string;
  description: string;
  schedule: DayOfWeek[];
  createdAt: FieldValue;
  // Personal tasks will have a fixed coin value, so no need to store it here.
}

export type TaskHistory = {
  taskId: string;
  date: string; // YYYY-MM-DD
  taskType: 'group' | 'personal';
};

export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export type UserTaskSchedule = {
  taskId: string;
  days: DayOfWeek[];
};

export type LastRead = {
  [groupId: string]: Timestamp;
}

export type User = {
  firebaseId: string; // Firestore document ID
  id: string; // This is the Firebase Auth UID
  firstName: string;
  lastName:string;
  fullName: string; // Combined for easier display
  email: string;
  avatarUrl: string;
  coins: number; // For group tasks, Gold Coins
  silverCoins: number; // For personal tasks, Silver Coins
  goals: string;
  habits: string;
  groups: string[]; // array of group IDs
  occupation: string;
  taskHistory: TaskHistory[];
  taskSchedules?: UserTaskSchedule[]; // New field for task schedules
  university?: string;
  specialization?: string;
  course?: string;
  telegram?: string;
  createdAt: FieldValue;
  lastRead?: LastRead;
};

export type WeeklyMeeting = {
  id: string;
  groupId: string;
  title: string;
  day: DayOfWeek | string;
  time?: string; // Optional
  url?: string; // Optional
  createdAt?: FieldValue | Timestamp;
}

export type Group = {
  firebaseId: string; // Firestore document ID
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  members: string[]; // array of user IDs
  adminId: string;
  createdAt: FieldValue;
};

// Represents a user's specific task from a group they've joined
export type UserTask = (Task | PersonalTask) & {
  groupName?: string; // Optional because personal tasks don't have a group
  isCompleted: boolean;
  taskType: 'group' | 'personal';
  coins: number; // This will be gold for group, silver for personal
  schedule?: DayOfWeek[];
  history?: TaskHistory[];
};


export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  createdAt: FieldValue | Timestamp;
  user: {
    name: string;
    avatarUrl: string;
  }
  isEdited?: boolean;
}
