import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  LayoutDashboard,
  MessageSquare,
  FileText,
  FileSearch,
  BookOpen,
  Layers,
  Calendar,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants';
import { cn } from '@/utils/cn';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',  path: ROUTES.DASHBOARD,  id: 'nav-dashboard' },
  { icon: MessageSquare,   label: 'AI Chat',    path: ROUTES.CHAT,       id: 'nav-chat' },
  { icon: FileText,        label: 'Notes',      path: ROUTES.NOTES,      id: 'nav-notes' },
  { icon: FileSearch,      label: 'PDF',        path: ROUTES.PDF,        id: 'nav-pdf' },
  { icon: BookOpen,        label: 'Quiz',       path: ROUTES.QUIZ,       id: 'nav-quiz' },
  { icon: Layers,          label: 'Flashcards', path: ROUTES.FLASHCARDS, id: 'nav-flashcards' },
  { icon: Calendar,        label: 'Planner',    path: ROUTES.PLANNER,    id: 'nav-planner' },
  { icon: BarChart3,       label: 'Analytics',  path: ROUTES.ANALYTICS,  id: 'nav-analytics' },
] as const;

const BOTTOM_ITEMS = [
  { icon: Settings, label: 'Settings', path: ROUTES.SETTINGS, id: 'nav-settings' },
] as const;

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.HOME);
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Student';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative flex flex-col h-full bg-surface-900 border-r border-white/5 flex-shrink-0 overflow-hidden"
      id="app-sidebar"
    >
      {/* Header */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-white/5 flex-shrink-0',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <NavLink to={ROUTES.HOME} className="flex items-center gap-2 group" id="sidebar-logo">
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-glow-sm">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-white">
              Study<span className="gradient-text">OS</span>
            </span>
          </NavLink>
        )}

        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-glow-sm">
            <Brain className="w-4 h-4 text-white" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-6 h-6 rounded-lg flex items-center justify-center',
            'text-slate-500 hover:text-white hover:bg-white/10 transition-all',
            collapsed && 'absolute -right-3 top-5 bg-surface-900 border border-white/10 shadow-sm'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          id="sidebar-toggle"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 no-scrollbar">
        <div className="space-y-1">
          {NAV_ITEMS.map(({ icon: Icon, label, path, id }) => (
            <NavLink
              key={path}
              to={path}
              id={id}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative',
                collapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-brand-500/15 text-brand-300 border border-brand-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
              title={collapsed ? label : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn(
                    'flex-shrink-0 transition-colors',
                    collapsed ? 'w-5 h-5' : 'w-4 h-4',
                    isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'
                  )} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="overflow-hidden whitespace-nowrap"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-400 rounded-r-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bottom section */}
      <div className="px-2 pb-4 space-y-1 border-t border-white/5 pt-3">
        {BOTTOM_ITEMS.map(({ icon: Icon, label, path, id }) => (
          <NavLink
            key={path}
            to={path}
            id={id}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
              collapsed && 'justify-center',
              isActive ? 'bg-brand-500/15 text-brand-300' : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
            title={collapsed ? label : undefined}
          >
            <Icon className={cn('flex-shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {/* User profile */}
        <div className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/5 bg-white/3 mt-2',
          collapsed && 'justify-center'
        )}>
          <div className="w-7 h-7 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-2xs text-slate-500 truncate">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleSignOut}
              className="text-slate-500 hover:text-danger transition-colors"
              aria-label="Sign out"
              id="sidebar-signout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
