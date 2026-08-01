import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Search, Brain, Menu, X, LayoutDashboard, MessageSquare,
  FileText, FileSearch, BookOpen, Layers, Calendar, BarChart3, Settings, LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants';
import { cn } from '@/utils/cn';

const MOBILE_NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Home', path: ROUTES.DASHBOARD },
  { icon: MessageSquare, label: 'Chat', path: ROUTES.CHAT },
  { icon: FileText, label: 'Notes', path: ROUTES.NOTES },
  { icon: FileSearch, label: 'PDF', path: ROUTES.PDF },
  { icon: BookOpen, label: 'Quiz', path: ROUTES.QUIZ },
  { icon: Layers, label: 'Cards', path: ROUTES.FLASHCARDS },
  { icon: Calendar, label: 'Planner', path: ROUTES.PLANNER },
];

const ALL_NAV_ITEMS = [
  ...MOBILE_NAV_ITEMS,
  { icon: BarChart3, label: 'Analytics', path: ROUTES.ANALYTICS },
  { icon: Settings, label: 'Settings', path: ROUTES.SETTINGS },
];

export function AppNavbar() {
  const { profile, user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Student';

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
    'Good evening';

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await signOut();
    navigate(ROUTES.HOME);
  };

  return (
    <>
      {/* Top Header */}
      <header
        className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-white/5 bg-surface-900/50 backdrop-blur-sm flex-shrink-0 z-30"
        id="app-navbar"
      >
        {/* Left: Mobile Logo & Desktop Greeting */}
        <div className="flex items-center gap-3">
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <NavLink to={ROUTES.HOME} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center shadow-glow-sm">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-base text-white">
                Study<span className="gradient-text">OS</span>
              </span>
            </NavLink>
          </div>

          {/* Desktop Greeting */}
          <div className="hidden md:block">
            <p className="text-sm text-slate-400">
              {greeting}, <span className="text-white font-semibold">{displayName.split(' ')[0]}</span> 👋
            </p>
          </div>
        </div>

        {/* Right: Search + Notifications */}
        <div className="flex items-center gap-2 sm:gap-3">
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
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full border-2 border-surface-900" />
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-900/95 backdrop-blur-md border-t border-white/5 px-2 py-1 flex items-center justify-around">
        {MOBILE_NAV_ITEMS.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => cn(
              'flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-2xs transition-all flex-1',
              isActive ? 'text-brand-400 font-semibold bg-brand-500/10' : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <Icon className="w-4 h-4 mb-0.5" />
            <span className="truncate max-w-[48px] text-[10px]">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-72 h-full bg-surface-900 border-r border-white/5 p-5 flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-glow-sm">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-display font-bold text-lg text-white">
                      Study<span className="gradient-text">OS</span>
                    </span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  {ALL_NAV_ITEMS.map(({ icon: Icon, label, path }) => (
                    <NavLink
                      key={path}
                      to={path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) => cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                        isActive ? 'bg-brand-500/15 text-brand-300 border border-brand-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
                      )}
                    >
                      <Icon className="w-4 h-4 text-brand-400" />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {displayName[0]?.toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                    <p className="text-2xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                </div>
                <button onClick={handleSignOut} className="p-2 text-slate-400 hover:text-danger">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
