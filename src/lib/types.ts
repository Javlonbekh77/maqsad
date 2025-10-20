import { FieldValue } from "firebase/firestore";

export type Task = {
  id: string;
  title: string;
  description: string;
  coins: number;
  groupId: string;
  time?: string; // Optional time for the task
  createdAt: FieldValue;
};

export type TaskHistory = {
  taskId: string;
  date: string; // YYYY-MM-DD
};

export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export type UserTaskSchedule = {
  taskId: string;
  days: DayOfWeek[];
};

export type User = {
  firebaseId: string; // Firestore document ID
  id: string; // This is the Firebase Auth UID
  firstName: string;
  lastName:string;
  fullName: string; // Combined for easier display
  email: string;
  avatarUrl: string;
  coins: number;
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
};

export type WeeklyMeeting = {
  id: string;
  groupId: string;
  title: string;
  day: DayOfWeek | string;
  time?: string; // Optional
  url?: string; // Optional
  createdAt?: FieldValue;
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
export type UserTask = Task & {
  groupName: string;
  isCompleted: boolean;
};

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  createdAt: FieldValue;
  user: {
    name: string;
    avatarUrl: string;
  }
  isEdited?: boolean;
}
