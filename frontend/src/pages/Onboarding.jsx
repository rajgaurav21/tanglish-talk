import { useNavigate } from 'react-router-dom'

export default function Onboarding() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-container text-on-secondary-container rounded-full">
          <span className="material-symbols-outlined text-sm icon-fill">auto_awesome</span>
          <span className="font-label text-xs font-bold tracking-widest uppercase">Welcome</span>
        </div>

        <div className="w-32 h-32 mx-auto bg-primary-container rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-6xl text-on-primary-container icon-fill">record_voice_over</span>
        </div>

        <div>
          <h1 className="font-headline font-black text-4xl text-on-surface mb-4">
            Vanakkam! <span className="text-brand-gradient">வணக்கம்!</span>
          </h1>
          <p className="font-body text-lg text-on-surface-variant leading-relaxed">
            Learn Chennai Tamil slang through real conversations. Speak Hindi or English, get authentic Tamil responses.
          </p>
        </div>

        <div className="space-y-4 text-left">
          {[
            { icon: 'mic', title: 'Speak freely', desc: 'Use Hindi, English, or mix both' },
            { icon: 'translate', title: 'Get Tamil slang', desc: 'Authentic Chennai street language' },
            { icon: 'volume_up', title: 'Hear it aloud', desc: 'Audio pronunciation included' },
          ].map(({ icon, title, desc }) => (
            <div key={icon} className="flex items-center gap-4 bg-surface-container-low p-4 rounded-xl">
              <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-on-primary-container">{icon}</span>
              </div>
              <div>
                <p className="font-headline font-bold text-on-surface">{title}</p>
                <p className="font-body text-sm text-on-surface-variant">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/chat')}
          className="w-full bg-primary-container text-on-primary-container font-headline font-bold py-5 rounded-full flex items-center justify-center gap-3 hover:bg-primary-fixed-dim transition-all active:scale-95 shadow-lg"
        >
          Start Talking
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>

        <button
          onClick={() => navigate('/')}
          className="font-body text-sm text-on-surface-variant underline"
        >
          Back to Home
        </button>
      </div>
    </div>
  )
}
