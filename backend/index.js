import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import Groq from 'groq-sdk'

const app = express()
app.use(cors())
app.use(express.json())

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const SYSTEM_PROMPT = `You are Tanglish Guru — a fun, authentic Chennai Tamil slang teacher.
The user may speak in Hindi, English, or Tamil.

RULES:
- If user asks "what does X mean" or "meaning of X" — explain X in tamil_text and give its meaning.
- If user wants to SAY something — give the Tamil slang equivalent.
- Always respond as a single valid JSON object with exactly these 5 keys:
  tamil_text, transliteration, meaning_hi, meaning_en, tone
- tone must be one of: casual, friendly, playful, respectful, excited
- Use real Chennai slang: machan, da, di, dei, sema, gethu, poda, romba, vaanga, nandri, etc.
- Tamil text must use Tamil Unicode script.
- Output ONLY the JSON. No markdown, no explanation, no extra text.`

// Per-session conversation memory (keyed by session ID)
const sessions = new Map()

function getHistory(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, [])
  }
  return sessions.get(sessionId)
}

app.post('/chat', async (req, res) => {
  const { input, sessionId = 'default' } = req.body
  if (!input?.trim()) return res.status(400).json({ error: 'Input required' })

  const history = getHistory(sessionId)

  // Keep last 10 turns to avoid token overflow
  const recentHistory = history.slice(-10)

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...recentHistory,
    { role: 'user', content: input }
  ]

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.8,
      max_tokens: 300,
    })

    let text = completion.choices[0]?.message?.content?.trim() || ''
    // Strip markdown fences if present
    text = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim()

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      parsed = match ? JSON.parse(match[0]) : null
    }

    if (!parsed?.tamil_text) {
      throw new Error('Invalid JSON response from model')
    }

    const response = {
      tamil_text: parsed.tamil_text,
      transliteration: parsed.transliteration || '',
      meaning_hi: parsed.meaning_hi || '',
      meaning_en: parsed.meaning_en || '',
      tone: parsed.tone || 'casual',
      source: 'ai',
    }

    // Save to memory
    history.push({ role: 'user', content: input })
    history.push({ role: 'assistant', content: JSON.stringify(response) })

    res.json(response)
  } catch (err) {
    console.error('Groq error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🚀 Tanglish Talk backend on http://localhost:${PORT}`))
