import { SkillNode, MasteryLevel, DailyGoal, LearningMode } from './types';

export const INITIAL_SKILLS: SkillNode[] = [
  { id: 'math_101', name: 'Algebra Basics', level: MasteryLevel.MASTERED, dependencies: [] },
  { id: 'math_102', name: 'Linear Equations', level: MasteryLevel.INTERMEDIATE, dependencies: ['math_101'] },
  { id: 'math_103', name: 'Quadratics', level: MasteryLevel.BEGINNER, dependencies: ['math_102'] },
  { id: 'phys_101', name: 'Motion', level: MasteryLevel.INTERMEDIATE, dependencies: ['math_101'] },
  { id: 'phys_102', name: 'Forces', level: MasteryLevel.LOCKED, dependencies: ['phys_101'] },
  { id: 'chem_101', name: 'Atomic Structure', level: MasteryLevel.MASTERED, dependencies: [] },
  { id: 'bio_101', name: 'Cell Biology', level: MasteryLevel.BEGINNER, dependencies: [] },
];

export const INITIAL_GOALS: DailyGoal[] = [
  { id: 'g1', title: 'Complete Linear Equations Quiz', completed: false, type: 'quiz' },
  { id: 'g2', title: 'Watch Motion Micro-Lecture', completed: true, type: 'concept' },
  { id: 'g3', title: 'Review Algebra Flashcards', completed: false, type: 'review' },
];

export const AVAILABLE_MODES = [
  { id: LearningMode.VIDEO, icon: 'fa-video', label: 'Video' },
  { id: LearningMode.SIMULATION, icon: 'fa-flask', label: 'Simulation' },
  { id: LearningMode.NOTES, icon: 'fa-book-open', label: 'Notes' },
  { id: LearningMode.GAME, icon: 'fa-gamepad', label: 'Game' },
  { id: LearningMode.STORY, icon: 'fa-scroll', label: 'Story' },
];

export const MOODS = ['🤩', '🙂', '😐', '😫', '😡'];