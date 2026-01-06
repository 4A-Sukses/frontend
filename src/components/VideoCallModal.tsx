'use client'

import { useEffect, useRef, useState } from 'react'

interface VideoCallModalProps {
  isOpen: boolean
  onClose: () => void
  roomName: string
  displayName: string
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any
  }
}

export default function VideoCallModal({ isOpen, onClose, roomName, displayName }: VideoCallModalProps) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null)
  const jitsiApiRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    // Load Jitsi Meet External API script
    const loadJitsiScript = () => {
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve(true)
          return
        }

        const script = document.createElement('script')
        script.src = 'https://meet.jit.si/external_api.js'
        script.async = true
        script.onload = () => resolve(true)
        script.onerror = () => reject(new Error('Failed to load Jitsi Meet script'))
        document.body.appendChild(script)
      })
    }

    const initJitsi = async () => {
      try {
        setIsLoading(true)
        setLoadError(null)

        await loadJitsiScript()

        if (jitsiContainerRef.current && window.JitsiMeetExternalAPI) {
          // Clear previous instance if exists
          if (jitsiApiRef.current) {
            jitsiApiRef.current.dispose()
          }

          const domain = 'meet.jit.si'
          const options = {
            roomName: roomName,
            width: '100%',
            height: '100%',
            parentNode: jitsiContainerRef.current,
            configOverwrite: {
              startWithAudioMuted: false,
              startWithVideoMuted: false,
              prejoinPageEnabled: false,
              disableInviteFunctions: true,
            },
            interfaceConfigOverwrite: {
              TOOLBAR_BUTTONS: [
                'microphone',
                'camera',
                'closedcaptions',
                'desktop',
                'fullscreen',
                'fodeviceselection',
                'hangup',
                'chat',
                'settings',
                'raisehand',
                'videoquality',
                'filmstrip',
                'stats',
                'tileview',
              ],
              SHOW_JITSI_WATERMARK: false,
              SHOW_WATERMARK_FOR_GUESTS: false,
              SHOW_BRAND_WATERMARK: false,
            },
            userInfo: {
              displayName: displayName,
            },
          }

          jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options)

          // Listen for when user hangs up
          jitsiApiRef.current.addEventListener('readyToClose', () => {
            onClose()
          })

          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error initializing Jitsi:', error)
        setLoadError('Failed to load video call. Please try again.')
        setIsLoading(false)
      }
    }

    initJitsi()

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose()
        jitsiApiRef.current = null
      }
    }
  }, [isOpen, roomName, displayName, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative w-full h-full max-w-7xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/50 to-transparent">
          <h2 className="text-lg font-semibold text-white">Video Call</h2>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            End Call
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-lg">Connecting to video call...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center px-6">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <p className="text-white text-lg mb-4">{loadError}</p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Jitsi Meet Container */}
        <div ref={jitsiContainerRef} className="w-full h-full" />
      </div>
    </div>
  )
}
