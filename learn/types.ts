export enum LearningMode {
  VIDEO = 'VIDEO',
  SIMULATION = 'SIMULATION',
  NOTES = 'NOTES',
  GAME = 'GAME',
  STORY = 'STORY'
}

export enum MasteryLevel {
  LOCKED = 'LOCKED',
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  MASTERED = 'MASTERED'
}

export interface SkillNode {
  id: string;
  name: string;
  level: MasteryLevel;
  dependencies: string[];
  x?: number;
  y?: number;
}

export interface DailyGoal {
  id: string;
  title: string;
  completed: boolean;
  type: 'concept' | 'quiz' | 'review';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface UserStats {
  streak: number;
  xp: number;
  mood: string;
  focusTime: number; // minutes
}