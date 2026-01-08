/**
 * Example Database Queries for Quiz System
 *
 * NOTE: Ini adalah contoh query. Sesuaikan dengan database client yang digunakan.
 * Bisa menggunakan: Prisma, node-postgres (pg), mysql2, atau ORM lainnya.
 */

// ============================================
// 1. INSERT GENERATED QUESTIONS TO DATABASE
// ============================================

/**
 * Save AI-generated quiz questions to database
 */
export async function saveGeneratedQuestions(
  materiId: number,
  topikId: number,
  questions: Array<{
    questionNumber: number;
    questionText: string;
    options: Array<{
      letter: 'A' | 'B' | 'C' | 'D';
      text: string;
      isCorrect: boolean;
    }>;
  }>
) {
  // Example with raw SQL (node-postgres)
  // const client = await pool.connect();

  try {
    // await client.query('BEGIN');

    for (const q of questions) {
      // Insert question
      const questionResult = `
        INSERT INTO quiz_questions (materi_id, topik_id, question_number, question_text)
        VALUES (${materiId}, ${topikId}, ${q.questionNumber}, '${q.questionText}')
        RETURNING id
      `;
      // const { rows } = await client.query(questionResult);
      // const questionId = rows[0].id;

      // Insert options
      for (const opt of q.options) {
        const optionQuery = `
          INSERT INTO quiz_options (question_id, option_letter, option_text, is_correct)
          VALUES (questionId, '${opt.letter}', '${opt.text}', ${opt.isCorrect})
        `;
        // await client.query(optionQuery);
      }
    }

    // await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    // await client.query('ROLLBACK');
    throw error;
  } finally {
    // client.release();
  }
}

// ============================================
// 2. FETCH QUIZ QUESTIONS FOR USER
// ============================================

/**
 * Get all questions for a specific materi
 */
export async function getQuizQuestions(materiId: number) {
  const query = `
    SELECT
      q.id,
      q.materi_id as "materiId",
      q.topik_id as "topikId",
      q.question_number as "questionNumber",
      q.question_text as "questionText",
      json_agg(
        json_build_object(
          'id', o.id,
          'letter', o.option_letter,
          'text', o.option_text
        ) ORDER BY o.option_letter
      ) as options
    FROM quiz_questions q
    LEFT JOIN quiz_options o ON q.id = o.question_id
    WHERE q.materi_id = ${materiId}
    GROUP BY q.id, q.materi_id, q.topik_id, q.question_number, q.question_text
    ORDER BY q.question_number
  `;

  // const result = await pool.query(query);
  // return result.rows;
  return [];
}

// ============================================
// 3. CHECK IF QUESTIONS ALREADY EXIST
// ============================================

/**
 * Check if quiz questions already generated for this materi
 */
export async function questionsExist(materiId: number): Promise<boolean> {
  const query = `
    SELECT COUNT(*) as count
    FROM quiz_questions
    WHERE materi_id = ${materiId}
  `;

  // const result = await pool.query(query);
  // return result.rows[0].count > 0;
  return false;
}

// ============================================
// 4. SUBMIT USER ANSWER
// ============================================

/**
 * Save user's answer and check if correct
 */
