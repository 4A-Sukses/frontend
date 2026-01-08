interface LoadingScreenProps {
  categorizationStep: number
  detectedCategory: string
  userInterest: string
}

export default function LoadingScreen({
  categorizationStep,
  detectedCategory,
  userInterest
}: LoadingScreenProps) {
  const getStepMessage = () => {
    switch (categorizationStep) {
      case 1:
        return { title: 'Menganalisis Interest...', desc: `Membaca: "${userInterest}"` }
      case 2:
        return { title: 'Mengirim ke AI...', desc: 'Memproses dengan teknologi AI' }
      case 3:
        return { title: 'Kategori Ditemukan!', desc: `Anda cocok dengan: ${detectedCategory}` }
      case 4:
        return { title: 'Bergabung ke Community...', desc: `Masuk ke ${detectedCategory} Community` }
      case 5:
        return { title: 'Berhasil!', desc: 'Mengarahkan ke chat room...' }
      default:
        return { title: 'Memuat Chat Room...', desc: 'Mohon tunggu sebentar' }
    }
  }

  const { title, desc } = getStepMessage()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 to-blue-200 p-4">
      <div className="bg-white rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 max-w-lg mx-auto">
        {/* Icon Animation */}
        <div className="flex justify-center mb-6">
          {categorizationStep === 3 ? (
            <div className="w-20 h-20 bg-green-400 rounded-full border-2 border-black flex items-center justify-center animate-bounce shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-20 h-20 bg-yellow-300 rounded-full border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black"></div>
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-black mb-2 text-center">
          {title}
        </h2>

        {/* Description */}
        <p className="text-gray-700 font-semibold mb-6 text-center">
          {desc}
        </p>

        {/* Progress Steps */}
        <div className="space-y-3 mb-6">
          {[
            { step: 1, label: 'Analisis Interest', icon: '🔍', color: 'bg-pink-400' },
            { step: 2, label: 'AI Processing', icon: '🤖', color: 'bg-teal-400' },
            { step: 3, label: 'Kategori Terdeteksi', icon: '✨', color: 'bg-yellow-400' },
            { step: 4, label: 'Join Community', icon: '👥', color: 'bg-green-400' }
          ].map(({ step, label, icon, color }) => (
            <div key={step} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg border-2 border-black flex items-center justify-center text-sm font-black ${categorizationStep >= step
                  ? `${color} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`
                  : 'bg-gray-100 text-gray-400'
                }`}>
                {categorizationStep > step ? '✓' : icon}
              </div>
              <div className="flex-1">
                <div className={`text-sm font-bold ${categorizationStep >= step
                    ? 'text-black'
                    : 'text-gray-400'
                  }`}>
                  {label}
                </div>
              </div>
              {categorizationStep === step && (
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Interest Box */}
        <div className="p-4 bg-blue-100 rounded-xl border-2 border-black">
          <p className="text-xs text-gray-700 font-bold mb-1">Your Interest:</p>
          <p className="text-sm font-black text-black">
            {userInterest}
          </p>
          {detectedCategory && (
            <>
              <div className="my-2 border-t-2 border-black"></div>
              <p className="text-xs text-gray-700 font-bold mb-1">AI Category:</p>
              <p className="text-sm font-black text-teal-600">
                {detectedCategory}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

