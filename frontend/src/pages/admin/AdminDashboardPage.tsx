import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, LayoutDashboard, Users, BookOpen, Zap,
  Settings, LogOut, RefreshCw, ArrowLeft,
  FileText, FileSearch, Layers, MessageSquare,
  Calendar, TrendingUp, Activity, Shield,
  ChevronLeft, ChevronRight, Flame, Cpu,
  Circle, CheckCircle2, Clock, BarChart3,
} from 'lucide-react';
import { rawFrom, supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants';
import { cn } from '@/utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PlatformStats {
  totalUsers: number;
  totalNotes: number;
  aiEnhancedNotes: number;
  totalPDFs: number;
  totalQuizzes: number;
  totalFlashcards: number;
  masteredFlashcards: number;
  totalChatSessions: number;
  totalPlannerTasks: number;
  avgStreak: number;
}

interface UserRow {
  id: string;
  full_name: string | null;
  school: string | null;
  study_streak: number;
  role: string;
  created_at: string;
  email?: string;
}

interface RecentActivity {
  type: 'note' | 'quiz' | 'chat' | 'pdf' | 'flashcard' | 'task';
  title: string;
  created_at: string;
  user_id: string;
}

type Tab = 'overview' | 'users' | 'content' | 'activity' | 'system';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function initials(name: string | null, email?: string) {
  const src = name || email?.split('@')[0] || '?';
  return src.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ to }: { to: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (to === 0) { setVal(0); return; }
    let frame = 0;
    const total = 40;
    const timer = setInterval(() => {
      frame++;
      setVal(Math.round((frame / total) * to));
      if (frame >= total) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [to]);
  return <>{val.toLocaleString()}</>;
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub, iconBg, iconColor, delay = 0,
}: {
  icon: React.ElementType; label: string; value: number; sub: string;
  iconBg: string; iconColor: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      className="glass rounded-2xl p-5 border border-white/6 flex items-center gap-4 hover:border-white/10 transition-colors"
    >
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
        <Icon className={cn('w-5 h-5', iconColor)} />
      </div>
      <div>
        <p className="text-2xl font-black text-white leading-none mb-1">
          <AnimatedCounter to={value} />
        </p>
        <p className="text-xs font-semibold text-slate-300">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
      </div>
    </motion.div>
  );
}

