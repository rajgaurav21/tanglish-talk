import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { ChatGroq } from '@langchain/groq'
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages'

const app = express()
app.use(cors())
app.use(express.json())

const SYSTEM_PROMPT = `You are Tanglish Guru — a fun, authentic Chennai Tamil slang teacher.
The user may speak in Hindi, English, or Tamil.

RULES:
- If user asks "what does X mean" or "meaning of X" — explain X and give its actual meaning.
- If user wants to SAY something — give the Tamil slang equivalent.
- Always respond as a single valid JSON object with exactly these 6 keys:
  tamil_text, transliteration, meaning_hi, meaning_en, tone, breakdown
- tone must be one of: casual, friendly, playful, respectful, excited
- breakdown: array of objects, one per significant word/particle in tamil_text.
  Each object has: word (Tamil script), romanized (how to pronounce it), meaning (English meaning of just that word)
  Example: [{"word":"ரொம்ப","romanized":"Romba","meaning":"very / a lot"},{"word":"பசி","romanized":"Pasi","meaning":"hunger"},{"word":"டா","romanized":"Da","meaning":"dude (casual suffix)"}]
- Use real Chennai slang: machan, da, di, dei, sema, gethu, poda, romba, vaanga, nandri, etc.
- Tamil text must use Tamil Unicode script.
- Output ONLY the JSON. No markdown, no explanation, no extra text.

Example: {"tamil_text":"ரொம்ப பசி டா!","transliteration":"Romba pasi da!","meaning_hi":"Bahut bhook lagi yaar!","meaning_en":"So hungry dude!","tone":"casual","breakdown":[{"word":"ரொம்ப","romanized":"Romba","meaning":"very / a lot"},{"word":"பசி","romanized":"Pasi","meaning":"hunger"},{"word":"டா","romanized":"Da","meaning":"dude (casual suffix)"}]}`

const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: 'llama-3.3-70b-versatile',
  temperature: 0.85,
})

// Per-session message history: sessionId -> Message[]
const sessionHistories = new Map()

function getHistory(sessionId) {
  if (!sessionHistories.has(sessionId)) {
    sessionHistories.set(sessionId, [])
  }
  return sessionHistories.get(sessionId)
}

app.post('/chat', async (req, res) => {
  const { input, sessionId = 'default' } = req.body
  if (!input?.trim()) return res.status(400).json({ error: 'Input required' })

  try {
    const history = getHistory(sessionId)

    const messages = [
      new SystemMessage(SYSTEM_PROMPT),
      ...history,
      new HumanMessage(input),
    ]

    const response = await llm.invoke(messages)
    const rawText = (response.content || '').trim()
      .replace(/^```json?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    let parsed
    try {
      parsed = JSON.parse(rawText)
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/)
      parsed = match ? JSON.parse(match[0]) : null
    }

    if (!parsed?.tamil_text) throw new Error('Invalid response from model')

    // Save to history for next turn
    history.push(new HumanMessage(input))
    history.push(new AIMessage(rawText))

    // Keep last 20 messages (10 turns) to avoid token bloat
    if (history.length > 20) history.splice(0, history.length - 20)

    res.json({
      tamil_text: parsed.tamil_text,
      transliteration: parsed.transliteration || '',
      meaning_hi: parsed.meaning_hi || '',
      meaning_en: parsed.meaning_en || '',
      tone: parsed.tone || 'casual',
      breakdown: Array.isArray(parsed.breakdown) ? parsed.breakdown : [],
      source: 'langchain-groq',
    })
  } catch (err) {
    console.error('Chat error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.get('/health', (_, res) => res.json({
  status: 'ok',
  engine: 'Groq + LangChain Core',
  sessions: sessionHistories.size,
  time: new Date().toISOString(),
}))

async function start() {
  console.log('🔧 Warming up Groq...')
  try {
    const test = await llm.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage('say hi in Tamil in one word'),
    ])
    console.log('✅ Groq ready:', test.content?.slice(0, 60))
  } catch (err) {
    console.error('❌ Warmup failed:', err.message)
    process.exit(1)
  }

  const PORT = process.env.PORT || 3001
  app.listen(PORT, () => console.log(`🚀 Tanglish Talk on http://localhost:${PORT}`))
}

start()
