'use client'

import { useEffect, useState } from 'react'
import type { ActivityStats } from '../services/activityTracker'

interface AnalyticsDashboardProps {
  stats: ActivityStats | null
  loading: boolean
}

export default function AnalyticsDashboard({ stats, loading }: AnalyticsDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'all'>('week')

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Belum ada data aktivitas
        </div>
      </div>
    )
  }

  const completionRate = stats.totalMaterialsOpened > 0
    ? Math.round((stats.materialsCompleted / stats.totalMaterialsOpened) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard Analitik
        </h2>
        <select
          value={selectedTimeRange}
          onChange={(e) => setSelectedTimeRange(e.target.value as any)}
          className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
        >
          <option value="week">7 Hari Terakhir</option>
          <option value="month">30 Hari Terakhir</option>
          <option value="all">Semua Waktu</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Materials */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.totalMaterialsOpened}</div>
          <div className="text-blue-100 text-sm">Materi Dibuka</div>
        </div>

        {/* Total Time */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.totalTimeSpent}</div>
          <div className="text-purple-100 text-sm">Menit Belajar</div>
        </div>

        {/* Completed */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.materialsCompleted}</div>
          <div className="text-green-100 text-sm">Materi Selesai</div>
        </div>

        {/* Average Session */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.averageSessionTime}</div>
          <div className="text-orange-100 text-sm">Rata-rata Menit/Sesi</div>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Tingkat Penyelesaian
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {completionRate}%
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {stats.materialsCompleted} dari {stats.totalMaterialsOpened} materi telah diselesaikan
        </p>
      </div>

      {/* Most Viewed Materials */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Materi Paling Sering Dibuka
        </h3>
        {stats.mostViewedMaterials.length > 0 ? (
          <div className="space-y-3">
            {stats.mostViewedMaterials.map((material, index) => (
              <div
                key={material.material_id}
                className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
              >
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {material.title}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Dibuka {material.count}x
                  </div>
                </div>
                <div className="text-indigo-600 dark:text-indigo-400 font-semibold">
                  {material.count}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            Belum ada data
          </div>
        )}
      </div>

      {/* Recent Activities */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Aktivitas Terakhir
        </h3>
        {stats.recentActivities.length > 0 ? (
          <div className="space-y-3">
            {stats.recentActivities.slice(0, 5).map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-3 border-l-4 border-indigo-600 bg-gray-50 dark:bg-gray-700/50 rounded-r-xl"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {activity.material_title}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {activity.topic_title} • {Math.round(activity.duration_seconds / 60)} menit
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {new Date(activity.opened_at).toLocaleString('id-ID')}
                  </div>
                </div>
                {activity.completed && (
                  <div className="text-green-600 dark:text-green-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            Belum ada aktivitas
          </div>
        )}
      </div>
    </div>
  )
}
