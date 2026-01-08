// Quiz Question Types
export interface QuizOption {
  id: number;
  letter: 'A' | 'B' | 'C' | 'D';
  text: string;
  isCorrect?: boolean; // Only visible to admin/API, not to client during quiz
}

export interface QuizQuestion {
  id: number;
  materiId: number;
  topikId: number;
  questionNumber: number;
  questionText: string;
  options: QuizOption[];
}

// Quiz Answer & Progress Types
export interface QuizAnswer {
  id?: number;
  userId: string; // UUID
  questionId: number;
  selectedOptionId: number;
  isCorrect: boolean;
  answeredAt?: Date;
}

export interface QuizProgress {
  id?: number;
  userId: string; // UUID
  materiId: number;
  questionsAnswered: number;
  correctAnswers: number;
  totalQuestions: number;
  isCompleted: boolean;
  xpEarned: number;
  completedAt?: Date;
}

// API Request/Response Types
export interface GenerateQuizRequest {
  materiId: number;
  topikId: number;
  materiTitle: string;
  materiContent: string;
}

export interface GenerateQuizResponse {
  success: boolean;
  materiId: number;
  topikId: number;
  questions: {
    questionNumber: number;
    questionText: string;
    options: {
      letter: 'A' | 'B' | 'C' | 'D';
      text: string;
      isCorrect: boolean;
    }[];
  }[];
}

export interface FetchQuizResponse {
  success: boolean;
  materiId: number;
  questions: QuizQuestion[];
}

export interface SubmitAnswerRequest {
  userId: string; // UUID
  questionId: number;
  selectedOptionId: number;
}

export interface SubmitAnswerResponse {
  success: boolean;
  isCorrect: boolean;
  xpEarned: number;
  correctOptionId: number;
}

// UI State Types
export interface QuizGameState {
  currentQuestionIndex: number;
  selectedOption: number | null;
  showResult: boolean;
  isSubmitting: boolean;
}

// Component Props Types
export interface QuizGameProps {
  materiId: number;
  materiTitle: string;
  userId: string; // UUID
  topikId?: number;
  onComplete?: (score: number, totalXP: number) => void;
  onBack?: () => void;
}