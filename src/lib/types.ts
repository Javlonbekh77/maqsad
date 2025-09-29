export type Task = {
  id: string;
  title: string;
  description: string;
  coins: number;
  groupId: string;
};

export type TaskHistory = {
  taskId: string;
  date: string; // YYYY-MM-DD
};

export type User = {
  firebaseId: string; // Firestore document ID
  id: string; // This is the Firebase Auth UID
  firstName: string;
  lastName: string;
  fullName: string; // Combined for easier display
  email: string;
  avatarUrl: string;
  coins: number;
  goals: string;
  habits: string;
  groups: string[]; // array of group IDs
  occupation: string;
  taskHistory: TaskHistory[];
  university?: string;
  specialization?: string;
  course?: string;
  telegram?: string;
};

export type WeeklyMeeting = {
  id: string;
  groupId: string;
  title: string;
  day: string;
  time: string;
  url: string;
}

export type Group = {
  firebaseId?: string; // Firestore document ID
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  members: string[]; // array of user IDs
  adminId: string;
};

// Represents a user's specific task from a group they've joined
export type UserTask = Task & {
  groupName: string;
  isCompleted: boolean;
};
