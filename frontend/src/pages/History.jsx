import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'

export default function History() {
  const navigate = useNavigate()

  const sessions = JSON.parse(localStorage.getItem('tanglish_history') || '[]')

  return (
    <div className="min-h-screen bg-surface">
      <TopBar />
      <main className="pt-24 pb-32 px-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-headline font-black text-3xl text-on-surface">History</h2>
            <p className="font-body text-on-surface-variant">Your past conversations</p>
          </div>
          {sessions.length > 0 && (
            <button
              onClick={() => { localStorage.removeItem('tanglish_history'); window.location.reload() }}
              className="flex items-center gap-1 px-3 py-2 text-error text-sm font-label font-bold hover:bg-error-container/10 rounded-full transition-all"
            >
              <span className="material-symbols-outlined text-sm">delete</span> Clear
            </button>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">history</span>
            </div>
            <h3 className="font-headline font-bold text-xl text-on-surface">No conversations yet</h3>
            <p className="font-body text-on-surface-variant">Start chatting to see your history here</p>
            <button
              onClick={() => navigate('/chat')}
              className="px-6 py-3 bg-primary-container text-on-primary-container rounded-full font-headline font-bold hover:bg-primary-fixed-dim transition-all"
            >
              Start a Conversation
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, i) => (
              <div key={i} className="bg-surface-container-lowest rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <span className="font-label text-xs text-on-surface-variant font-bold uppercase tracking-widest">
                    {new Date(session.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded-full font-label text-xs font-bold">
                    {session.count} turns
                  </span>
                </div>
                <p className="font-body text-sm text-on-surface-variant italic">"{session.preview}"</p>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
