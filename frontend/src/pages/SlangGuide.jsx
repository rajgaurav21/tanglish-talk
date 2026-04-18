import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import { useTTS } from '../hooks/useSpeech'

const SLANG_DATA = [
  { word: 'Machan', tamil: 'மச்சான்', transliteration: 'Machan', meaning_en: 'Dude / Bro / Friend', meaning_hi: 'Yaar / Dost', tone: 'Friendly', example: 'Machan, enna news?' },
  { word: 'Sema', tamil: 'செம', transliteration: 'Sema', meaning_en: 'Awesome / Extreme (intensifier)', meaning_hi: 'Bahut zyaada / Zabardast', tone: 'Casual', example: 'Sema movie da!' },
  { word: 'Poda', tamil: 'போடா', transliteration: 'Poda', meaning_en: 'Get lost! (friendly-rude)', meaning_hi: 'Ja be! (dost ke saath)', tone: 'Playful', example: 'Aiyyo poda!' },
  { word: 'Gethu', tamil: 'கெத்து', transliteration: 'Gethu', meaning_en: 'Swagger / Cool factor', meaning_hi: 'Style / Attitude', tone: 'Cool', example: 'Avan gethu aalu.' },
  { word: 'Dei', tamil: 'டேய்', transliteration: 'Dei', meaning_en: 'Hey! (attention call, male)', meaning_hi: 'Oye! / Abe!', tone: 'Casual', example: 'Dei, vaa da!' },
  { word: 'Ponga', tamil: 'போங்க', transliteration: 'Ponga', meaning_en: 'Get lost (polite/playful)', meaning_hi: 'Jao na (naram tareke se)', tone: 'Polite-play', example: 'Aiyyo ponga!' },
  { word: 'Neenga', tamil: 'நீங்க', transliteration: 'Neenga', meaning_en: 'You (respectful)', meaning_hi: 'Aap (izzat se)', tone: 'Formal', example: 'Neenga sapteenga?' },
  { word: 'Saptiya', tamil: 'சாப்டியா', transliteration: 'Saptiya', meaning_en: 'Did you eat?', meaning_hi: 'Kha liya kya?', tone: 'Caring', example: 'Saptiya da?' },
  { word: 'Vaanga', tamil: 'வாங்க', transliteration: 'Vaanga', meaning_en: 'Come! (respectful)', meaning_hi: 'Aao (izzat se)', tone: 'Welcoming', example: 'Vaanga vaanga!' },
  { word: 'Eppadi', tamil: 'எப்படி', transliteration: 'Eppadi', meaning_en: 'How? / How are you?', meaning_hi: 'Kaise? / Kaisa hai?', tone: 'Conversational', example: 'Eppadi irukeenga?' },
  { word: 'Romba', tamil: 'ரொம்ப', transliteration: 'Romba', meaning_en: 'Very / Too much', meaning_hi: 'Bahut zyaada', tone: 'Intensifier', example: 'Romba nalla irukku.' },
  { word: 'Aama', tamil: 'ஆமா', transliteration: 'Aama', meaning_en: 'Yes / True', meaning_hi: 'Haan / Sahi', tone: 'Agreement', example: 'Aama da, correct!' },
]

const TONES = ['All', 'Learned', 'Friendly', 'Casual', 'Cool', 'Playful', 'Formal', 'Caring']

