import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { supabase } from '@/lib/supabase';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface QuizQuestion {
  questionNumber: number;
  questionText: string;
  options: {
    letter: 'A' | 'B' | 'C' | 'D';
    text: string;
    isCorrect: boolean;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const { materiId, topikId, materiTitle, materiContent } = await request.json();

    console.log('=== GENERATE QUIZ REQUEST ===');
    console.log('materiId:', materiId);
    console.log('topikId:', topikId);
    console.log('materiTitle:', materiTitle);
    console.log('materiContent length:', materiContent?.length);

    if (!materiId || !topikId || !materiTitle || !materiContent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check GROQ_API_KEY
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not set!');
      return NextResponse.json(
        { error: 'AI service not configured. Please set GROQ_API_KEY in environment variables.' },
        { status: 500 }
      );
    }

    // Check if questions already exist for this materi
    let existingQuestions, checkError;
    try {
      const result = await supabase
        .from('quiz_questions')
        .select('id')
        .eq('materials_id', materiId)
        .limit(1);
      
      existingQuestions = result.data;
      checkError = result.error;
    } catch (e) {
      console.error('Error accessing quiz_questions table:', e);
      return NextResponse.json({
        success: false,
        error: 'Quiz questions table not found',
        message: 'Please ensure the database tables are created'
      }, { status: 500 });
    }

    if (checkError) {
      console.error('Error checking existing questions:', checkError);
      throw new Error(`Database error: ${checkError.message}`);
    }

    if (existingQuestions && existingQuestions.length > 0) {
      console.log('Questions already exist for material:', materiId);
      return NextResponse.json({
        success: true,
        message: 'Questions already exist',
        note: 'Using existing questions'
      });
    }

    const prompt = `Kamu adalah expert pembuat soal quiz edukasi. Buatkan 3 soal pilihan ganda berkualitas tinggi berdasarkan materi berikut:

Judul Materi: ${materiTitle}
Konten Materi: ${materiContent}

INSTRUKSI:
1. Buat 3 soal pilihan ganda yang menguji pemahaman konsep penting dari materi
2. Setiap soal HARUS memiliki TEPAT 4 pilihan jawaban (A, B, C, D)
3. Hanya 1 jawaban yang benar per soal
4. Soal harus progresif: soal 1 (mudah), soal 2 (sedang), soal 3 (sulit)
5. Hindari soal yang terlalu literal/copy paste dari materi
6. Pilihan jawaban yang salah harus masuk akal (plausible distractors)

FORMAT OUTPUT (JSON):
{
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "Teks soal pertama?",
      "options": [
        {"letter": "A", "text": "Pilihan A", "isCorrect": false},
        {"letter": "B", "text": "Pilihan B", "isCorrect": true},
        {"letter": "C", "text": "Pilihan C", "isCorrect": false},
        {"letter": "D", "text": "Pilihan D", "isCorrect": false}
      ]
    }
  ]
}

Berikan HANYA JSON tanpa teks tambahan.`;

    console.log('Calling Groq API...');

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a quiz generator that outputs valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    });

    console.log('Groq API response received');

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      console.error('No content from Groq API');
      throw new Error('No content received from AI');
    }

    console.log('Parsing AI response...');
    const aiResponse = JSON.parse(content);
    const questions: QuizQuestion[] = aiResponse.questions;

    console.log('AI generated questions:', questions?.length);

    // Validate response
    if (!questions || questions.length !== 3) {
      throw new Error('AI did not generate exactly 3 questions');
    }

    for (const q of questions) {
      if (q.options.length !== 4) {
        throw new Error(`Question ${q.questionNumber} does not have exactly 4 options`);
      }
      const correctCount = q.options.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        throw new Error(`Question ${q.questionNumber} does not have exactly 1 correct answer`);
      }
    }

    // Save to database
    console.log('Saving to database...');
    for (const q of questions) {
      console.log(`Inserting question ${q.questionNumber}...`);

      // Insert question
      let questionData, questionError;
      try {
        const result = await supabase
          .from('quiz_questions')
          .insert({
            materials_id: materiId,
            topics_id: topikId,
            question_number: q.questionNumber,
            question_text: q.questionText
          })
          .select('id')
          .single();
        
        questionData = result.data;
        questionError = result.error;
      } catch (e) {
        console.error(`Error inserting question ${q.questionNumber}:`, e);
        return NextResponse.json({
          success: false,
          error: 'Failed to insert question',
          details: 'quiz_questions table might not exist'
        }, { status: 500 });
      }

      if (questionError || !questionData) {
        console.error(`Failed to insert question ${q.questionNumber}:`, questionError);
        throw new Error(`Failed to insert question ${q.questionNumber}: ${questionError?.message}`);
      }

      console.log(`Question ${q.questionNumber} inserted with ID:`, questionData.id);

      // Insert options
      const optionsToInsert = q.options.map(opt => ({
        question_id: questionData.id,
        option_letter: opt.letter,
        option_text: opt.text,
        is_correct: opt.isCorrect
      }));

      let optionsError;
      try {
        const result = await supabase
          .from('quiz_options')
          .insert(optionsToInsert);
        
        optionsError = result.error;
      } catch (e) {
        console.error(`Error inserting options for question ${q.questionNumber}:`, e);
        return NextResponse.json({
          success: false,
          error: 'Failed to insert options',
          details: 'quiz_options table might not exist'
        }, { status: 500 });
      }

      if (optionsError) {
        console.error(`Failed to insert options for question ${q.questionNumber}:`, optionsError);
        throw new Error(`Failed to insert options for question ${q.questionNumber}: ${optionsError.message}`);
      }

      console.log(`Options for question ${q.questionNumber} inserted successfully`);
    }

    console.log('✅ All questions saved successfully!');

    return NextResponse.json({
      success: true,
      materiId,
      topikId,
      questions,
      message: 'Quiz questions generated and saved to database'
    });
  } catch (error) {
    console.error('❌ Error generating quiz:', error);

    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate quiz questions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}