import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function AppNavbar() {
  const { profile, user } = useAuth();
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Student';

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
    'Good evening';

  return (
    <header
      className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-surface-900/50 backdrop-blur-sm flex-shrink-0"
      id="app-navbar"
    >
      {/* Left: Greeting */}
      <div>
        <p className="text-sm text-slate-400">
          {greeting}, <span className="text-white font-semibold">{displayName.split(' ')[0]}</span> 👋
        </p>
      </div>

      {/* Right: Search + Notifications */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-2 hover:border-white/15 transition-all cursor-pointer group" id="app-search">
          <Search className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
          <span className="text-sm text-slate-600 group-hover:text-slate-400 transition-colors">Search...</span>
          <kbd className="text-2xs text-slate-600 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">⌘K</kbd>
        </div>

        {/* Notifications */}
        <button
          className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all"
          aria-label="Notifications"
          id="app-notifications"
        >
          <Bell className="w-4 h-4" />
          {/* Unread dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full border-2 border-surface-900" />
        </button>
      </div>
    </header>
  );
}
