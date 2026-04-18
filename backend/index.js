import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { ChatGroq } from '@langchain/groq'
import { BufferMemory, ChatMessageHistory } from 'langchain/memory'
import { ConversationChain } from 'langchain/chains'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'

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
  Example: [{{"word":"ரொம்ப","romanized":"Romba","meaning":"very / a lot"}},{{"word":"பசி","romanized":"Pasi","meaning":"hunger"}},{{"word":"டா","romanized":"Da","meaning":"dude (casual suffix)"}}]
- Use real Chennai slang: machan, da, di, dei, sema, gethu, poda, romba, vaanga, nandri, etc.
- Tamil text must use Tamil Unicode script.
- Output ONLY the JSON. No markdown, no explanation, no extra text.

Example: {{"tamil_text":"ரொம்ப பசி டா!","transliteration":"Romba pasi da!","meaning_hi":"Bahut bhook lagi yaar!","meaning_en":"So hungry dude!","tone":"casual","breakdown":[{{"word":"ரொம்ப","romanized":"Romba","meaning":"very / a lot"}},{{"word":"பசி","romanized":"Pasi","meaning":"hunger"}},{{"word":"டா","romanized":"Da","meaning":"dude (casual suffix)"}}]}}`

// Per-session chains with their own memory
const sessionChains = new Map()

function createChain() {
  const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile',
    temperature: 0.85,
  })

  const memory = new BufferMemory({
    returnMessages: true,
    memoryKey: 'history',
    chatHistory: new ChatMessageHistory(),
  })

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', SYSTEM_PROMPT],
    new MessagesPlaceholder('history'),
    ['human', '{input}'],
  ])

  return new ConversationChain({ llm, memory, prompt })
}

function getChain(sessionId) {
  if (!sessionChains.has(sessionId)) {
    sessionChains.set(sessionId, createChain())
  }
  return sessionChains.get(sessionId)
}

app.post('/chat', async (req, res) => {
  const { input, sessionId = 'default' } = req.body
  if (!input?.trim()) return res.status(400).json({ error: 'Input required' })

  try {
    const chain = getChain(sessionId)
    const result = await chain.call({ input })
    let text = (result.response || '').trim()
      .replace(/^```json?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      parsed = match ? JSON.parse(match[0]) : null
    }

    if (!parsed?.tamil_text) throw new Error('Invalid response from model')

    res.json({
      tamil_text: parsed.tamil_text,
      transliteration: parsed.transliteration || '',
      meaning_hi: parsed.meaning_hi || '',
      meaning_en: parsed.meaning_en || '',
      tone: parsed.tone || 'casual',
      breakdown: Array.isArray(parsed.breakdown) ? parsed.breakdown : [],
      source: 'langchain',
    })
  } catch (err) {
    console.error('Chain error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.get('/health', (_, res) => res.json({
  status: 'ok',
  engine: 'LangChain + Groq',
  sessions: sessionChains.size,
  time: new Date().toISOString(),
}))

// ✅ Await a warm-up call to verify chain works BEFORE accepting requests
async function start() {
  console.log('🔧 Warming up LangChain chain...')
  try {
    const testChain = createChain()
    const result = await testChain.call({ input: 'say hi in one word' })
    console.log('✅ LangChain ready:', result.response?.slice(0, 60))
  } catch (err) {
    console.error('❌ LangChain warmup failed:', err.message)
    process.exit(1)
  }

  const PORT = process.env.PORT || 3001
  app.listen(PORT, () => console.log(`🚀 Tanglish Talk (LangChain) on http://localhost:${PORT}`))
}

start()
