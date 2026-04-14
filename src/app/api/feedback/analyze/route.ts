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
      Deine Aufgabe ist es, das Feedback präzise zu kategorisieren und eine differenzierte Wichtigkeit (Importance) zu vergeben.

      TITEL: ${title}
      BESCHREIBUNG: ${description}

      ### RICHTLINIEN FÜR DIE WICHTIGKEIT (1-10):
      Verteile die Scores gleichmäßig und sei kritisch. Vermeide es, alles in die Mitte (5-7) zu packen.
      
      - 1-2: Sehr niedrig. Kosmetische Details, winzige UI-Korrekturen, extrem spezifische Nischen-Wünsche.
      - 3-4: Niedrig. Nützliche, aber nicht notwendige Komfort-Features, leichte UX-Reibung.
      - 5-6: Mittel. Wichtige Features für die breite Masse, signifikante UX-Verbesserungen, Fehler die den Workflow stören aber nicht stoppen.
      - 7-8: Hoch. Kritische Features die oft angefragt werden, schwere Bugs (Datenverlust in kleinem Rahmen, Abstürze bestimmter Seiten).
      - 9-10: Kritisch. Systemweite Blocker, Sicherheitslücken, totaler Datenverlust, Ausfall Kern-Funktionen (z.B. Trading, Kasse, Login).

      ### KATEGORIEN:
      Wähle eine passende Kategorie wie: "Bug", "Feature", "Design", "Finanzen", "Sammelkarten", "Sicherheit", "Allgemein".

      Antworte NUR im JSON-Format:
      {
        "category": "Kategorie-Name",
        "importance": 7,
        "ai_reasoning": "Kurze, präzise Begründung warum genau dieser Score (max 15 Wörter)"
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
      // Pass through the status code (e.g. 429 for rate limit) or use 500
      return NextResponse.json({ ok: false, error: 'Groq API request failed' }, { status: response.status || 500 })
    }

    const data = await response.json()
    const rawContent = data.choices[0]?.message?.content
    if (!rawContent) {
      throw new Error('No content received from AI')
    }

    const result = JSON.parse(rawContent)

    // Validate and provide defaults to prevent "undefined" in Firestore
    const validatedResult = {
      category: typeof result.category === 'string' ? result.category : 'Allgemein',
      importance: typeof result.importance === 'number' ? Math.max(1, Math.min(10, result.importance)) : 5,
      ai_reasoning: typeof result.ai_reasoning === 'string' ? result.ai_reasoning : 'Keine Begründung verfügbar'
    }

    return NextResponse.json({ ok: true, ...validatedResult })
  } catch (error) {
    console.error('Feedback analysis error:', error)
    return NextResponse.json({ ok: false, error: 'Failed to analyze feedback' }, { status: 500 })
  }
}
