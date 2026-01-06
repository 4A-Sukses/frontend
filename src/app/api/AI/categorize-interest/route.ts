import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

// Daftar kategori interest yang tersedia
const INTEREST_CATEGORIES = [
  'Technology',
  'Sports',
  'Music',
  'Art',
  'Gaming',
  'Travel',
  'Food',
  'Reading',
  'Photography',
  'Movies',
  'Fitness',
  'Business',
  'Science',
  'Fashion',
  'Education'
]

// Fallback: Simple keyword matching jika AI gagal
function fallbackCategorization(input: string): string {
  const lowerInput = input.toLowerCase()

  const keywords: Record<string, string[]> = {
    'Technology': ['tech', 'coding', 'programming', 'software', 'web', 'app', 'computer', 'digital', 'developer', 'code'],
    'Sports': ['sport', 'football', 'basketball', 'soccer', 'tennis', 'gym', 'atletik', 'olahraga'],
    'Music': ['music', 'song', 'singing', 'guitar', 'piano', 'band', 'musik', 'nyanyi'],
    'Art': ['art', 'drawing', 'painting', 'design', 'seni', 'menggambar', 'lukis'],
    'Gaming': ['game', 'gaming', 'esport', 'playstation', 'xbox', 'mobile legend', 'dota', 'valorant'],
    'Travel': ['travel', 'traveling', 'jalan-jalan', 'wisata', 'backpacking', 'liburan'],
    'Food': ['food', 'cooking', 'masak', 'kuliner', 'makanan', 'recipe', 'chef'],
    'Reading': ['reading', 'book', 'novel', 'baca', 'buku', 'literature'],
    'Photography': ['photo', 'camera', 'fotografi', 'photography'],
    'Movies': ['movie', 'film', 'cinema', 'netflix', 'series', 'drama'],
    'Fitness': ['fitness', 'workout', 'health', 'exercise', 'kesehatan', 'senam'],
    'Business': ['business', 'entrepreneur', 'bisnis', 'usaha', 'startup', 'trading'],
    'Science': ['science', 'research', 'sains', 'penelitian', 'physics', 'chemistry'],
    'Fashion': ['fashion', 'style', 'clothing', 'outfit', 'mode', 'pakaian'],
    'Education': ['education', 'teaching', 'learning', 'pendidikan', 'belajar', 'mengajar']
  }

  for (const [category, terms] of Object.entries(keywords)) {
    if (terms.some(term => lowerInput.includes(term))) {
      return category
    }
  }

  return 'Technology' // Default fallback
}

export async function POST(request: NextRequest) {
  try {
    const { userInput } = await request.json()

    if (!userInput) {
      return NextResponse.json(
        { error: 'User input is required' },
        { status: 400 }
      )
    }

    console.log('Categorizing:', userInput)

    // Check GROQ_API_KEY
    if (!process.env.GROQ_API_KEY) {
      console.warn('GROQ_API_KEY not set, using fallback categorization')
      const category = fallbackCategorization(userInput)
      return NextResponse.json({
        success: true,
        category,
        userInput,
        method: 'fallback'
      })
    }

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are an AI that categorizes user interests. Based on the user's input, determine which category from this list best matches: ${INTEREST_CATEGORIES.join(', ')}.

Rules:
1. Return ONLY the category name from the list above
2. Choose the MOST relevant category
3. If the input matches multiple categories, choose the most dominant one
4. Return exactly ONE category name, nothing else
5. The category name must be from the provided list`
          },
          {
            role: 'user',
            content: userInput
          }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        max_tokens: 50
      })

      let category = completion.choices[0]?.message?.content?.trim() || ''

      console.log('AI Response:', category)

      // Validasi bahwa kategori yang dikembalikan ada dalam daftar
      if (!INTEREST_CATEGORIES.includes(category)) {
        // Jika tidak ada dalam daftar, coba cari yang paling mirip
        const lowerCategory = category.toLowerCase()
        const matched = INTEREST_CATEGORIES.find(cat =>
          cat.toLowerCase() === lowerCategory
        )
        category = matched || fallbackCategorization(userInput)
      }

      return NextResponse.json({
        success: true,
        category,
        userInput,
        method: 'ai'
      })

    } catch (aiError) {
      console.error('Groq API error, using fallback:', aiError)
      const category = fallbackCategorization(userInput)
      return NextResponse.json({
        success: true,
        category,
        userInput,
        method: 'fallback'
      })
    }

  } catch (error) {
    console.error('Categorization error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to categorize interest',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
