'use client';

import { useState } from 'react';

interface GenerateQuizPromptProps {
  materiId: number;
  materiTitle: string;
  onGenerated: () => void;
}

export default function GenerateQuizPrompt({
  materiId,
  materiTitle,
  onGenerated,
}: GenerateQuizPromptProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // First, get material details
      const materialResponse = await fetch(`/api/materials?materialId=${materiId}`);
      const materialData = await materialResponse.json();

      if (!materialData.success || !materialData.materials?.length) {
        throw new Error('Could not fetch material data');
      }

      const material = materialData.materials[0];

      // Generate questions
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materiId: materiId,
          topikId: material.topicId || material.topic_id,
          materiTitle: material.title,
          materiContent: material.content || 'No content available'
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to generate questions');
      }

      // Success!
      onGenerated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-md">
        <div className="text-yellow-500 text-6xl mb-6">📝</div>

        <h3 className="text-2xl font-bold text-gray-800 mb-3">
          Quiz Not Generated Yet
        </h3>

        <p className="text-gray-600 mb-6">
          This material doesnt have quiz questions yet.
          <br />
          <span className="font-semibold">{materiTitle}</span>
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2 justify-center">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Generating with AI...
            </span>
          ) : (
            '✨ Generate Quiz Questions with AI'
          )}
        </button>

        <p className="text-xs text-gray-500 mt-4">
          AI will generate 3 multiple choice questions based on the material content
        </p>
      </div>
    </div>
  );
}