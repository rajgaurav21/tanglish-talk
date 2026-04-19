import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { ChatGroq } from '@langchain/groq'
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages'

const app = express()
app.use(cors())
app.use(express.json())

const SYSTEM_PROMPT = `You are Tanglish Guru — a Chennai Tamil slang expert.

User may speak Hindi, English, or Tamil.

Rules:
- If user asks meaning → explain.
- If user wants to say something → reply in natural Chennai slang (not literal).

Output ONLY valid JSON with keys:
tamil_text, transliteration, meaning_hi, meaning_en, tone, breakdown

Tone: casual | friendly | playful | respectful | excited

Guidelines:
- Use real slang: da, di, machan, sema, gethu
- Prefer natural spoken Tamil
- Tamil must be in Unicode

Examples:

Input: Let's go for a movie
Output: {"tamil_text":"படம் போலாமா டா?","transliteration":"padam polama da","meaning_hi":"चलो फिल्म देखने चलें?","meaning_en":"Shall we go watch a movie?","tone":"casual","breakdown":[{"word":"படம்","romanized":"padam","meaning":"movie"},{"word":"போலாமா","romanized":"polama","meaning":"shall we go"},{"word":"டா","romanized":"da","meaning":"informal address"}]}

Input: I am very tired
Output: {"tamil_text":"ரொம்ப டயர்டா இருக்கு டா","transliteration":"romba tired-a irukku da","meaning_hi":"मैं बहुत थक गया हूँ","meaning_en":"I am very tired","tone":"casual","breakdown":[{"word":"ரொம்ப","romanized":"romba","meaning":"very"},{"word":"டயர்டா","romanized":"tired-a","meaning":"tired"},{"word":"இருக்கு","romanized":"irukku","meaning":"is"},{"word":"டா","romanized":"da","meaning":"informal address"}]}`

const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: 'llama-3.3-70b-versatile',
  temperature: 0.6,
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
