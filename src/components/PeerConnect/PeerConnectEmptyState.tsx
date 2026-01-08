import type { ChatMode } from "./types"

interface PeerConnectEmptyStateProps {
  chatMode: ChatMode
}

export default function PeerConnectEmptyState({ chatMode }: PeerConnectEmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center bg-white p-8 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="w-24 h-24 mx-auto mb-4 bg-yellow-300 rounded-full border-2 border-black flex items-center justify-center">
          <span className="text-5xl">💬</span>
        </div>
        <h3 className="text-xl font-black text-black mb-2">Select a chat to start messaging</h3>
        <p className="text-gray-700 font-semibold">Choose from your {chatMode === 'group' ? 'group members' : 'private conversations'}</p>
      </div>
    </div>
  )
}

