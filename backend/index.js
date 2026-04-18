import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

// ─── Attempt to load LangChain + Groq (primary) or OpenAI (fallback) ──────────
let chain = null
let chainReady = false

async function initChain() {
  try {
    const { BufferMemory } = await import('langchain/memory')
    const { ConversationChain } = await import('langchain/chains')
    const { ChatPromptTemplate, MessagesPlaceholder } = await import('@langchain/core/prompts')

    let llm
    if (process.env.GROQ_API_KEY) {
      const { ChatGroq } = await import('@langchain/groq')
      llm = new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.85,
      })
      console.log('🦙 Using Groq (llama-3.3-70b-versatile) — FREE tier')
    } else {
      const { ChatOpenAI } = await import('@langchain/openai')
      llm = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: 'gpt-4o-mini',
        temperature: 0.85,
      })
      console.log('🤖 Using OpenAI gpt-4o-mini')
    }

    const memory = new BufferMemory({ returnMessages: true, memoryKey: 'history' })

    const systemPrompt = `You are Tanglish Guru — a fun, authentic Chennai Tamil slang teacher for Hindi/English speakers.

IMPORTANT RULES:
1. If the user asks "what does X mean" or "meaning of X" or "explain X" — put X in tamil_text (in Tamil script if possible), and explain its actual meaning in meaning_en and meaning_hi. Do NOT replace it with a different phrase.
2. If the user wants to SAY something (e.g. "how do I say I'm hungry") — provide the Tamil slang equivalent.
3. Always respond ONLY as valid JSON with exactly these keys:
   - tamil_text: the Tamil phrase (Tamil Unicode script)
   - transliteration: easy romanized pronunciation
   - meaning_hi: what it means in Hindi
   - meaning_en: what it means in English
   - tone: one of casual/friendly/playful/respectful/excited

Example for "what does Eppadi irukka mean":
{{"tamil_text":"எப்படி இருக்க?","transliteration":"Eppadi irukka?","meaning_hi":"Kaisa hai? / Kaise ho?","meaning_en":"How are you? (casual way to ask)","tone":"casual"}}

Example for "how do I say I'm hungry":
{{"tamil_text":"ரொம்ப பசி டா!","transliteration":"Romba pasi da!","meaning_hi":"Bahut bhook lagi yaar!","meaning_en":"I'm very hungry dude!","tone":"casual"}}

Use real Chennai street slang vocabulary: machan, dei, da/di, sema, gethu, poda, romba, vaanga, aama, etc.
No markdown, no extra text outside the JSON.`

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      new MessagesPlaceholder('history'),
      ['human', '{input}'],
    ])

    chain = new ConversationChain({ llm, memory, prompt })
    chainReady = true
    console.log('✅ LangChain + OpenAI chain ready')
  } catch (err) {
    console.warn('⚠️  LangChain init failed, will use demo mode:', err.message)
  }
}

initChain()

