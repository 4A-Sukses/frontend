/**
 * Quiz Configuration
 * Central place for all quiz-related constants and settings
 */

export const QUIZ_CONFIG = {
  // Questions
  QUESTIONS_PER_MATERI: 3,
  OPTIONS_PER_QUESTION: 4,
  OPTION_LETTERS: ['A', 'B', 'C', 'D'] as const,

  // Scoring
  XP_PER_CORRECT_ANSWER: 5,
  PASSING_SCORE_PERCENTAGE: 60,

  // Timing (in seconds)
  TIME_PER_QUESTION: 60, // Optional: for future timer feature
  AUTO_NEXT_DELAY: 2000, // Delay before auto-moving to next question (ms)

  // UI
  ANIMATION_DURATION: 300, // milliseconds
  CONFETTI_DURATION: 3000, // milliseconds

  // Levels & Badges (for future features)
  BADGE_LEVELS: {
    AMATEUR: { level: 3, name: 'Amateur', icon: '🌱' },
    BASIC: { level: 5, name: 'Basic', icon: '📘' },
    ELITE: { level: 6, name: 'Elite', icon: '💎' },
    PRO: { level: 7, name: 'Pro', icon: '🏆' },
    ACE: { level: 8, name: 'Ace', icon: '👑' },
  },

  // Performance thresholds
  PERFORMANCE: {
    PERFECT: 100,
    EXCELLENT: 80,
    GOOD: 60,
    FAIR: 40,
    POOR: 0,
  },

  // Messages
  MESSAGES: {
    PERFECT: 'Perfect! You mastered this topic! 🏆',
    EXCELLENT: 'Excellent work! Keep it up! 🌟',
    GOOD: 'Good job! You passed! ✨',
    FAIR: 'Not bad! Keep practicing! 💪',
    POOR: 'Keep learning! You can do better! 📚',
  },

  // Colors (Tailwind classes)
  COLORS: {
    PRIMARY: 'blue',
    SECONDARY: 'purple',
    SUCCESS: 'green',
    ERROR: 'red',
    WARNING: 'yellow',
    INFO: 'gray',
  },
} as const;

/**
 * Quiz validation rules
 */
export const VALIDATION_RULES = {
  MIN_QUESTION_TEXT_LENGTH: 10,
  MAX_QUESTION_TEXT_LENGTH: 500,
  MIN_OPTION_TEXT_LENGTH: 1,
  MAX_OPTION_TEXT_LENGTH: 200,
  REQUIRED_OPTIONS_COUNT: 4,
  REQUIRED_CORRECT_ANSWERS: 1,
};

/**
 * AI Generation settings
 */
export const AI_CONFIG = {
  MODEL: 'llama-3.3-70b-versatile',
  TEMPERATURE: 0.7,
  MAX_TOKENS: 2048,
  DIFFICULTY_LEVELS: ['easy', 'medium', 'hard'] as const,
};

/**
 * Feature flags (for enabling/disabling features)
 */
export const FEATURE_FLAGS = {
  ENABLE_TIMER: false,
  ENABLE_HINTS: false,
  ENABLE_SKIP_QUESTION: false,
  ENABLE_LEADERBOARD: false,
  ENABLE_STREAK_TRACKING: false,
  ENABLE_SOUND_EFFECTS: false,
  ENABLE_CONFETTI: true,
};

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  QUIZ_PROGRESS: 'quiz_progress',
  QUIZ_HISTORY: 'quiz_history',
  SOUND_ENABLED: 'sound_enabled',
  THEME: 'theme',
} as const;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  GENERATE_QUIZ: '/api/quiz/generate',
  GET_QUIZ: (materiId: number) => `/api/quiz/game/${materiId}`,
  SUBMIT_ANSWER: (materiId: number) => `/api/quiz/game/${materiId}`,
  GET_MATERIALS: '/api/materials',
  GET_PROGRESS: (userId: string) => `/api/quiz/progress/${userId}`,
  GET_LEADERBOARD: '/api/quiz/leaderboard',
} as const;

/**
 * Helper function to get performance message
 */
export function getPerformanceMessage(percentage: number): string {
  const { PERFORMANCE, MESSAGES } = QUIZ_CONFIG;

  if (percentage === PERFORMANCE.PERFECT) return MESSAGES.PERFECT;
  if (percentage >= PERFORMANCE.EXCELLENT) return MESSAGES.EXCELLENT;
  if (percentage >= PERFORMANCE.GOOD) return MESSAGES.GOOD;
  if (percentage >= PERFORMANCE.FAIR) return MESSAGES.FAIR;
  return MESSAGES.POOR;
}

/**
 * Helper function to get color class based on score
 */
export function getScoreColor(percentage: number): string {
  const { PERFORMANCE, COLORS } = QUIZ_CONFIG;

  if (percentage >= PERFORMANCE.EXCELLENT) return COLORS.SUCCESS;
  if (percentage >= PERFORMANCE.GOOD) return COLORS.PRIMARY;
  if (percentage >= PERFORMANCE.FAIR) return COLORS.WARNING;
  return COLORS.ERROR;
}

/**
 * Helper to calculate XP
 */
export function calculateTotalXP(correctAnswers: number): number {
  return correctAnswers * QUIZ_CONFIG.XP_PER_CORRECT_ANSWER;
}

/**
 * Helper to check if passed
 */
export function isPassed(score: number, total: number): boolean {
  const percentage = (score / total) * 100;
  return percentage >= QUIZ_CONFIG.PASSING_SCORE_PERCENTAGE;
}