import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <TopBar />

      <main className="pt-24 pb-32 px-6 max-w-4xl mx-auto">
        {/* Hero */}
        <section className="flex flex-col items-start gap-8 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-container text-on-secondary-container rounded-full">
            <span className="material-symbols-outlined text-sm icon-fill">auto_awesome</span>
            <span className="font-label text-xs font-bold tracking-widest uppercase">AI Language Coach</span>
          </div>
          <h2 className="font-headline font-extrabold text-5xl leading-[1.1] text-on-surface">
            Level up your <span className="text-brand-gradient">Nanba</span> vibes.
          </h2>
          <p className="font-body text-lg text-on-surface-variant max-w-lg leading-relaxed">
            Master <span className="bg-tertiary-container px-2 py-0.5 rounded text-on-tertiary-container font-semibold">Chennai slang</span> through real-time AI conversation. Bridge Hindi, English, and Tamil with flair.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/chat')}
              className="bg-primary-container text-on-primary-container font-headline font-bold px-8 py-4 rounded-full flex items-center justify-center gap-3 hover:bg-primary-fixed-dim transition-all duration-300 active:scale-95 shadow-lg"
            >
              Start Chatting
              <span className="material-symbols-outlined">forum</span>
            </button>
            <button
              onClick={() => navigate('/guide')}
              className="bg-surface-container-lowest text-on-surface font-headline font-bold px-8 py-4 rounded-full flex items-center justify-center gap-3 hover:bg-surface-container-high transition-all duration-300"
            >
              Explore Slang
              <span className="material-symbols-outlined">menu_book</span>
            </button>
          </div>
        </section>

        {/* Feature bento grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          <div className="md:col-span-2 bg-surface-container-low p-8 rounded-xl flex flex-col justify-between">
            <div>
              <span className="material-symbols-outlined text-4xl text-primary mb-4 block">translate</span>
              <h3 className="font-headline font-bold text-2xl mb-3">The Trilingual Bridge</h3>
              <p className="font-body text-on-surface-variant">Seamlessly switch between Hindi, English, and Tamil. Our AI understands your mother tongue to teach the most authentic local phrases.</p>
            </div>
            <div className="mt-6 flex -space-x-3">
              {['हि', 'En', 'த'].map((l, i) => (
                <div key={i} className={`w-11 h-11 rounded-full border-4 border-surface-container-low flex items-center justify-center font-bold text-sm ${
                  i === 0 ? 'bg-secondary-container' : i === 1 ? 'bg-tertiary-container' : 'bg-primary-container'
                }`}>{l}</div>
              ))}
            </div>
          </div>

          <div className="bg-secondary-container p-8 rounded-xl text-on-secondary-container flex flex-col items-center text-center justify-center gap-4">
            <div className="w-16 h-16 bg-on-secondary-container rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary-container text-3xl icon-fill">bolt</span>
            </div>
            <h3 className="font-headline font-bold text-xl">Voice First</h3>
            <p className="font-body text-sm opacity-80">Speak in Hindi or English, hear responses in authentic Chennai Tamil.</p>
          </div>

          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border-b-4 border-primary">
            <span className="material-symbols-outlined text-primary text-4xl mb-3 block">history_edu</span>
            <h3 className="font-headline font-bold text-lg mb-2">Cultural Nuances</h3>
            <p className="font-body text-sm text-on-surface-variant">Learn why "Vanakkan" means more than just hello in street contexts.</p>
          </div>

          <div className="bg-surface-container-low p-8 rounded-xl flex flex-col justify-center">
            <span className="material-symbols-outlined text-tertiary text-4xl mb-3 block">psychology</span>
            <h3 className="font-headline font-bold text-lg mb-2">Smart Memory</h3>
            <p className="font-body text-sm text-on-surface-variant">Context-aware AI remembers your conversation for natural flow.</p>
          </div>

          <div className="bg-on-surface text-surface p-8 rounded-xl flex flex-col justify-between">
            <h3 className="font-headline font-bold text-xl">Ready to talk like a local?</h3>
            <button
              onClick={() => navigate('/chat')}
              className="mt-4 bg-primary text-on-primary px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-primary-dim transition-colors w-fit"
            >
              Start Now
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </section>

        {/* Sample audio card */}
        <section className="bg-surface-container-highest/30 p-10 rounded-xl border-dashed border-2 border-outline-variant/30 flex flex-col items-center text-center gap-6">
          <h3 className="font-headline font-bold text-2xl">Listen &amp; Repeat</h3>
          <p className="font-body text-on-surface-variant">Tap the mic below to start your first Tanglish conversation</p>
          <button
            onClick={() => navigate('/chat')}
            className="w-20 h-20 bg-gradient-to-br from-primary-container to-primary-fixed-dim rounded-full flex items-center justify-center text-on-primary-container shadow-2xl hover:scale-105 transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined text-4xl icon-fill">mic</span>
          </button>
          <p className="font-label text-xs text-on-surface-variant font-bold uppercase tracking-widest">Tap to speak</p>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
