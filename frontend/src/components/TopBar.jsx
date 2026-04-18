export default function TopBar({ showXP = false }) {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 glass-nav flex justify-between items-center px-6 py-4">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-orange-600 p-2 hover:bg-surface-container-high/50 rounded-full cursor-pointer">menu</span>
        <h1 className="font-headline font-black text-2xl tracking-tight bg-gradient-to-r from-orange-700 to-orange-400 bg-clip-text text-transparent">
          Tanglish Talk
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {showXP && (
          <div className="hidden md:flex flex-col items-end mr-1">
            <span className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Level 4</span>
            <span className="font-label text-xs font-bold text-orange-600">1,240 XP</span>
          </div>
        )}
        <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary-container">person</span>
        </div>
      </div>
    </header>
  )
}
