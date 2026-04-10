import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant'

export async function POST(request: NextRequest) {
  try {
    const { title, description } = await request.json()

    if (!title || !description) {
      return NextResponse.json({ ok: false, error: 'Title and description are required' }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY?.trim().replace(/^['\"]|['\"]$/g, '')
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'GROQ_API_KEY is not configured' }, { status: 500 })
    }

    const prompt = `
      Analysiere das folgende Feedback für eine Web-App (ABI Planer).
      Kategorisiere es in eine kurze Kategorie (z.B. "Bug", "Feature", "Design", "Finanzen", "Allgemein") 
      und bewerte die Wichtigkeit auf einer Skala von 1 (sehr niedrig) bis 10 (kritisch/blockierend).

      Titel: ${title}
      Beschreibung: ${description}

      Antworte NUR im JSON-Format:
      {
        "category": "Kategorie-Name",
        "importance": 7,
        "reasoning": "Kurze Begründung (max 10 Wörter)"
      }
    `

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_GROQ_MODEL,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Du bist ein hilfreicher Analyse-Assistent.' },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Groq API Error:', errorData)
      return NextResponse.json({ ok: false, error: 'Groq API request failed' }, { status: 502 })
    }

    const data = await response.json()
    const result = JSON.parse(data.choices[0].message.content)

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('Feedback analysis error:', error)
    return NextResponse.json({ ok: false, error: 'Failed to analyze feedback' }, { status: 500 })
  }
}