export default function SlangGuide() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [toneFilter, setToneFilter] = useState('All')
  const [expandedIdx, setExpandedIdx] = useState(null)
  const { speak } = useTTS()

  const learnedRaw = JSON.parse(localStorage.getItem('tanglish_learned') || '[]')
  // Merge: learned words take priority, dedupe hardcoded by Tamil word
  const learnedTamilSet = new Set(learnedRaw.map(l => l.tamil))
  const combined = [
    ...learnedRaw.map(l => ({ ...l, isLearned: true })),
    ...SLANG_DATA.filter(s => !learnedTamilSet.has(s.tamil)),
  ]

  const filtered = combined.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = !q || s.word.toLowerCase().includes(q) || s.meaning_en.toLowerCase().includes(q) || (s.meaning_hi || '').toLowerCase().includes(q)
    const matchTone = toneFilter === 'All'
      ? true
      : toneFilter === 'Learned'
        ? s.isLearned
        : s.tone.toLowerCase().includes(toneFilter.toLowerCase())
    return matchSearch && matchTone
  })

  return (
    <div className="min-h-screen bg-surface">
      <TopBar />
      <main className="pt-24 pb-32 px-4 max-w-2xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="font-headline font-black text-3xl text-on-surface mb-2">Slang Guide</h2>
            <p className="font-body text-on-surface-variant">
              {learnedRaw.length > 0
                ? `${learnedRaw.length} learned from your chats · ${SLANG_DATA.length} curated`
                : 'Your pocket dictionary of Chennai street language'}
            </p>
          </div>
          {learnedRaw.length > 0 && (
            <button
              onClick={() => { localStorage.removeItem('tanglish_learned'); window.location.reload() }}
              className="flex items-center gap-1 px-3 py-2 text-error text-sm font-label font-bold hover:bg-error-container/10 rounded-full transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-sm">delete</span> Clear learned
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search slang..."
            className="w-full pl-12 pr-4 py-3 bg-surface-container-low rounded-full font-body text-on-surface outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Tone filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {TONES.map(t => (
            <button
              key={t}
              onClick={() => setToneFilter(t)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full font-label text-xs font-bold uppercase tracking-widest transition-all ${
                toneFilter === t
                  ? 'bg-primary-container text-on-primary-container'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="space-y-3">
          {filtered.map((s, i) => (
            <div
              key={s.word}
              className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all"
              onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
            >
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${s.isLearned ? 'bg-tertiary-container' : 'bg-primary-container'}`}>
                    <span className={`font-headline font-black text-sm ${s.isLearned ? 'text-on-tertiary-container' : 'text-on-primary-container'}`}>{s.word[0]}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-headline font-bold text-on-surface">{s.word}</span>
                      <span className="font-body text-sm text-on-surface-variant">— {s.tamil}</span>
                      {s.isLearned && (
                        <span className="px-2 py-0.5 bg-tertiary-container text-on-tertiary-container rounded-full font-label text-[10px] font-bold uppercase tracking-wider">Learned</span>
                      )}
                    </div>
                    <span className="font-body text-xs text-on-surface-variant">{s.meaning_en}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); speak(s.tamil) }}
                    className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-primary-container hover:text-on-primary-container transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">volume_up</span>
                  </button>
                  <span className="material-symbols-outlined text-on-surface-variant text-sm">
                    {expandedIdx === i ? 'expand_less' : 'expand_more'}
                  </span>
                </div>
              </div>

              {expandedIdx === i && (
                <div className="px-5 pb-5 border-t border-surface-container space-y-3">
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="bg-tertiary-container/20 p-3 rounded-lg">
                      <span className="font-label text-xs text-on-tertiary-container font-bold uppercase tracking-widest block mb-1">English</span>
                      <p className="font-body text-sm">{s.meaning_en}</p>
                    </div>
                    <div className="bg-secondary-container/20 p-3 rounded-lg">
                      <span className="font-label text-xs text-on-secondary-container font-bold uppercase tracking-widest block mb-1">Hindi</span>
                      <p className="font-body text-sm">{s.meaning_hi}</p>
                    </div>
                  </div>
                  <div className="bg-surface-container p-3 rounded-lg">
                    <span className="font-label text-xs text-on-surface-variant font-bold uppercase tracking-widest block mb-1">Example</span>
                    <p className="font-body text-sm italic text-on-surface">"{s.example}"</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-surface-container rounded-full font-label text-xs font-bold text-on-surface-variant">{s.tone}</span>
                    <button
                      onClick={() => navigate('/chat')}
                      className="px-4 py-2 bg-primary-container text-on-primary-container rounded-full font-label text-xs font-bold flex items-center gap-1 hover:bg-primary-fixed-dim transition-all"
                    >
                      Practice <span className="material-symbols-outlined text-sm">mic</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">search_off</span>
            <p className="font-body text-on-surface-variant mt-2">No slang found. Try a different search.</p>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
