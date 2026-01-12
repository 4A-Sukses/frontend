import { ChatRoom, Interest, UserProfile } from './types'

interface GroupMembersListProps {
  chatRoom: ChatRoom | null
  selectedInterest: Interest | null
  groupMembers: UserProfile[]
  currentUserId: string
  onStartPrivateChat: (member: UserProfile) => void
}

export default function GroupMembersList({
  chatRoom,
  selectedInterest,
  groupMembers,
  currentUserId,
  onStartPrivateChat
}: GroupMembersListProps) {
  return (
    <div>
      {/* Community Header dengan Icon */}
      {chatRoom && (
        <div className="p-4 border-b-2 border-black bg-emerald-100">
          <div className="flex items-center gap-3 mb-2">
            {/* Icon Community */}
            {(chatRoom.icon || selectedInterest?.icon) && (
              <img 
                src={chatRoom.icon || selectedInterest?.icon || ''} 
                alt={chatRoom.name}
                className="w-12 h-12 rounded-full border-2 border-black object-cover"
                onError={(e) => {
                  // Fallback jika gambar tidak ada
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%2310b981" width="48" height="48" rx="24"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="24"%3E💬%3C/text%3E%3C/svg%3E'
                }}
              />
            )}
            <div>
              <h3 className="font-black text-black text-lg">{chatRoom.name}</h3>
              <p className="text-sm text-gray-700 font-semibold">
                {selectedInterest?.name || 'Community'}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-600">
            {groupMembers.length} members online
          </p>
        </div>
      )}

      {/* Members List */}
      <div className="p-2">
        <h4 className="px-2 py-1 text-xs font-black text-gray-500 uppercase">Members</h4>
        {groupMembers.map((member) => (
          <button
            key={member.user_id}
            onClick={() => onStartPrivateChat(member)}
            disabled={member.user_id === currentUserId}
            className={`w-full p-3 flex items-center gap-3 rounded-lg transition-all ${
              member.user_id === currentUserId 
                ? 'bg-gray-100 cursor-default' 
                : 'hover:bg-gray-100 hover:border-2 hover:border-black'
            }`}
          >
            {member.avatar_url ? (
              <img 
                src={member.avatar_url} 
                alt={member.nama}
                className="w-10 h-10 rounded-full object-cover border-2 border-black"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-500 border-2 border-black flex items-center justify-center text-white font-black">
                {member.nama?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex-1 text-left">
              <p className="font-bold text-black">
                {member.nama}
                {member.user_id === currentUserId && ' (You)'}
              </p>
              {member.role && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 font-semibold">
                  {member.role}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}