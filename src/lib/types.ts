import { FieldValue, Timestamp } from "firebase/firestore";

export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export type ScheduleType = 'one-time' | 'date-range' | 'recurring';

export type TaskSchedule = {
  type: ScheduleType;
  // For 'one-time'
  date?: string; // YYYY-MM-DD
  // For 'date-range'
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  // For 'recurring'
  days?: DayOfWeek[];
}

export type Task = {
  id: string;
  title: string;
  description:string;
  coins: number;
  groupId: string;
  time?: string; // Optional time for the task
  createdAt: FieldValue | Timestamp;
  // New fields
  estimatedTime?: string;
  satisfactionRating?: number;
  schedule: TaskSchedule;
  hasTimer?: boolean; // Whether this task has a timer
  timerDuration?: number; // Timer duration in minutes (if hasTimer is true)
};

export type PersonalTask = {
  id:string;
  userId: string;
  title: string;
  description: string;
  createdAt: FieldValue | Timestamp;
  // New fields
  estimatedTime?: string;
  satisfactionRating?: number;
  schedule: TaskSchedule;
  visibility: 'public' | 'private';
  hasTimer?: boolean; // Whether this task has a timer
  timerDuration?: number; // Timer duration in minutes (if hasTimer is true)
}

export type TaskHistory = {
  taskId: string;
  date: string; // YYYY-MM-DD
  taskType: 'group' | 'personal';
};

export type UserTaskSchedule = {
  taskId: string;
  schedule: TaskSchedule;
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
  coins: number;
  silverCoins: number;
  goals: string;
  habits: string;
  groups: string[]; // array of group IDs
  occupation: string;
  taskHistory: TaskHistory[];
  taskSchedules?: UserTaskSchedule[]; // User's specific schedules for group tasks
  university?: string;
  specialization?: string;
  course?: string;
  telegram?: string;
  createdAt: FieldValue;
  lastRead?: LastRead;
  notificationsLastCheckedAt?: Timestamp;
  lastJournalRewardDate?: string;
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
  schedule: TaskSchedule; // Now unified
  history?: TaskHistory[];
  createdAt: FieldValue | Timestamp;
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

export type UnreadMessageInfo = {
    groupId: string;
    groupName: string;
    count: number;
};

export type JournalEntry = {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  content: string;
  createdAt: FieldValue | Timestamp;
  updatedAt: FieldValue | Timestamp;
};
