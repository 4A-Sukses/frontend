import Link from 'next/link'

interface MaterialLinkData {
  id: number
  title: string
  slug: string
  material_type: string
  topic?: string
}

interface MaterialLinkMessageProps {
  material: MaterialLinkData
  isOwnMessage: boolean
}

export default function MaterialLinkMessage({
  material,
  isOwnMessage
}: MaterialLinkMessageProps) {
  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'pdf':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )
      case 'article':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'pdf':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'article':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  // Encode material ID to base64 for ref parameter
  const encodedRef = typeof window !== 'undefined' ? btoa(material.id.toString()) : ''

  return (
    <Link
      href={`/material/detail?ref=${encodedRef}`}
      className={`block max-w-sm rounded-lg border-2 transition-all hover:shadow-lg ${
        isOwnMessage
          ? 'bg-blue-50 border-blue-200 hover:border-blue-300 dark:bg-blue-900/20 dark:border-blue-700 dark:hover:border-blue-600'
          : 'bg-white border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600'
      }`}
    >
      <div className="p-4">
        {/* Header with icon and type badge */}
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg ${
            isOwnMessage
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300'
              : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
          }`}>
            {getTypeIcon(material.material_type)}
          </div>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(material.material_type)}`}>
            {material.material_type.toUpperCase()}
          </span>
        </div>

        {/* Material Title */}
        <h4 className={`font-semibold text-sm mb-2 line-clamp-2 ${
          isOwnMessage
            ? 'text-blue-900 dark:text-blue-100'
            : 'text-gray-900 dark:text-white'
        }`}>
          {material.title}
        </h4>

        {/* Topic if available */}
        {material.topic && (
          <p className={`text-xs mb-3 ${
            isOwnMessage
              ? 'text-blue-700 dark:text-blue-300'
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            📚 {material.topic}
          </p>
        )}

        {/* View Material Button */}
        <div className={`flex items-center gap-2 text-xs font-medium ${
          isOwnMessage
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-indigo-600 dark:text-indigo-400'
        }`}>
          <span>View Material</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  )
}
