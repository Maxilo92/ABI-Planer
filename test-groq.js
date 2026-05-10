const apiKey = process.env.GROQ_API_KEY;

async function test() {
  const prompt = `Du bist ein präziser Titel-Generator. Erzeuge eine sehr kurze Zusammenfassung (als Titel) für diesen Chatverlauf in German.
Regeln:
- Gib EXAKT ein JSON-Objekt mit dem Feld "title" zurück.
- Der Titel soll 1 bis 4 Wörter lang sein.
- Fasse das Thema basierend NUR auf den tatsächlichen Nachrichten zusammen. Erfinde NIEMALS Themen dazu!
- Wenn der Nutzer nur "Test" sagt, antworte z.B. mit {"title": "Chat Test"}.
- Wenn der Nutzer nur Hallo sagt, antworte z.B. mit {"title": "Begrüßung"}.
- Kein Punkt am Ende, keine Anführungszeichen im Titel.`

  const messages = [
    { role: 'user', content: 'Test' },
    { role: 'assistant', content: 'Nice, das klingt nach einem Test! Was möchtest du tun?' }
  ]

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
      max_tokens: 80,
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: prompt },
        ...messages,
      ],
    }),
  });

  const parsed = await response.json();
  console.log(JSON.stringify(parsed, null, 2));
}

test();
