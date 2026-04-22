/**
 * Report Analysis Core
 * NEW FILE to resolve persistent HMR caching issues.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const STRONG_MODEL = 'llama-3.1-70b-versatile'

export type ReportSection = 'pitch' | 'intro' | 'features' | 'users' | 'finances' | 'shop' | 'social' | 'technical' | 'roadmap' | 'manual' | 'script'

export interface SectionData {
  type: ReportSection
  stats?: any
  context?: string
}

const ANALYSIS_GENERATION_DELAY = 1500

export async function generateReportSectionAnalysis(
  section: SectionData,
  apiKey: string,
  useFallback = false
): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, Math.random() * (ANALYSIS_GENERATION_DELAY / 2) + (ANALYSIS_GENERATION_DELAY / 2)))

  const prompt = buildPromptForSection(section)
  const model = useFallback ? 'llama-3.1-8b-instant' : STRONG_MODEL
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 40000)

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'Du bist ein sachlicher Projektleiter. Dein Schreibstil ist nüchtern, präzise und rein textbasiert. Nutze KEINE Emojis, KEIN Markdown (keine Sternchen **, keine Raute #) und KEINE schmückenden Adjektive. Konzentriere dich auf Fakten, Zahlen und klare Anweisungen. Trenne Absätze durch doppelte Zeilenumbrüche.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1200,
      })
    } as any)

    clearTimeout(timeoutId)

    if (!response.ok) {
      if (response.status === 429 && !useFallback) {
        return generateReportSectionAnalysis(section, apiKey, true)
      }
      const errorText = await response.text()
      throw new Error(`Groq error ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (!useFallback) return generateReportSectionAnalysis(section, apiKey, true)
    return `[Fehler: Daten konnten nicht verarbeitet werden.]`
  }
}

function buildPromptForSection(section: SectionData): string {
  const statsStr = JSON.stringify(section.stats, null, 2)
  
  switch (section.type) {
    case 'pitch':
      return `Fasse die Projektziele und den Nutzen des ABI Planers sachlich zusammen. Warum ist das System notwendig? Nutze keine Emojis oder Markdown.`

    case 'manual':
      return `Erstelle eine sachliche Anleitung für das Orga-Team zur Nutzung der Systemdaten. Nutze keine Emojis oder Markdown.`

    case 'users':
      return `Analysiere die Nutzerzahlen sachlich. Daten: ${statsStr}. Nutze keine Emojis oder Markdown.`
    
    case 'finances':
      return `Berichte über die finanzielle Lage basierend auf diesen Daten: ${statsStr}. Nutze keine Emojis oder Markdown.`

    case 'shop':
      return `Analysiere die Shop-Umsätze sachlich. Daten: ${statsStr}. Nutze keine Emojis oder Markdown.`
      
    case 'social':
      return `Analysiere die Nutzung des TCG-Moduls rein faktisch. Daten: ${statsStr}. Nutze keine Emojis oder Markdown.`
      
    case 'technical':
      return `Beschreibe die technische Infrastruktur (Next.js, Firebase) und die Sicherheitsmerkmale sachlich. Nutze keine Emojis oder Markdown.`

    case 'intro':
      return `Verfasse eine kurze Einleitung zum Projekt ABI Planer 2027. Was ist der aktuelle Kontext? Nutze keine Emojis oder Markdown.`

    case 'features':
      return `Liste die Kernfunktionen des Systems nüchtern auf. Nutze keine Emojis oder Markdown.`
      
    case 'roadmap':
      return `Liste die kommenden Projektschritte sachlich auf. Nutze keine Emojis oder Markdown.`

    case 'script':
      return `Erstelle eine stichpunktartige Zusammenfassung der wichtigsten Fakten für eine Präsentation. Nutze keine Emojis oder Markdown.`

    default:
      return `Verfasse einen sachlichen Text für ${section.type}. Daten: ${statsStr}. Nutze keine Emojis oder Markdown.`
  }
}
