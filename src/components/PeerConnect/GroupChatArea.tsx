import { useRef, useEffect } from 'react'
import { ChatRoom, ChatMessageData, UserProfile, MaterialLinkData } from './types'
import ChatMessage from './ChatMessage'

interface GroupChatAreaProps {
  chatRoom: ChatRoom
  messages: ChatMessageData[]
  groupMembers: UserProfile[]
  currentUserId: string
  currentUserRole?: string
  newMessage: string
  onNewMessageChange: (message: string) => void
  onSendMessage: () => void
  onSendMaterialLink: (material: MaterialLinkData, message?: string) => void
  onStartPrivateChat: (member: UserProfile) => void
  onOpenMaterialShare: () => void
}

export default function GroupChatArea({
  chatRoom,
  messages,
  groupMembers,
  currentUserId,
  currentUserRole,
  newMessage,
  onNewMessageChange,
  onSendMessage,
  onSendMaterialLink,
  onStartPrivateChat,
  onOpenMaterialShare
}: GroupChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSendMessage()
    }
  }

  return (
    <>
      {/* Chat Header */}
      <div className="bg-green-300 border-b-2 border-black px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-black">💬 {chatRoom.name}</h2>
          <p className="text-sm text-gray-800 font-semibold">{groupMembers.length} members</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center mt-8">
            <div className="inline-block bg-yellow-300 px-6 py-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-black font-bold">Belum ada pesan. Mulai percakapan! 💬</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isOwnMessage={msg.user_id === currentUserId}
              groupMembers={groupMembers}
              onStartPrivateChat={onStartPrivateChat}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t-2 border-black p-4">
        <div className="flex gap-3">
          {/* Share Material Button - Only for mentors */}
          {currentUserRole === 'mentor' && (
            <button
              onClick={onOpenMaterialShare}
              className="p-3 bg-purple-400 text-black border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              title="Share learning material"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          )}

          <input
            type="text"
            value={newMessage}
            onChange={(e) => onNewMessageChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border-2 border-black rounded-xl focus:ring-2 focus:ring-black bg-white text-black font-medium"
          />
          <button
            onClick={onSendMessage}
            disabled={!newMessage.trim()}
            className="px-6 py-3 bg-teal-400 text-black rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed transition-all font-black"
          >
            Send
          </button>
        </div>
      </div>
    </>
  )
}

