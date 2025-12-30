'use client';

import { useState, useEffect } from 'react';
import { Topic } from '@/types/database';
import { supabase } from '@/lib/supabase';

interface TopicImportModalProps {
  onImport: (topicId: number) => void;
  onBack: () => void;
  userId?: string;
}

export default function TopicImportModal({ onImport, onBack, userId }: TopicImportModalProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [converting, setConverting] = useState<number | null>(null);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTopics(data || []);
    } catch (error) {
      console.error('Failed to load topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (topicId: number) => {
    setConverting(topicId);
    try {
      await onImport(topicId);
    } finally {
      setConverting(null);
    }
  };

  const filteredTopics = topics.filter(topic =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={onBack}
              className="text-slate-400 hover:text-white mb-4 flex items-center gap-2 transition-colors"
            >
              ← Kembali
            </button>
            <h1 className="text-3xl font-bold text-white mb-2">
              🤖 Import dari Multi-Source Knowledge
            </h1>
            <p className="text-slate-400">
              Pilih topik untuk dikonversi otomatis oleh AI menjadi learning path workflow
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Cari topik..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white
              placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Topics Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent" />
              <p className="text-slate-400">Loading topics...</p>
            </div>
          </div>
        ) : filteredTopics.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-slate-400 text-lg">
              {searchQuery ? 'Tidak ada topik yang cocok' : 'Belum ada topik tersedia'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTopics.map((topic) => (
              <div
                key={topic.id}
                className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-amber-500
                  transition-all group relative overflow-hidden"
              >
                {/* Background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5
                  opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative">
                  {/* Topic Info */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                      {topic.title}
                    </h3>
                    {topic.description && (
                      <p className="text-slate-400 text-sm line-clamp-3">
                        {topic.description}
                      </p>
                    )}
                  </div>

                  {/* Conversion Status */}
                  {(topic as any).is_converted && (
                    <div className="mb-4 flex items-center gap-2 text-sm">
                      <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded">
                        ✓ Sudah pernah di-convert
                      </span>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={() => handleImport(topic.id)}
                    disabled={converting === topic.id}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500
                      hover:to-orange-500 text-white font-medium px-4 py-3 rounded-lg transition-all
                      disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {converting === topic.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>Converting...</span>
                      </>
                    ) : (topic as any).is_converted ? (
                      <>
                        <span>📥</span>
                        <span>Load dari Database</span>
                      </>
                    ) : (
                      <>
                        <span>✨</span>
                        <span>Convert dengan AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
          <div className="flex gap-4">
            <div className="text-3xl">💡</div>
            <div>
              <h3 className="text-amber-400 font-bold mb-2">Cara Kerja AI Conversion:</h3>
              <ul className="text-slate-300 space-y-1 text-sm">
                <li>• AI akan menganalisis judul dan deskripsi topik</li>
                <li>• Mengekstrak 3-8 pokok bahasan utama sebagai node</li>
                <li>• Menyusun urutan pembelajaran yang logis (dari dasar ke lanjutan)</li>
                <li>• Membuat koneksi antar node berdasarkan prerequisite</li>
                <li>• Hasil conversion disimpan, sehingga bisa langsung dimuat di kemudian hari</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
