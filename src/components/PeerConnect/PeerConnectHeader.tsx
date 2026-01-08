import Link from "next/link"

interface PeerConnectHeaderProps {
  currentUser: {
    nama: string
  }
}

export default function PeerConnectHeader({ currentUser }: PeerConnectHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-teal-300 to-teal-400 border-b-2 border-black px-6 py-4">
      <div className="max-w-full mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all font-bold text-black">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Home
          </Link>
          <h1 className="text-2xl font-black text-black">👥 PeerConnect</h1>
        </div>
        <Link
          href="/profile"
          className="px-4 py-2 bg-yellow-400 text-black rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all font-black"
        >
          Edit Profile
        </Link>
      </div>
    </div>
  )
}
