'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import QuizGame from './components/QuizGame';
import MaterialSelector from './components/MaterialSelector';

interface Material {
  id: number;
  title: string;
  topikId: number;
  topikName: string;
  description?: string;
  questionsCount: number;
  isCompleted?: boolean;
  userScore?: number;
  userXP?: number;
}

export default function GamesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // Get authenticated user
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        setUserId(user.id);
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleQuizComplete = (score: number, totalXP: number) => {
    console.log('Quiz completed!', { score, totalXP });

    // Show material selector again after a delay
    setTimeout(() => {
      setSelectedMaterial(null);
    }, 3000);
  };

  const handleBackToMaterials = () => {
    setSelectedMaterial(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8 font-semibold transition"
        >
          <span>←</span> Back to Home
        </Link>

        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Quiz Game
          </h1>
          <p className="text-gray-600 text-lg">
            Test your knowledge and earn XP! 🎮
          </p>
        </div>

        {selectedMaterial ? (
          <div>
            <button
              onClick={handleBackToMaterials}
              className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium transition"
            >
              <span>←</span> Back to Materials
            </button>
            <QuizGame
              materiId={selectedMaterial.id}
              materiTitle={selectedMaterial.title}
              userId={userId}
              onComplete={handleQuizComplete}
            />
          </div>
        ) : (
          <MaterialSelector
            userId={userId}
            onSelectMaterial={setSelectedMaterial}
          />
        )}
      </div>
    </div>
  );
}