export async function submitUserAnswer(
  userId: string, // UUID
  questionId: number,
  selectedOptionId: number
) {
  // Check if answer is correct
  const checkQuery = `
    SELECT is_correct
    FROM quiz_options
    WHERE id = ${selectedOptionId}
  `;
  // const checkResult = await pool.query(checkQuery);
  // const isCorrect = checkResult.rows[0].is_correct;

  // Save answer
  const saveQuery = `
    INSERT INTO user_quiz_answers (user_id, question_id, selected_option_id, is_correct)
    VALUES (${userId}, ${questionId}, ${selectedOptionId}, isCorrect)
    ON CONFLICT (user_id, question_id)
    DO UPDATE SET
      selected_option_id = ${selectedOptionId},
      is_correct = isCorrect,
      answered_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  // await pool.query(saveQuery);

  return { isCorrect: true }; // Mock
}

// ============================================
// 5. UPDATE USER PROGRESS
// ============================================

/**
 * Update user's quiz progress for a materi
 */
export async function updateUserProgress(
  userId: string, // UUID
  materiId: number,
  isCorrect: boolean
) {
  // Check if progress exists
  const checkQuery = `
    SELECT questions_answered, correct_answers, xp_earned
    FROM user_materi_quiz_progress
    WHERE user_id = ${userId} AND materi_id = ${materiId}
  `;
  // const checkResult = await pool.query(checkQuery);

  // if (checkResult.rows.length === 0) {
    // Create new progress
    const insertQuery = `
      INSERT INTO user_materi_quiz_progress
        (user_id, materi_id, questions_answered, correct_answers, xp_earned, total_questions)
      VALUES
        (${userId}, ${materiId}, 1, ${isCorrect ? 1 : 0}, ${isCorrect ? 5 : 0}, 3)
    `;
    // await pool.query(insertQuery);
  // } else {
    // Update existing progress
    // const current = checkResult.rows[0];
    const newAnswered = 1; // current.questions_answered + 1;
    const newCorrect = 1; // current.correct_answers + (isCorrect ? 1 : 0);
    const newXP = 5; // current.xp_earned + (isCorrect ? 5 : 0);
    const isCompleted = newAnswered >= 3;

    const updateQuery = `
      UPDATE user_materi_quiz_progress
      SET
        questions_answered = ${newAnswered},
        correct_answers = ${newCorrect},
        xp_earned = ${newXP},
        is_completed = ${isCompleted},
        completed_at = CASE WHEN ${isCompleted} THEN CURRENT_TIMESTAMP ELSE completed_at END,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId} AND materi_id = ${materiId}
    `;
    // await pool.query(updateQuery);
  // }
}

// ============================================
// 6. GET USER PROGRESS
// ============================================

/**
 * Get user's progress for a specific materi
 */
export async function getUserProgress(userId: string, materiId: number) { // UUID
  const query = `
    SELECT *
    FROM user_materi_quiz_progress
    WHERE user_id = ${userId} AND materi_id = ${materiId}
  `;

  // const result = await pool.query(query);
  // return result.rows[0] || null;
  return null;
}

// ============================================
// 7. GET CORRECT ANSWER FOR QUESTION
// ============================================

/**
 * Get the correct option for a question
 */
export async function getCorrectOption(questionId: number) {
  const query = `
    SELECT id, option_letter, option_text
    FROM quiz_options
    WHERE question_id = ${questionId} AND is_correct = true
    LIMIT 1
  `;

  // const result = await pool.query(query);
  // return result.rows[0];
  return { id: 1, option_letter: 'A', option_text: 'Mock answer' };
}

// ============================================
// 8. GET USER'S QUIZ HISTORY
// ============================================

/**
 * Get all quiz attempts by user
 */
export async function getUserQuizHistory(userId: string) { // UUID
  const query = `
    SELECT
      p.*,
      m.title as materi_title,
      t.name as topik_name
    FROM user_materi_quiz_progress p
    JOIN materi m ON p.materi_id = m.id
    JOIN topik t ON m.topik_id = t.id
    WHERE p.user_id = ${userId}
    ORDER BY p.completed_at DESC NULLS LAST, p.updated_at DESC
  `;

  // const result = await pool.query(query);
  // return result.rows;
  return [];
}

// ============================================
// 9. GET LEADERBOARD
// ============================================

/**
 * Get top users by total XP from quizzes
 */
export async function getQuizLeaderboard(limit: number = 10) {
  const query = `
    SELECT
      u.id,
      u.username,
      u.name,
      SUM(p.xp_earned) as total_xp,
      COUNT(CASE WHEN p.is_completed THEN 1 END) as completed_quizzes,
      AVG(CAST(p.correct_answers AS FLOAT) / p.total_questions * 100) as avg_score
    FROM users u
    JOIN user_materi_quiz_progress p ON u.id = p.user_id
    GROUP BY u.id, u.username, u.name
    ORDER BY total_xp DESC
    LIMIT ${limit}
  `;

  // const result = await pool.query(query);
  // return result.rows;
  return [];
}

// ============================================
// EXAMPLE: Using Prisma (Alternative)
// ============================================

/**
 * Example dengan Prisma ORM
 */
export const prismaExamples = {
  // Save questions
  async saveQuestions(materiId: number, topikId: number, questions: any[]) {
    // const result = await prisma.$transaction(
    //   questions.map((q) =>
    //     prisma.quizQuestion.create({
    //       data: {
    //         materiId,
    //         topikId,
    //         questionNumber: q.questionNumber,
    //         questionText: q.questionText,
    //         options: {
    //           create: q.options.map((opt: any) => ({
    //             optionLetter: opt.letter,
    //             optionText: opt.text,
    //             isCorrect: opt.isCorrect,
    //           })),
    //         },
    //       },
    //     })
    //   )
    // );
    // return result;
  },

  // Get questions
  async getQuestions(materiId: number) {
    // return await prisma.quizQuestion.findMany({
    //   where: { materiId },
    //   include: {
    //     options: {
    //       select: {
    //         id: true,
    //         optionLetter: true,
    //         optionText: true,
    //         // Don't include isCorrect for client
    //       },
    //       orderBy: { optionLetter: 'asc' },
    //     },
    //   },
    //   orderBy: { questionNumber: 'asc' },
    // });
  },

  // Submit answer
  async submitAnswer(userId: number, questionId: number, selectedOptionId: number) {
    // const option = await prisma.quizOption.findUnique({
    //   where: { id: selectedOptionId },
    // });
    //
    // const answer = await prisma.userQuizAnswer.upsert({
    //   where: {
    //     userId_questionId: {
    //       userId,
    //       questionId,
    //     },
    //   },
    //   update: {
    //     selectedOptionId,
    //     isCorrect: option.isCorrect,
    //   },
    //   create: {
    //     userId,
    //     questionId,
    //     selectedOptionId,
    //     isCorrect: option.isCorrect,
    //   },
    // });
    //
    // return answer;
  },
};