// ─── Rich demo responses (used when API is unavailable) ───────────────────────
const DEMO_RESPONSES = [
  {
    keywords: ['hungry', 'bhookh', 'bhook', 'khaana', 'eat', 'food', 'pasi'],
    response: { tamil_text: 'செம பசி மச்சான்! சாப்டியா?', transliteration: 'Sema pasi machan! Saptiya?', meaning_hi: 'Bahut zyaada bhook lagi yaar! Kha liya kya?', meaning_en: "Super hungry dude! Did you eat?", tone: 'casual' }
  },
  {
    keywords: ['hello', 'hi', 'namaste', 'greet', 'hey', 'vanakkam', 'helo'],
    response: { tamil_text: 'டேய் மச்சான்! எப்படி இருக்க?', transliteration: 'Dei machan! Eppadi irukka?', meaning_hi: 'Oye yaar! Kaisa hai?', meaning_en: "Hey dude! How are you?", tone: 'friendly' }
  },
  {
    keywords: ['awesome', 'cool', 'great', 'amazing', 'nice', 'fantastic', 'badhiya', 'zabardast'],
    response: { tamil_text: 'செம கெத்து டா!', transliteration: 'Sema gethu da!', meaning_hi: 'Zabardast style hai yaar!', meaning_en: "That's super cool / awesome style!", tone: 'excited' }
  },
  {
    keywords: ["let's go", 'chalo', 'chalte', 'jaldi', 'hurry', 'come', 'vaa'],
    response: { tamil_text: 'டா வா வா! லேட் ஆகுது!', transliteration: 'Da vaa vaa! Late aaguthu!', meaning_hi: 'Yaar aa aa! Der ho rahi hai!', meaning_en: "Dude come come! Getting late!", tone: 'playful' }
  },
  {
    keywords: ['friend', 'dost', 'yaar', 'bro', 'bhai', 'buddy'],
    response: { tamil_text: 'என் நண்பன் மச்சான்!', transliteration: 'En nanban machan!', meaning_hi: 'Mera dost yaar!', meaning_en: "My best friend dude!", tone: 'friendly' }
  },
  {
    keywords: ['what', 'kya', 'enna', 'asking', 'mean', 'matlab', 'slang'],
    response: { tamil_text: 'டேய்! என்ன கேக்குர?', transliteration: 'Dei! Enna kekkura?', meaning_hi: 'Abe! Kya pooch raha hai?', meaning_en: "Hey! What are you asking?", tone: 'casual' }
  },
  {
    keywords: ['love', 'pyaar', 'like', 'heart', 'beautiful', 'kadhal'],
    response: { tamil_text: 'மாப்பு ரொம்ப அழகு டா!', transliteration: 'Maapu romba azhagu da!', meaning_hi: 'Yaar bohot khoobsurat hai re!', meaning_en: "Dude she/he is very beautiful!", tone: 'friendly' }
  },
  {
    keywords: ['bye', 'goodbye', 'later', 'alvida', 'phir', 'milte'],
    response: { tamil_text: 'பை டா! பாக்கலாம்!', transliteration: 'Bye da! Paakalaam!', meaning_hi: 'Bye yaar! Phir milenge!', meaning_en: "Bye dude! See you later!", tone: 'casual' }
  },
  {
    keywords: ['water', 'thirsty', 'paani', 'thanni'],
    response: { tamil_text: 'தண்ணி குடு மச்சான்!', transliteration: 'Thanni kudu machan!', meaning_hi: 'Paani de yaar!', meaning_en: "Give me water dude!", tone: 'casual' }
  },
  {
    keywords: ['tired', 'thak', 'sleepy', 'boring', 'bore'],
    response: { tamil_text: 'ரொம்ப டயர்டு ஆயிட்டேன் டா!', transliteration: 'Romba tired aaiten da!', meaning_hi: 'Bahut thak gaya yaar!', meaning_en: "So tired dude!", tone: 'casual' }
  },
  {
    keywords: ['happy', 'khush', 'excited', 'joy', 'celebrate'],
    response: { tamil_text: 'செம்ம ஹேப்பி டா! கோடி கோடி!', transliteration: 'Semma happy da! Kodi kodi!', meaning_hi: 'Bahut khush hoon yaar!', meaning_en: "Extremely happy dude! Millions of times over!", tone: 'excited' }
  },
  {
    keywords: ['money', 'paisa', 'kaash', 'rich', 'broke', 'paise'],
    response: { tamil_text: 'பணம் இல்ல மச்சான் 😅', transliteration: 'Panam illa machan', meaning_hi: 'Paise nahi yaar 😅', meaning_en: "No money dude 😅", tone: 'playful' }
  },
]

const FALLBACK = {
  tamil_text: 'சரி மச்சான்! நான் இருக்கேன்!',
  transliteration: 'Sari machan! Naan iruken!',
  meaning_hi: 'Theek hai yaar! Main hoon na!',
  meaning_en: "Alright dude! I'm here for you!",
  tone: 'friendly'
}

function getDemoResponse(input) {
  const lower = input.toLowerCase()
  for (const item of DEMO_RESPONSES) {
    if (item.keywords.some(k => lower.includes(k))) {
      return item.response
    }
  }
  return FALLBACK
}

// ─── Chat endpoint ──────────────────────────────────────────────────────────
app.post('/chat', async (req, res) => {
  const { input } = req.body
  if (!input?.trim()) return res.status(400).json({ error: 'Input is required' })

  // Try real AI chain first
  if (chainReady && chain) {
    try {
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

      if (parsed?.tamil_text) {
        return res.json({
          tamil_text: parsed.tamil_text,
          transliteration: parsed.transliteration || '',
          meaning_hi: parsed.meaning_hi || '',
          meaning_en: parsed.meaning_en || '',
          tone: parsed.tone || 'casual',
          source: 'ai',
        })
      }
    } catch (err) {
      console.warn('AI chain error (falling back to demo):', err.message?.slice(0, 80))
    }
  }

  // Demo fallback
  const demo = getDemoResponse(input)
  return res.json({ ...demo, source: 'demo' })
})

app.get('/health', (_, res) => res.json({
  status: 'ok',
  ai: chainReady ? 'live' : 'demo',
  time: new Date().toISOString()
}))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🚀 Tanglish Talk backend on http://localhost:${PORT}`)
})
