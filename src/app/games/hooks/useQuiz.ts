import React, { useState, useCallback, useEffect } from 'react';

export interface QuizOption {
  id: number;
  letter: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface QuizQuestion {
  id: number;
  questionNumber: number;
  questionText: string;
  options: QuizOption[];
}

export interface QuizAnswer {
  questionId: number;
  selectedOptionId: number;
  isCorrect: boolean;
  correctOptionId: number;
}

export interface QuizState {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  answers: QuizAnswer[];
  score: number;
  totalXP: number;
  isLoading: boolean;
  isCompleted: boolean;
  error: string | null;
}

export function useQuiz(materiId: number, userId: string) {
  const [state, setState] = useState<QuizState>({
    questions: [],
    currentQuestionIndex: 0,
    answers: [],
    score: 0,
    totalXP: 0,
    isLoading: true,
    isCompleted: false,
    error: null,
  });

  // Track if we're currently generating to prevent race conditions
  const isGeneratingRef = React.useRef(false);

  // Fetch quiz questions
  const fetchQuiz = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch(`/api/quiz/game/${materiId}`);

      // If 404, automatically generate questions
      if (response.status === 404) {
        console.log('No questions found, auto-generating...');

        // Prevent race condition - check if already generating
        if (isGeneratingRef.current) {
          console.log('Already generating, waiting...');
          // Poll until questions are ready (max 30 seconds)
          const maxRetries = 15;
          for (let i = 0; i < maxRetries; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const retryResponse = await fetch(`/api/quiz/game/${materiId}`);
            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              console.log('Questions ready after waiting!');
              setState((prev) => ({
                ...prev,
                questions: retryData.questions,
                isLoading: false,
              }));
              return;
            }
          }
          // If still not ready after 30 seconds, throw error
          throw new Error('Question generation is taking too long. Please try again later.');
        }

        // Set generating flag
        isGeneratingRef.current = true;

        try {
          // Get material details first
          const materialResponse = await fetch(`/api/materials?materialId=${materiId}`);
          const materialData = await materialResponse.json();

          if (!materialData.success || !materialData.materials?.length) {
            throw new Error('Could not fetch material data');
          }

          const material = materialData.materials[0];

          console.log('Material fetched:', material.title);
          console.log('Calling generate API...');

          // Generate questions automatically with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

          try {
            const generateResponse = await fetch('/api/quiz/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                materiId: materiId,
                topikId: material.topicId || material.topic_id,
                materiTitle: material.title,
                materiContent: material.content || 'No content available'
              }),
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            const generateData = await generateResponse.json();

            console.log('Generate API response:', generateData);

            if (!generateResponse.ok || !generateData.success) {
              throw new Error(generateData.details || generateData.error || 'Failed to generate questions');
            }

            console.log('Questions generated successfully! Fetching questions...');

            // Retry fetching after generation
            const retryResponse = await fetch(`/api/quiz/game/${materiId}`);
            if (!retryResponse.ok) {
              const retryData = await retryResponse.json();
              throw new Error(retryData.details || 'Failed to fetch questions after generation');
            }

            const retryData = await retryResponse.json();
            console.log('Questions fetched:', retryData.questions?.length);

            setState((prev) => ({
              ...prev,
              questions: retryData.questions,
              isLoading: false,
            }));
            return;
          } catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
              throw new Error('Question generation timed out. The AI service is taking too long. Please try again.');
            }
            throw fetchError;
          }
        } finally {
          // Reset generating flag
          isGeneratingRef.current = false;
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to fetch quiz questions');
      }

      const data = await response.json();

      setState((prev) => ({
        ...prev,
        questions: data.questions,
        isLoading: false,
      }));
    } catch (error) {
      console.error('fetchQuiz error:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      }));
    }
  }, [materiId]);

  // Submit answer
  const submitAnswer = useCallback(
    async (questionId: number, selectedOptionId: number) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true }));

        const response = await fetch(`/api/quiz/game/${materiId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            questionId,
            selectedOptionId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to submit answer');
        }

        const data = await response.json();

        setState((prev) => {
          const newAnswers = [
            ...prev.answers,
            {
              questionId,
              selectedOptionId,
              isCorrect: data.isCorrect,
              correctOptionId: data.correctOptionId,
            },
          ];

          const newScore = newAnswers.filter((a) => a.isCorrect).length;
          const newTotalXP = prev.totalXP + data.xpEarned;
          const isLastQuestion = prev.currentQuestionIndex >= prev.questions.length - 1;

          return {
            ...prev,
            answers: newAnswers,
            score: newScore,
            totalXP: newTotalXP,
            isLoading: false,
            isCompleted: isLastQuestion,
          };
        });

        return {
          isCorrect: data.isCorrect,
          correctOptionId: data.correctOptionId,
          xpEarned: data.xpEarned,
        };
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown error',
          isLoading: false,
        }));
        throw error;
      }
    },
    [materiId, userId]
  );

  // Move to next question
  const nextQuestion = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentQuestionIndex: Math.min(
        prev.currentQuestionIndex + 1,
        prev.questions.length - 1
      ),
    }));
  }, []);

  // Reset quiz
  const resetQuiz = useCallback(() => {
    setState({
      questions: [],
      currentQuestionIndex: 0,
      answers: [],
      score: 0,
      totalXP: 0,
      isLoading: true,
      isCompleted: false,
      error: null,
    });
    fetchQuiz();
  }, [fetchQuiz]);

  // Get current question
  const getCurrentQuestion = useCallback(() => {
    return state.questions[state.currentQuestionIndex] || null;
  }, [state.questions, state.currentQuestionIndex]);

  // Check if current question is answered
  const isCurrentQuestionAnswered = useCallback(() => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return false;
    return state.answers.some((a) => a.questionId === currentQuestion.id);
  }, [getCurrentQuestion, state.answers]);

  // Get answer for current question
  const getCurrentAnswer = useCallback(() => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return null;
    return state.answers.find((a) => a.questionId === currentQuestion.id) || null;
  }, [getCurrentQuestion, state.answers]);

  // Initial fetch
  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  return {
    ...state,
    currentQuestion: getCurrentQuestion(),
    isCurrentQuestionAnswered: isCurrentQuestionAnswered(),
    currentAnswer: getCurrentAnswer(),
    submitAnswer,
    nextQuestion,
    resetQuiz,
    refetch: fetchQuiz,
  };
}