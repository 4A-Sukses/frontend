import { QuizQuestion, QuizAnswer, QuizProgress } from '../types/quiz.types';

/**
 * Calculate quiz score based on answers
 */
export function calculateScore(answers: QuizAnswer[]): number {
  return answers.filter((answer) => answer.isCorrect).length;
}

/**
 * Calculate total XP earned from quiz
 * @param correctAnswers - Number of correct answers
 * @param xpPerQuestion - XP awarded per correct answer (default: 5)
 */
export function calculateXP(correctAnswers: number, xpPerQuestion: number = 5): number {
  return correctAnswers * xpPerQuestion;
}

/**
 * Calculate quiz percentage score
 */
export function calculatePercentage(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

/**
 * Determine if user passed the quiz
 * @param percentage - Score percentage
 * @param passingScore - Minimum percentage to pass (default: 60)
 */
export function hasPassed(percentage: number, passingScore: number = 60): boolean {
  return percentage >= passingScore;
}

/**
 * Get performance message based on score
 */
export function getPerformanceMessage(percentage: number): string {
  if (percentage === 100) return 'Perfect! You mastered this topic! 🏆';
  if (percentage >= 80) return 'Excellent work! Keep it up! 🌟';
  if (percentage >= 60) return 'Good job! You passed! ✨';
  if (percentage >= 40) return 'Not bad! Keep practicing! 💪';
  return 'Keep learning! You can do better! 📚';
}

/**
 * Get emoji based on score percentage
 */
export function getScoreEmoji(percentage: number): string {
  if (percentage === 100) return '🏆';
  if (percentage >= 80) return '🎉';
  if (percentage >= 60) return '✨';
  if (percentage >= 40) return '💪';
  return '📚';
}

/**
 * Validate quiz question structure
 */
export function isValidQuizQuestion(question: QuizQuestion): boolean {
  // Must have exactly 4 options
  if (question.options.length !== 4) return false;

  // Must have all letters A, B, C, D
  const letters = question.options.map((opt) => opt.letter).sort();
  if (letters.join('') !== 'ABCD') return false;

  // Each option must have text
  if (question.options.some((opt) => !opt.text.trim())) return false;

  // Question text must not be empty
  if (!question.questionText.trim()) return false;

  return true;
}

/**
 * Shuffle array (for randomizing options if needed)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Format time in MM:SS format
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get progress percentage
 */
export function getProgressPercentage(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
}

/**
 * Calculate streak bonus (for future feature)
 */
export function calculateStreakBonus(streak: number, baseXP: number): number {
  // 10% bonus per streak, max 50%
  const bonusPercentage = Math.min(streak * 0.1, 0.5);
  return Math.round(baseXP * bonusPercentage);
}

/**
 * Check if quiz is completed
 */
export function isQuizCompleted(progress: QuizProgress): boolean {
  return progress.questionsAnswered >= progress.totalQuestions;
}

/**
 * Get letter from index (0 -> A, 1 -> B, etc.)
 */
export function getLetterFromIndex(index: number): 'A' | 'B' | 'C' | 'D' {
  const letters: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  return letters[index] || 'A';
}

/**
 * Get index from letter (A -> 0, B -> 1, etc.)
 */
export function getIndexFromLetter(letter: 'A' | 'B' | 'C' | 'D'): number {
  const map: Record<'A' | 'B' | 'C' | 'D', number> = { A: 0, B: 1, C: 2, D: 3 };
  return map[letter] || 0;
}

/**
 * Generate confetti positions for celebration (simple implementation)
 */
export function generateConfettiPositions(count: number = 50): Array<{ x: number; y: number }> {
  return Array.from({ length: count }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
  }));
}

/**
 * Sanitize text input (basic XSS prevention)
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}