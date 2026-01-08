import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');
    const userId = searchParams.get('userId');
    const materialId = searchParams.get('materialId');

    // Build query
    let query = supabase
      .from('materials')
      .select(`
        id,
        topic_id,
        title,
        content,
        material_type,
        status,
        topics (
          id,
          title
        )
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    // Filter by material ID if provided (for single material fetch)
    if (materialId) {
      query = query.eq('id', materialId);
    }

    // Filter by topic if provided
    if (topicId) {
      query = query.eq('topic_id', topicId);
    }

    const { data: materials, error: materialsError } = await query;

    if (materialsError) {
      throw new Error(`Database error: ${materialsError.message}`);
    }

    if (!materials || materials.length === 0) {
      return NextResponse.json({
        success: true,
        materials: [],
        message: 'No materials found'
      });
    }

    // Check quiz questions count and user progress for each material
    const materialsWithQuizInfo = await Promise.all(
      materials.map(async (material: any) => {
        let questionsCount = 0;
        let userProgress = null;
        
        try {
          // Count quiz questions (with error handling)
          const { count, error: questionsError } = await supabase
            .from('quiz_questions')
            .select('*', { count: 'exact', head: true })
            .eq('materials_id', material.id);
          
          if (!questionsError) {
            questionsCount = count || 0;
          }
        } catch (e) {
          console.log('quiz_questions table might not exist yet');
        }

        // Get user progress if userId provided (with error handling)
        if (userId) {
          try {
            const { data: progress, error: progressError } = await supabase
              .from('user_materials_quiz_progress')
              .select('*')
              .eq('user_id', userId)
              .eq('materials_id', material.id)
              .maybeSingle();

            if (!progressError && progress) {
              userProgress = progress;
            }
          } catch (e) {
            console.log('user_materials_quiz_progress table might not exist yet');
          }
        }

        return {
          id: material.id,
          title: material.title,
          topicId: material.topic_id,
          topicName: material.topics?.title || 'Unknown Topic',
          description: material.content?.substring(0, 150) + '...' || '',
          questionsCount: questionsCount,
          isCompleted: userProgress?.is_completed || false,
          userScore: userProgress?.correct_answers || 0,
          userXP: userProgress?.xp_earned || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      materials: materialsWithQuizInfo,
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        error: 'Failed to fetch materials',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}