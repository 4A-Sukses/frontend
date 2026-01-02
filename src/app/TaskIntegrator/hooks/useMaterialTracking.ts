import { useEffect, useRef } from 'react'
import { activityTracker } from '../services/activityTracker'

interface UseMaterialTrackingOptions {
  materialId: string
  materialTitle: string
  topicTitle: string
  enabled?: boolean
}

export function useMaterialTracking(options: UseMaterialTrackingOptions) {
  const { materialId, materialTitle, topicTitle, enabled = true } = options
  const sessionStartedRef = useRef(false)

  useEffect(() => {
    if (!enabled || !materialId || !materialTitle || !topicTitle) {
      return
    }

    // Start tracking session
    if (!sessionStartedRef.current) {
      activityTracker.startSession(materialId, materialTitle, topicTitle)
      sessionStartedRef.current = true
    }

    // Cleanup: end session when component unmounts or user leaves
    return () => {
      if (sessionStartedRef.current) {
        activityTracker.endSession(false)
        sessionStartedRef.current = false
      }
    }
  }, [materialId, materialTitle, topicTitle, enabled])

  // Handle page visibility (user switches tab)
  useEffect(() => {
    if (!enabled) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched away, pause tracking
        if (sessionStartedRef.current) {
          activityTracker.endSession(false)
          sessionStartedRef.current = false
        }
      } else {
        // User came back, resume tracking
        if (!sessionStartedRef.current && materialId && materialTitle && topicTitle) {
          activityTracker.startSession(materialId, materialTitle, topicTitle)
          sessionStartedRef.current = true
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [materialId, materialTitle, topicTitle, enabled])

  /**
   * Manually mark the material as completed
   */
  const markAsCompleted = async () => {
    if (sessionStartedRef.current) {
      await activityTracker.endSession(true)
      sessionStartedRef.current = false
    }
  }

  /**
   * Manually end the session without marking as completed
   */
  const endSession = async () => {
    if (sessionStartedRef.current) {
      await activityTracker.endSession(false)
      sessionStartedRef.current = false
    }
  }

  /**
   * Restart the tracking session
   */
  const restartSession = async () => {
    if (materialId && materialTitle && topicTitle) {
      await activityTracker.startSession(materialId, materialTitle, topicTitle)
      sessionStartedRef.current = true
    }
  }

  return {
    markAsCompleted,
    endSession,
    restartSession,
    isTracking: sessionStartedRef.current
  }
}
