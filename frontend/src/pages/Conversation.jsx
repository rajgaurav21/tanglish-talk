import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import API_BASE from '../config'
import TopBar from '../components/TopBar'
import { useSpeechRecognition, useTTS, isLangSupportedOnDevice } from '../hooks/useSpeech'
// useTTS is used only in Conversation (shared via props to ResponseCard)

function ResponseCard({ msg, onSpeak, onStop, speaking }) {
  return (
    <div className="relative group">
      <div className="absolute -inset-2 bg-surface-container-low rounded-xl -z-10" />
      <div className={`bg-surface-container-lowest rounded-xl p-6 shadow-sm border-b-4 transition-colors ${speaking ? 'border-primary-container' : 'border-secondary-container/50'}`}>
        {/* Tone badge + speaker */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary-container text-on-secondary-container rounded-full">
            <span className="material-symbols-outlined text-sm icon-fill">sentiment_very_satisfied</span>
            <span className="font-label text-xs font-bold uppercase tracking-wider capitalize">{msg.tone || 'casual'}</span>
          </div>
          <button
            onClick={() => speaking ? onStop() : onSpeak(msg.tamil_text)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              speaking ? 'bg-primary-container text-on-primary-container animate-pulse' : 'bg-surface-container-high hover:bg-primary-container hover:text-on-primary-container'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{speaking ? 'stop' : 'volume_up'}</span>
          </button>
        </div>

        {/* Tamil text */}
        <div className="mb-4">
          <span className="font-label text-xs text-on-surface-variant font-extrabold uppercase tracking-[0.2em] block mb-2">Tamil Slang</span>
          <h2 className="font-headline font-bold text-3xl text-on-surface leading-tight">{msg.tamil_text}</h2>
        </div>

        {/* Transliteration */}
        <div className="inline-block px-4 py-2 bg-surface-container-low rounded-lg mb-5">
          <span className="font-label text-xs text-on-surface-variant font-bold uppercase tracking-widest block mb-0.5">Transliteration</span>
          <p className="font-headline text-lg text-primary-dim italic">{msg.transliteration}</p>
        </div>

        {/* Meanings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-tertiary-container/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center font-bold text-xs">EN</span>
              <span className="font-label text-xs font-bold text-on-tertiary-container uppercase tracking-widest">English</span>
            </div>
            <p className="font-body text-sm text-on-surface leading-relaxed">{msg.meaning_en}</p>
          </div>
          <div className="bg-secondary-container/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-xs">HI</span>
              <span className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest">Hindi</span>
            </div>
            <p className="font-body text-sm text-on-surface leading-relaxed">{msg.meaning_hi}</p>
          </div>
        </div>

        {/* Word-by-word breakdown */}
        {msg.breakdown?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-outline-variant/20">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="material-symbols-outlined text-sm text-primary">auto_stories</span>
              <span className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest">Word Breakdown</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {msg.breakdown.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center bg-primary-container/20 border border-primary-container/40 rounded-xl px-3 py-2 min-w-[72px]">
                  <span className="font-headline text-base font-bold text-on-surface">{item.word}</span>
                  <span className="font-label text-[10px] text-primary font-bold italic">{item.romanized}</span>
                  <span className="font-body text-[10px] text-on-surface-variant text-center mt-0.5 leading-snug">{item.meaning}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function saveLearnedWords(breakdown, tamilText, tone) {
  if (!breakdown?.length) return
  const learned = JSON.parse(localStorage.getItem('tanglish_learned') || '[]')
  let added = false
  breakdown.forEach(item => {
    if (!item.word || !item.romanized) return
    const exists = learned.find(l => l.tamil === item.word)
    if (!exists) {
      learned.unshift({
        word: item.romanized,
        tamil: item.word,
        transliteration: item.romanized,
        meaning_en: item.meaning,
        tone: tone || 'casual',
        example: tamilText,
        learnedAt: new Date().toISOString(),
      })
      added = true
    }
  })
  if (added) localStorage.setItem('tanglish_learned', JSON.stringify(learned.slice(0, 300)))
}

export default function Conversation() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [inputMode, setInputMode] = useState('voice')
  const [sttError, setSttError] = useState(null)
  const [inputLang, setInputLang] = useState('hi-IN')
  const [autoSpeak, setAutoSpeak] = useState(true)
  const bottomRef = useRef(null)
  const { speak, speaking, stop } = useTTS()

  // Persistent session tracker — one entry per page load
  const sessionRef = useRef({
    id: `s_${Date.now()}`,
    timestamp: new Date().toISOString(),
    count: 0,
    preview: null,
  })

  const LANG_OPTIONS = [
    { code: 'hi-IN', label: 'Hindi', flag: 'हि' },
    { code: 'en-IN', label: 'English', flag: 'En' },
    { code: 'ta-IN', label: 'Tamil', flag: 'த' },
  ]

  const { listening, transcript, error: speechError, startListening, stopListening, setTranscript } = useSpeechRecognition(inputLang)

  // Auto-switch to text when device doesn't support selected language for voice
  useEffect(() => {
    if (!isLangSupportedOnDevice(inputLang)) {
      setInputMode('text')
    }
  }, [inputLang])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (speechError) setSttError(speechError)
  }, [speechError])

  // Auto-speak latest assistant message
  useEffect(() => {
    if (!autoSpeak) return
    const last = messages[messages.length - 1]
    if (last?.role === 'assistant' && last.tamil_text && last.tone !== 'error') {
      // Small delay so UI renders first
      const t = setTimeout(() => speak(last.tamil_text), 400)
      return () => clearTimeout(t)
    }
  }, [messages, autoSpeak])

  const sendMessage = async (input) => {
    if (!input.trim()) return
    stop()
    const sess = sessionRef.current
    if (!sess.preview) sess.preview = input
    sess.count += 1
    setMessages(prev => [...prev, { role: 'user', text: input }])
    setLoading(true)
    setSttError(null)
    setTranscript('')
    setTextInput('')

    try {
      const res = await axios.post(`${API_BASE}/chat`, { input, sessionId: sess.id })
      const data = res.data
      setMessages(prev => [...prev, { role: 'assistant', ...data }])

      // Persist session history
      const history = JSON.parse(localStorage.getItem('tanglish_history') || '[]')
      const idx = history.findIndex(h => h.id === sess.id)
      const entry = { id: sess.id, timestamp: sess.timestamp, count: sess.count, preview: sess.preview }
      if (idx >= 0) history[idx] = entry
      else history.unshift(entry)
      localStorage.setItem('tanglish_history', JSON.stringify(history.slice(0, 30)))

      // Save new words to slang guide
      saveLearnedWords(data.breakdown, data.tamil_text, data.tone)
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Something went wrong. Check backend.'
      setMessages(prev => [...prev, {
        role: 'assistant',
        tamil_text: 'Ayyo! Error aayduchu da!',
        transliteration: 'Ayyo! Error aayduchu da!',
        meaning_en: errMsg,
        meaning_hi: 'Kuch gadbad ho gayi.',
        tone: 'error'
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleMicPress = () => {
    if (listening) {
      stopListening()
    } else {
      setSttError(null)
      // Auto-send as soon as speech ends — no second tap needed
      startListening((finalText) => {
        if (finalText) sendMessage(finalText)
      })
    }
  }

  const handleTextSend = () => {
    const val = textInput.trim() || transcript.trim()
    if (val) sendMessage(val)
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopBar showXP />
      {/* Memory + auto-speak status bar */}
      <div className="fixed top-16 left-0 w-full z-40 flex items-center justify-between px-5 py-1.5 bg-surface-container-low/80 backdrop-blur-sm border-b border-outline-variant/20">
        <div className="flex items-center gap-1.5 text-on-surface-variant">
          <span className="material-symbols-outlined text-sm text-secondary">psychology</span>
          <span className="font-label text-[10px] font-bold uppercase tracking-widest">
            {messages.filter(m => m.role === 'user').length > 0
              ? `Memory: ${messages.filter(m => m.role === 'user').length} turn${messages.filter(m => m.role === 'user').length > 1 ? 's' : ''} remembered`
              : 'Memory active'}
          </span>
        </div>
        <button
          onClick={() => setAutoSpeak(v => !v)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-label text-[10px] font-bold uppercase tracking-widest transition-all ${
            autoSpeak ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-sm">{autoSpeak ? 'volume_up' : 'volume_off'}</span>
          {autoSpeak ? 'Auto-speak ON' : 'Auto-speak OFF'}
        </button>
      </div>

      {/* Chat area */}
      <main className="flex-1 mt-28 mb-64 px-4 max-w-3xl mx-auto w-full py-6 space-y-8">
        {messages.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl text-on-primary-container icon-fill">record_voice_over</span>
            </div>
            <h2 className="font-headline font-bold text-2xl text-on-surface">Enna sollureenga?</h2>
            <p className="font-body text-on-surface-variant">What are you saying? Speak in Hindi or English to start!</p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {[
                'How to say "I\'m hungry"?',
                'What does "Machan" mean?',
                'Teach me a greeting',
                'How to say "Let\'s go"?'
              ].map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="px-4 py-2 bg-surface-container-low rounded-full font-body text-sm text-on-surface hover:bg-surface-container-high transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i}>
            {msg.role === 'user' ? (
              <div className="flex justify-end">
                <div className="bg-primary text-on-primary p-5 rounded-xl rounded-br-none max-w-[85%] shadow-md">
                  <p className="font-body text-base leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ) : (
              <ResponseCard
                msg={msg}
                onSpeak={speak}
                onStop={stop}
                speaking={speaking && i === messages.length - 1}
              />
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 p-5 bg-surface-container-low rounded-xl">
            <div className="flex gap-1 items-end h-6">
              {[1,2,3,4,5,6,7].map(n => (
                <div key={n} className={`w-1 bg-primary-dim rounded-full audio-bar`} style={{ height: `${8 + Math.random() * 16}px` }} />
              ))}
            </div>
            <span className="font-body text-sm text-on-surface-variant">Tanglish-ifying...</span>
          </div>
        )}

        {/* Extra clearance so last card is never behind FAB */}
        <div className="h-8" />
        <div ref={bottomRef} />
      </main>

      {/* Input area */}
      <div className="fixed bottom-0 left-0 w-full z-50">
        {/* Language selector + status — full width row, no overlap with FAB */}
        <div className="flex items-center justify-between px-4 mb-2 gap-2">
          <div className="flex gap-2">
            {LANG_OPTIONS.map(l => (
              <button
                key={l.code}
                onClick={() => setInputLang(l.code)}
                className={`px-3 py-1.5 rounded-full font-label text-xs font-bold transition-all ${
                  inputLang === l.code
                    ? 'bg-primary-container text-on-primary-container'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {l.flag} {l.label}{!isLangSupportedOnDevice(l.code) ? ' 📝' : ''}
              </button>
            ))}
          </div>
          <span className="font-label text-[10px] text-on-surface-variant font-bold shrink-0">
            {listening ? '🔴 Listening...' : '👆 Tap mic'}
          </span>
        </div>

        {/* Error banner */}
        {sttError && (
          <div className="mx-4 mb-2 px-4 py-2 bg-error-container text-on-error-container rounded-xl text-sm font-body text-center">
            {sttError}
          </div>
        )}

        {/* Transcript preview */}
        {transcript && (
          <div className="mx-4 mb-2 px-4 py-3 bg-surface-container-lowest rounded-xl shadow border border-outline-variant/30 flex items-center justify-between gap-3">
            <p className="font-body text-sm text-on-surface flex-1">{transcript}</p>
            <button onClick={() => setTranscript('')} className="material-symbols-outlined text-on-surface-variant text-lg">close</button>
          </div>
        )}

        {/* Text input mode */}
        {inputMode === 'text' && (
          <div className="mx-4 mb-2 flex gap-2">
            <input
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTextSend()}
              placeholder="Type in Hindi or English..."
              className="flex-1 bg-surface-container-lowest border border-outline-variant/50 rounded-full px-5 py-3 font-body text-sm text-on-surface outline-none focus:border-primary"
            />
            <button
              onClick={handleTextSend}
              disabled={!textInput.trim() && !transcript.trim()}
              className="w-12 h-12 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center disabled:opacity-40 hover:bg-primary-fixed-dim transition-all"
            >
              <span className="material-symbols-outlined icon-fill">send</span>
            </button>
          </div>
        )}

        {/* Bottom nav with FAB */}
        <div className="relative">
          {/* FAB mic button */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-10 z-10">
            <div className="relative">
              {listening && (
                <>
                  <div className="absolute inset-0 bg-primary-container/30 rounded-full mic-pulse scale-150" />
                  <div className="absolute inset-0 bg-primary-container/15 rounded-full mic-pulse scale-[2]" style={{ animationDelay: '0.3s' }} />
                </>
              )}
              <button
                onClick={handleMicPress}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-on-primary-container shadow-2xl transition-transform active:scale-90 ${
                  listening
                    ? 'bg-error'
                    : 'bg-gradient-to-br from-primary-container to-primary-fixed-dim'
                }`}
              >
                <span className="material-symbols-outlined text-4xl icon-fill">{listening ? 'stop' : 'mic'}</span>
              </button>
            </div>
          </div>

          <nav className="bg-surface/80 glass-nav rounded-t-[3rem] shadow-[0_-4px_40px_rgba(46,47,47,0.06)] flex justify-around items-center px-6 pb-8 pt-4 w-full">
            <button onClick={() => navigate('/')} className="flex flex-col items-center text-on-surface-variant p-2 hover:text-on-surface transition-all active:scale-90">
              <span className="material-symbols-outlined">home</span>
              <span className="font-label text-[10px] uppercase tracking-widest font-bold mt-0.5">Home</span>
            </button>

            <button
              onClick={() => setInputMode(m => m === 'text' ? 'voice' : 'text')}
              className={`flex flex-col items-center p-2 transition-all active:scale-90 rounded-full px-4 ${
                inputMode === 'text' ? 'bg-orange-100 text-orange-900' : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined icon-fill">{inputMode === 'text' ? 'keyboard' : 'mic'}</span>
              <span className="font-label text-[10px] uppercase tracking-widest font-bold mt-0.5">Chat</span>
            </button>

            <div className="w-20" />

            <button onClick={() => navigate('/history')} className="flex flex-col items-center text-on-surface-variant p-2 hover:text-on-surface transition-all active:scale-90">
              <span className="material-symbols-outlined">history</span>
              <span className="font-label text-[10px] uppercase tracking-widest font-bold mt-0.5">History</span>
            </button>

            <button onClick={() => navigate('/guide')} className="flex flex-col items-center text-on-surface-variant p-2 hover:text-on-surface transition-all active:scale-90">
              <span className="material-symbols-outlined">menu_book</span>
              <span className="font-label text-[10px] uppercase tracking-widest font-bold mt-0.5">Guide</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}
