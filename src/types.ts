export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  xp: number;
  streak: number;
  lastActive: string;
  createdAt: string;
}

export interface Lesson {
  title: string;
  subtitle: string;
  content: string; // Markdown text support
}

export interface CourseModule {
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: "Principiante" | "Intermedio" | "Avanzado";
  imageType: string; // 'Marketing', 'Fotografia', etc.
  modulesCount: number;
  isAIGenerated: boolean;
  createdBy: string;
  createdAt: string;
  modules?: CourseModule[];
}

export interface UserCourseProgress {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  category: string;
  progressPercent: number;
  enrolledAt: string;
  lastStudiedAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: "user" | "model";
  content: string;
  createdAt: string;
  courseId?: string;
}

export interface StudyLesson {
  id: string;
  userId: string;
  title: string;
  subtitle: string;
  category: string;
  completed: boolean;
  createdAt: string;
}

export interface RecentAchievement {
  title: string;
  description: string;
  xpAwarded: number;
  completedAt: string;
}
