import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant'

export async function POST(request: NextRequest) {
  try {
    const { entries } = await request.json()

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ ok: false, error: 'Changelog entries are required' }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY?.trim().replace(/^['\"]|['\"]$/g, '')
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'GROQ_API_KEY is not configured' }, { status: 500 })
    }

    const changelogText = entries.map(e => `Version ${e.version} (${e.date}):\n${e.body}`).join('\n\n---\n\n')

    const prompt = `
      Basierend auf den folgenden Changelog-Einträgen für den ABI Planer, erstelle einen ansprechenden News-Beitrag für die User.
      Der Beitrag sollte die wichtigsten Neuerungen zusammenfassen und freundlich formuliert sein.
      Nutze Markdown für die Formatierung.

      Changelog-Daten:
      ${changelogText}

      Antworte NUR im JSON-Format:
      {
        "title": "Vorschlag für einen Titel",
        "content": "Der generierte News-Inhalt in Markdown..."
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
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Du bist ein erfahrener Community-Manager und Technical Writer.' },
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
    console.error('News generation error:', error)
    return NextResponse.json({ ok: false, error: 'Failed to generate news' }, { status: 500 })
  }
}