// ─── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ stats }: { stats: PlatformStats }) {
  const cards = [
    { icon: Users,        label: 'Total Users',     value: stats.totalUsers,        sub: 'Registered accounts',         iconBg: 'bg-brand-500/15', iconColor: 'text-brand-400' },
    { icon: FileText,     label: 'Notes',           value: stats.totalNotes,        sub: `${stats.aiEnhancedNotes} AI-enhanced`, iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400' },
    { icon: FileSearch,   label: 'PDFs Uploaded',   value: stats.totalPDFs,         sub: 'Processed documents',         iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400' },
    { icon: BookOpen,     label: 'Quizzes',         value: stats.totalQuizzes,      sub: 'Generated quizzes',           iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400' },
    { icon: Layers,       label: 'Flashcards',      value: stats.totalFlashcards,   sub: `${stats.masteredFlashcards} mastered`, iconBg: 'bg-pink-500/15', iconColor: 'text-pink-400' },
    { icon: MessageSquare,label: 'Chat Sessions',   value: stats.totalChatSessions, sub: 'AI tutor conversations',      iconBg: 'bg-teal-500/15', iconColor: 'text-teal-400' },
    { icon: Calendar,     label: 'Planner Tasks',   value: stats.totalPlannerTasks, sub: 'Study tasks created',         iconBg: 'bg-violet-500/15', iconColor: 'text-violet-400' },
    { icon: Flame,        label: 'Avg Streak',      value: stats.avgStreak,         sub: 'Days across all users',       iconBg: 'bg-orange-500/15', iconColor: 'text-orange-400' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c, i) => <StatCard key={c.label} {...c} delay={i * 0.05} />)}
      </div>

      {/* Ratio cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            label: 'AI-Enhanced Notes',
            pct: stats.totalNotes > 0 ? Math.round((stats.aiEnhancedNotes / stats.totalNotes) * 100) : 0,
            color: 'text-emerald-400', bar: 'bg-emerald-500',
            sub: `${stats.aiEnhancedNotes} of ${stats.totalNotes} notes`,
          },
          {
            label: 'Flashcard Mastery',
            pct: stats.totalFlashcards > 0 ? Math.round((stats.masteredFlashcards / stats.totalFlashcards) * 100) : 0,
            color: 'text-pink-400', bar: 'bg-pink-500',
            sub: `${stats.masteredFlashcards} of ${stats.totalFlashcards} mastered`,
          },
          {
            label: 'Content Per User',
            pct: null,
            value: stats.totalUsers > 0
              ? Math.round((stats.totalNotes + stats.totalQuizzes + stats.totalFlashcards) / stats.totalUsers)
              : 0,
            color: 'text-brand-400', bar: 'bg-brand-500',
            sub: 'avg items per user',
          },
        ].map((r, i) => (
          <motion.div
            key={r.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 + i * 0.07, duration: 0.35 }}
            className="glass rounded-2xl p-5 border border-white/6"
          >
            <p className="text-xs text-slate-500 mb-2">{r.label}</p>
            <p className={cn('text-4xl font-black mb-1', r.color)}>
              {r.pct !== null ? <><AnimatedCounter to={r.pct} />%</> : <AnimatedCounter to={r.value!} />}
            </p>
            <p className="text-xs text-slate-500 mb-3">{r.sub}</p>
            {r.pct !== null && (
              <div className="h-1 rounded-full bg-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${r.pct}%` }}
                  transition={{ delay: 0.6 + i * 0.07, duration: 0.8, ease: 'easeOut' }}
                  className={cn('h-full rounded-full', r.bar)}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab({ users }: { users: UserRow[] }) {
  const [search, setSearch] = useState('');
  const filtered = users.filter(u =>
    !search ||
    (u.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <span className="text-white font-semibold">{filtered.length}</span> of{' '}
          <span className="text-white font-semibold">{users.length}</span> users
        </p>
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-brand-500/50 transition-colors w-64"
        />
      </div>

      <div className="glass rounded-2xl border border-white/6 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {['User', 'Email', 'School', 'Streak', 'Role', 'Joined'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((u, i) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                  className="border-b border-white/4 hover:bg-white/3 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {initials(u.full_name, u.email)}
                      </div>
                      <span className="text-sm font-medium text-white">{u.full_name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-400 font-mono">{u.email ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-400">{u.school || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-orange-400">🔥 {u.study_streak}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
                      u.role === 'admin'
                        ? 'bg-brand-500/15 text-brand-400 border border-brand-500/25'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    )}>
                      {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                      {u.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-500">{formatDate(u.created_at)}</span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500 text-sm">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Content Tab ───────────────────────────────────────────────────────────────
function ContentTab({ stats }: { stats: PlatformStats }) {
  const sections = [
    {
      icon: FileText, title: 'Notes', color: 'text-emerald-400', iconBg: 'bg-emerald-500/15',
      rows: [
        { label: 'Total Notes', value: stats.totalNotes },
        { label: 'AI-Enhanced', value: stats.aiEnhancedNotes },
        { label: 'Regular', value: stats.totalNotes - stats.aiEnhancedNotes },
      ],
    },
    {
      icon: Layers, title: 'Flashcards', color: 'text-pink-400', iconBg: 'bg-pink-500/15',
      rows: [
        { label: 'Total Cards', value: stats.totalFlashcards },
        { label: 'Mastered', value: stats.masteredFlashcards },
        { label: 'In Progress', value: stats.totalFlashcards - stats.masteredFlashcards },
      ],
    },
    {
      icon: BookOpen, title: 'Quizzes', color: 'text-amber-400', iconBg: 'bg-amber-500/15',
      rows: [
        { label: 'Total Quizzes', value: stats.totalQuizzes },
        { label: 'Per User (avg)', value: stats.totalUsers > 0 ? +(stats.totalQuizzes / stats.totalUsers).toFixed(1) : 0 },
      ],
    },
    {
      icon: FileSearch, title: 'PDFs', color: 'text-blue-400', iconBg: 'bg-blue-500/15',
      rows: [
        { label: 'Total PDFs', value: stats.totalPDFs },
        { label: 'Per User (avg)', value: stats.totalUsers > 0 ? +(stats.totalPDFs / stats.totalUsers).toFixed(1) : 0 },
      ],
    },
    {
      icon: MessageSquare, title: 'Chat Sessions', color: 'text-teal-400', iconBg: 'bg-teal-500/15',
      rows: [
        { label: 'Total Sessions', value: stats.totalChatSessions },
        { label: 'Per User (avg)', value: stats.totalUsers > 0 ? +(stats.totalChatSessions / stats.totalUsers).toFixed(1) : 0 },
      ],
    },
    {
      icon: Calendar, title: 'Planner Tasks', color: 'text-violet-400', iconBg: 'bg-violet-500/15',
      rows: [
        { label: 'Total Tasks', value: stats.totalPlannerTasks },
        { label: 'Per User (avg)', value: stats.totalUsers > 0 ? +(stats.totalPlannerTasks / stats.totalUsers).toFixed(1) : 0 },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sections.map((s, i) => (
        <motion.div
          key={s.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="glass rounded-2xl border border-white/6 p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', s.iconBg)}>
              <s.icon className={cn('w-4 h-4', s.color)} />
            </div>
            <h3 className={cn('font-bold text-sm', s.color)}>{s.title}</h3>
          </div>
          <div className="space-y-3">
            {s.rows.map(r => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{r.label}</span>
                <span className="text-base font-black text-white">{r.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 h-px bg-white/5" />
          <div className="mt-3 h-1 rounded-full bg-white/5">
            <div className={cn('h-full rounded-full opacity-60', s.color.replace('text-', 'bg-'))} style={{ width: '100%' }} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Activity Tab ──────────────────────────────────────────────────────────────
const activityMeta = {
  note:      { icon: FileText,      label: 'Note created',   color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  quiz:      { icon: BookOpen,      label: 'Quiz created',   color: 'text-amber-400',  bg: 'bg-amber-500/15' },
  chat:      { icon: MessageSquare, label: 'Chat started',   color: 'text-teal-400',   bg: 'bg-teal-500/15' },
  pdf:       { icon: FileSearch,    label: 'PDF uploaded',   color: 'text-blue-400',   bg: 'bg-blue-500/15' },
  flashcard: { icon: Layers,        label: 'Card created',   color: 'text-pink-400',   bg: 'bg-pink-500/15' },
  task:      { icon: Calendar,      label: 'Task added',     color: 'text-violet-400', bg: 'bg-violet-500/15' },
};

function ActivityTab({ activity }: { activity: RecentActivity[] }) {
  return (
    <div className="glass rounded-2xl border border-white/6 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white text-sm">Recent Platform Activity</h3>
          <p className="text-xs text-slate-500 mt-0.5">Last {activity.length} actions across all users</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Live
        </span>
      </div>
      <div className="max-h-[520px] overflow-y-auto">
        {activity.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-12">No recent activity</p>
        ) : (
          <AnimatePresence>
            {activity.map((item, i) => {
              const meta = activityMeta[item.type];
              const Icon = meta.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.025 }}
                  className="flex items-center gap-3 px-5 py-3.5 border-b border-white/4 hover:bg-white/3 transition-colors"
                >
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', meta.bg)}>
                    <Icon className={cn('w-4 h-4', meta.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      <span className={meta.color}>{meta.label}</span>
                      {' · '}user <span className="font-mono">{item.user_id.slice(0, 8)}…</span>
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0">{timeAgo(item.created_at)}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// ─── System Tab ────────────────────────────────────────────────────────────────
function SystemTab({ profile }: { profile: ReturnType<typeof useAuth>['profile'] }) {
  const rows = [
    { label: 'Admin User', value: profile?.full_name ?? '—' },
    { label: 'Admin Role', value: profile?.role ?? '—' },
    { label: 'Supabase URL', value: (import.meta.env.VITE_SUPABASE_URL as string) || 'Not configured' },
    { label: 'Auth Providers', value: 'Email + Google OAuth' },
    { label: 'Frontend', value: 'React + Vite + TypeScript' },
    { label: 'Styling', value: 'Tailwind CSS + Framer Motion' },
    { label: 'Database', value: 'Supabase (PostgreSQL)' },
    { label: 'Deployment', value: 'Vercel + studyos.dpdns.org' },
    { label: 'Session Status', value: 'Active ✓' },
    { label: 'Local Time', value: new Date().toLocaleString() },
  ];

  return (
    <div className="glass rounded-2xl border border-white/6 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5">
        <h3 className="font-bold text-white text-sm">System Information</h3>
        <p className="text-xs text-slate-500 mt-0.5">Platform configuration & environment</p>
      </div>
      {rows.map((r, i) => (
        <motion.div
          key={r.label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.04 }}
          className="flex items-center justify-between px-5 py-3.5 border-b border-white/4 hover:bg-white/3 transition-colors"
        >
          <span className="text-sm text-slate-500">{r.label}</span>
          <code className="text-xs bg-white/5 border border-white/8 rounded-lg px-3 py-1 text-slate-300 max-w-xs truncate">
            {r.value}
          </code>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Main AdminDashboardPage ───────────────────────────────────────────────────
export function AdminDashboardPage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [
        { count: totalUsers },
        { count: totalNotes },
        { count: aiNotes },
        { count: totalPDFs },
        { count: totalQuizzes },
        { count: totalFlashcards },
        { count: masteredFC },
        { count: totalChats },
        { count: totalTasks },
        { data: profilesData },
        { data: recentNotes },
        { data: recentQuizzes },
        { data: recentChats },
        { data: recentPDFs },
        { data: recentTasks },
      ] = await Promise.all([
        rawFrom('profiles').select('*', { count: 'exact', head: true }),
        rawFrom('notes').select('*', { count: 'exact', head: true }),
        rawFrom('notes').select('*', { count: 'exact', head: true }).eq('is_ai_enhanced', true),
        rawFrom('pdf_documents').select('*', { count: 'exact', head: true }),
        rawFrom('quizzes').select('*', { count: 'exact', head: true }),
        rawFrom('flashcards').select('*', { count: 'exact', head: true }),
        rawFrom('flashcards').select('*', { count: 'exact', head: true }).eq('status', 'mastered'),
        rawFrom('chat_sessions').select('*', { count: 'exact', head: true }),
        rawFrom('planner_tasks').select('*', { count: 'exact', head: true }),
        rawFrom('profiles').select('id, full_name, school, study_streak, role, created_at').order('created_at', { ascending: false }),
        rawFrom('notes').select('title, created_at, user_id').order('created_at', { ascending: false }).limit(10),
        rawFrom('quizzes').select('title, created_at, user_id').order('created_at', { ascending: false }).limit(8),
        rawFrom('chat_sessions').select('title, created_at, user_id').order('created_at', { ascending: false }).limit(8),
        rawFrom('pdf_documents').select('name, uploaded_at, user_id').order('uploaded_at', { ascending: false }).limit(6),
        rawFrom('planner_tasks').select('title, created_at, user_id').order('created_at', { ascending: false }).limit(6),
      ]);

      const allProfiles = (profilesData ?? []) as UserRow[];
      const avgStreak = allProfiles.length > 0
        ? Math.round(allProfiles.reduce((s, p) => s + (p.study_streak || 0), 0) / allProfiles.length)
        : 0;

      setStats({
        totalUsers: totalUsers ?? 0,
        totalNotes: totalNotes ?? 0,
        aiEnhancedNotes: aiNotes ?? 0,
        totalPDFs: totalPDFs ?? 0,
        totalQuizzes: totalQuizzes ?? 0,
        totalFlashcards: totalFlashcards ?? 0,
        masteredFlashcards: masteredFC ?? 0,
        totalChatSessions: totalChats ?? 0,
        totalPlannerTasks: totalTasks ?? 0,
        avgStreak,
      });

      setUsers(allProfiles);

      const merged: RecentActivity[] = [
        ...(recentNotes ?? []).map((n: any) => ({ type: 'note' as const, title: n.title, created_at: n.created_at, user_id: n.user_id })),
        ...(recentQuizzes ?? []).map((q: any) => ({ type: 'quiz' as const, title: q.title, created_at: q.created_at, user_id: q.user_id })),
        ...(recentChats ?? []).map((c: any) => ({ type: 'chat' as const, title: c.title || 'Chat session', created_at: c.created_at, user_id: c.user_id })),
        ...(recentPDFs ?? []).map((p: any) => ({ type: 'pdf' as const, title: p.name, created_at: p.uploaded_at, user_id: p.user_id })),
        ...(recentTasks ?? []).map((t: any) => ({ type: 'task' as const, title: t.title, created_at: t.created_at, user_id: t.user_id })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 30);
      setActivity(merged);
    } catch (err) {
      console.error('Admin load error:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => loadData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notes' }, () => loadData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quizzes' }, () => loadData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'flashcards' }, () => loadData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_sessions' }, () => loadData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pdf_documents' }, () => loadData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'planner_tasks' }, () => loadData())
      .subscribe();
    realtimeRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSignOut = async () => { await signOut(); navigate(ROUTES.HOME); };

  const displayName = profile?.full_name || 'Admin';
  const userInitials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  const navItems: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview',  label: 'Overview',  icon: LayoutDashboard },
    { id: 'users',     label: 'Users',     icon: Users,            badge: stats?.totalUsers },
    { id: 'content',   label: 'Content',   icon: BarChart3 },
    { id: 'activity',  label: 'Activity',  icon: Activity,         badge: activity.length },
    { id: 'system',    label: 'System',    icon: Cpu },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-950">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-brand-gradient flex items-center justify-center mx-auto shadow-glow">
            <Brain className="w-6 h-6 text-white animate-pulse" />
          </div>
          <p className="text-slate-400 text-sm">Loading admin panel…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-surface-950 overflow-hidden font-sans">
      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="relative flex flex-col h-full bg-surface-900 border-r border-white/5 flex-shrink-0 overflow-hidden"
      >
        {/* Header */}
        <div className={cn('flex items-center h-16 px-4 border-b border-white/5 flex-shrink-0', collapsed ? 'justify-center' : 'justify-between')}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-glow-sm">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg text-white">
                Study<span className="gradient-text">OS</span>
              </span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-glow-sm">
              <Brain className="w-4 h-4 text-white" />
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-slate-400"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Shield badge */}
        {!collapsed && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-brand-400">Admin Panel</span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  collapsed ? 'justify-center' : '',
                  active
                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="bg-white/10 text-slate-300 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {item.badge > 999 ? '999+' : item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle (when collapsed) */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="mx-2 mb-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-slate-400"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Footer */}
        <div className={cn('border-t border-white/5 p-3 space-y-2', collapsed ? 'flex flex-col items-center' : '')}>
          {!collapsed && (
            <div className="flex items-center gap-3 px-1">
              <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {userInitials}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                <p className="text-xs text-brand-400 flex items-center gap-1">
                  <Shield className="w-3 h-3" />Administrator
                </p>
              </div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors',
              collapsed ? 'justify-center w-full' : 'w-full'
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && 'Sign out'}
          </button>
        </div>
      </motion.aside>

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-surface-900 flex-shrink-0">
          <div>
            <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              {(() => { const item = navItems.find(n => n.id === activeTab); const Icon = item?.icon!; return <Icon className="w-5 h-5 text-brand-400" />; })()}
              {navItems.find(n => n.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-slate-500">StudyOS AI — Admin Control Panel</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Live indicator */}
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Realtime
            </span>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-slate-400 hover:text-white hover:bg-white/10 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
              Refresh
            </button>
            <button
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500/15 border border-brand-500/25 text-brand-400 hover:bg-brand-500/25 text-xs font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to App
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && stats && <OverviewTab stats={stats} />}
              {activeTab === 'users'    && <UsersTab users={users} />}
              {activeTab === 'content'  && stats && <ContentTab stats={stats} />}
              {activeTab === 'activity' && <ActivityTab activity={activity} />}
              {activeTab === 'system'   && <SystemTab profile={profile} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
