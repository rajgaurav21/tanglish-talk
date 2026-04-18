import { useNavigate, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', icon: 'home', label: 'Home' },
  { path: '/chat', icon: 'mic', label: 'Chat' },
  { path: '/history', icon: 'history', label: 'History' },
  { path: '/guide', icon: 'menu_book', label: 'Guide' },
]

export default function BottomNav({ hasFab = false }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface/80 glass-nav rounded-t-[3rem] shadow-[0_-4px_40px_rgba(46,47,47,0.06)] flex justify-around items-center px-6 pb-8 pt-4">
      {navItems.map(({ path, icon, label }) => {
        const active = pathname === path
        if (hasFab && label === 'Chat') {
          return <div key={path} className="w-20" />
        }
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center justify-center rounded-full px-4 py-2 transition-all active:scale-90 ${
              active
                ? 'bg-orange-100 text-orange-900'
                : 'text-on-surface-variant hover:bg-surface-container-high/50'
            }`}
          >
            <span className={`material-symbols-outlined ${active ? 'icon-fill' : ''}`}>{icon}</span>
            <span className="font-label text-[10px] uppercase tracking-widest font-bold mt-0.5">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
