import { supabase } from '@/lib/supabase'

export interface MaterialActivity {
  id: string
  user_id: string
  material_id: string
  material_title: string
  topic_title: string
  opened_at: string
  duration_seconds: number
  completed: boolean
}

export interface ActivityStats {
  totalMaterialsOpened: number
  totalTimeSpent: number // in minutes
  materialsCompleted: number
  materialsNotStarted: number // NEW: belum dimulai
  averageSessionTime: number // in minutes
  mostViewedMaterials: { material_id: string; title: string; count: number }[]
  recentActivities: MaterialActivity[]
  materialSummary: Array<{
    material_title: string
    topic_title: string
    total_opens: number
    total_duration: number
    is_completed: boolean
  }>
}

class ActivityTrackerService {
  private currentSession: {
    material_id: string
    started_at: Date
  } | null = null

  // Track when user opens a material
  async startSession(materialId: string, materialTitle: string, topicTitle: string) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.error('❌ Auth error:', authError)
        return
      }

      if (!user) {
        console.warn('⚠️ No user logged in, skipping tracking')
        return
      }

      console.log('📝 Starting tracking session for user:', user.id)

      this.currentSession = {
        material_id: materialId,
        started_at: new Date()
      }

      // Record activity in database
      const { data, error } = await supabase
        .from('material_activities')
        .insert({
          user_id: user.id,
          material_id: materialId,
          material_title: materialTitle,
          topic_title: topicTitle,
          opened_at: new Date().toISOString(),
          duration_seconds: 0,
          completed: false
        })
        .select()

      if (error) {
        console.error('❌ Error tracking activity:', error)
        console.error('Error type:', typeof error)
        console.error('Error keys:', Object.keys(error))

        // Try to log all error properties
        try {
          console.error('Full error object:', JSON.stringify(error, null, 2))
        } catch (e) {
          console.error('Could not stringify error')
        }

        // Show user-friendly error message
        if (error.message) {
          console.error('Error message:', error.message)
        }
        if (error.code === '42P01') {
          console.error('❌ Tabel material_activities belum dibuat! Silakan jalankan schema.sql di Supabase')
        } else if (error.code === '42501') {
          console.error('❌ RLS policy error! User mungkin belum login atau policy belum dikonfigurasi')
        } else if (error.code === 'PGRST116') {
          console.error('❌ RLS policy menolak INSERT! Pastikan policy "Users can insert own material activities" sudah dibuat')
        }
      } else {
        console.log('✅ Activity tracked successfully:', {
          materialId,
          materialTitle,
          topicTitle,
          recordId: data?.[0]?.id
        })
      }
    } catch (err) {
      console.error('❌ Unexpected error in startSession:', err)
    }
  }

  // Track when user leaves or completes a material
  async endSession(completed: boolean = false) {
    if (!this.currentSession) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const durationSeconds = Math.floor(
      (new Date().getTime() - this.currentSession.started_at.getTime()) / 1000
    )

    // First, get the latest activity record
    const { data: latestActivity, error: fetchError } = await supabase
      .from('material_activities')
      .select('id')
      .eq('user_id', user.id)
      .eq('material_id', this.currentSession.material_id)
      .order('opened_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError) {
      console.error('Error fetching latest activity:', fetchError)
      console.error('Error details:', {
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
        code: fetchError.code
      })
      this.currentSession = null
      return
    }

    // Then update it
    const { error: updateError } = await supabase
      .from('material_activities')
      .update({
        duration_seconds: durationSeconds,
        completed: completed
      })
      .eq('id', latestActivity.id)

    if (updateError) {
      console.error('Error updating activity:', updateError)
      console.error('Error details:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      })
    } else {
      console.log('✅ Activity updated successfully:', {
        duration: durationSeconds,
        completed: completed
      })
    }

    this.currentSession = null
  }

  // Get user activity statistics
  async getActivityStats(): Promise<ActivityStats | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    try {
      // Get all activities
      const { data: activities, error } = await supabase
        .from('material_activities')
        .select('*')
        .eq('user_id', user.id)
        .order('opened_at', { ascending: false })

      if (error) throw error
      if (!activities) return null

      // Get total count of all materials in database
      const { count: totalMaterialsCount, error: countError } = await supabase
        .from('materials')
        .select('*', { count: 'exact', head: true })

      const totalMaterialsInDB = totalMaterialsCount || 0

      // Calculate statistics
      const totalMaterialsOpened = new Set(activities.map(a => a.material_id)).size
      const materialsNotStarted = totalMaterialsInDB - totalMaterialsOpened
      const totalTimeSpent = activities.reduce((sum, a) => sum + (a.duration_seconds || 0), 0) / 60
      const materialsCompleted = activities.filter(a => a.completed).length
      const averageSessionTime = activities.length > 0
        ? totalTimeSpent / activities.length
        : 0

      // Get most viewed materials
      const materialCounts = activities.reduce((acc, activity) => {
        const key = activity.material_id
        if (!acc[key]) {
          acc[key] = {
            material_id: activity.material_id,
            title: activity.material_title,
            count: 0
          }
        }
        acc[key].count++
        return acc
      }, {} as Record<string, { material_id: string; title: string; count: number }>)

      const mostViewedMaterials = Object.values(materialCounts)
        .sort((a, b) => (b as { count: number }).count - (a as { count: number }).count)
        .slice(0, 5) as { material_id: string; title: string; count: number }[]

      // Get recent activities
      const recentActivities = activities.slice(0, 10)

      // Create material summary with completion status
      const materialSummaryMap = activities.reduce((acc, activity) => {
        const key = activity.material_id
        if (!acc[key]) {
          acc[key] = {
            material_title: activity.material_title,
            topic_title: activity.topic_title,
            total_opens: 0,
            total_duration: 0,
            is_completed: false
          }
        }
        acc[key].total_opens++
        acc[key].total_duration += activity.duration_seconds || 0
        // Mark as completed if ANY session was completed
        if (activity.completed) {
          acc[key].is_completed = true
        }
        return acc
      }, {} as Record<string, { material_title: string; topic_title: string; total_opens: number; total_duration: number; is_completed: boolean }>)

      const materialSummary = Object.values(materialSummaryMap) as Array<{
        material_title: string
        topic_title: string
        total_opens: number
        total_duration: number
        is_completed: boolean
      }>

      return {
        totalMaterialsOpened,
        totalTimeSpent: Math.round(totalTimeSpent),
        materialsCompleted,
        materialsNotStarted: Math.max(0, materialsNotStarted), // Ensure non-negative
        averageSessionTime: Math.round(averageSessionTime),
        mostViewedMaterials,
        recentActivities,
        materialSummary
      }
    } catch (error) {
      console.error('Error fetching activity stats:', error)
      return null
    }
  }

  // Get activities for a specific date range
  async getActivitiesByDateRange(startDate: Date, endDate: Date): Promise<MaterialActivity[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('material_activities')
      .select('*')
      .eq('user_id', user.id)
      .gte('opened_at', startDate.toISOString())
      .lte('opened_at', endDate.toISOString())
      .order('opened_at', { ascending: false })

    if (error) {
      console.error('Error fetching activities by date:', error)
      return []
    }

    return data || []
  }
}

export const activityTracker = new ActivityTrackerService()
