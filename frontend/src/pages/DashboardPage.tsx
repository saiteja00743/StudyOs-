import React from 'react';
import { motion, Variants } from 'framer-motion';

import {
  Flame, MessageSquare, FileText, FileSearch,
  BookOpen, Zap, Clock, TrendingUp, Target,
  CheckCircle2, Circle, Plus, ArrowRight, Brain,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants';
import { cn } from '@/utils/cn';

// ─── Animation variants ───────────────────────────────────
const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// ─── Stat Card ─────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, bg }: {
  icon: React.ElementType; label: string; value: string; color: string; bg: string;
}) {
  return (
    <motion.div
      variants={cardVariants}
      className="glass rounded-2xl p-5 border border-white/6 flex items-center gap-4"
    >
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── Quick Action Button ────────────────────────────────────
function QuickAction({ icon: Icon, label, path, color, bg }: {
  icon: React.ElementType; label: string; path: string; color: string; bg: string;
}) {
  return (
    <Link
      to={path}
      className="flex flex-col items-center gap-2 glass rounded-2xl p-4 border border-white/6 hover:border-brand-500/20 hover:scale-105 transition-all duration-200 group text-center"
    >
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <span className="text-xs font-medium text-slate-400 group-hover:text-white transition-colors leading-tight">{label}</span>
    </Link>
  );
}

// ─── Today's Goal Item ─────────────────────────────────────
function GoalItem({ text, done }: { text: string; done: boolean }) {
  return (
    <div className={cn(
      'flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0',
      done && 'opacity-50'
    )}>
      {done
        ? <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
        : <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" />
      }
      <span className={cn(
        'text-sm text-slate-300',
        done && 'line-through text-slate-500'
      )}>
        {text}
      </span>
    </div>
  );
}

// ─── Recent Item ────────────────────────────────────────────
function RecentItem({ icon: Icon, title, subtitle, color, bg, path }: {
  icon: React.ElementType; title: string; subtitle: string; color: string; bg: string; path: string;
}) {
  return (
    <Link
      to={path}
      className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0 group hover:bg-white/3 -mx-2 px-2 rounded-xl transition-colors"
    >
      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">{title}</p>
        <p className="text-2xs text-slate-500">{subtitle}</p>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
    </Link>
  );
}

// ─── Dashboard Page ────────────────────────────────────────
export function DashboardPage() {
  const { profile, user } = useAuth();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Student';
  const firstName = displayName.split(' ')[0];
  const streak = profile?.study_streak ?? 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Placeholder stats (will be real data in Sprint 6)
  const stats = [
    { icon: Clock,     label: 'Study Hours Today', value: '2.5h', color: 'text-brand-400', bg: 'bg-brand-500/10' },
    { icon: BookOpen,  label: 'Quizzes Taken',      value: '12',   color: 'text-green-400', bg: 'bg-green-500/10' },
    { icon: FileText,  label: 'Notes Created',      value: '24',   color: 'text-blue-400',  bg: 'bg-blue-500/10' },
    { icon: TrendingUp,label: 'Avg Quiz Score',     value: '84%',  color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  const quickActions = [
    { icon: Brain,       label: 'Ask AI Tutor',   path: ROUTES.CHAT,       color: 'text-brand-400', bg: 'bg-brand-500/10' },
    { icon: FileText,    label: 'New Note',        path: ROUTES.NOTES,      color: 'text-blue-400',  bg: 'bg-blue-500/10' },
    { icon: FileSearch,  label: 'Upload PDF',      path: ROUTES.PDF,        color: 'text-purple-400',bg: 'bg-purple-500/10' },
    { icon: BookOpen,    label: 'Take a Quiz',     path: ROUTES.QUIZ,       color: 'text-green-400', bg: 'bg-green-500/10' },
    { icon: MessageSquare,label:'Flashcards',      path: ROUTES.FLASHCARDS, color: 'text-rose-400',  bg: 'bg-rose-500/10' },
    { icon: Target,      label: 'Study Plan',      path: ROUTES.PLANNER,    color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  // Placeholder tasks (will be real Supabase data in Sprint 5)
  const todayGoals = [
    { text: 'Review Chapter 5 — Operating Systems', done: true },
    { text: 'Complete 20 Flashcards on Data Structures', done: false },
    { text: 'Take Quiz on Algorithms', done: false },
    { text: '2 Pomodoro sessions of revision', done: false },
  ];

  // Placeholder recent items
  const recentItems = [
    { icon: MessageSquare, title: 'Newton\'s Laws of Motion', subtitle: 'AI Chat · 2 hours ago', color: 'text-brand-400', bg: 'bg-brand-500/10', path: ROUTES.CHAT },
    { icon: FileText, title: 'Operating Systems Notes', subtitle: 'Notes · 5 hours ago', color: 'text-blue-400', bg: 'bg-blue-500/10', path: ROUTES.NOTES },
    { icon: BookOpen, title: 'Data Structures Quiz — 84%', subtitle: 'Quiz · Yesterday', color: 'text-green-400', bg: 'bg-green-500/10', path: ROUTES.QUIZ },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-6"
      id="dashboard"
    >
      {/* Welcome Banner */}
      <motion.div
        variants={cardVariants}
        className="relative rounded-3xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-brand-gradient opacity-90" />
        <div className="absolute inset-0 dot-pattern opacity-20" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />

        <div className="relative z-10 flex items-center justify-between p-6 sm:p-8">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">{greeting} 👋</p>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-white mb-2">
              {firstName}, ready to learn?
            </h1>
            <p className="text-white/60 text-sm">
              You have <span className="text-white font-semibold">3 tasks</span> left for today. Keep going!
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-center bg-white/15 rounded-2xl px-5 py-4 border border-white/20 text-center">
            <Flame className="w-8 h-8 text-amber-300 mb-1" />
            <span className="text-2xl font-black text-white">{streak}</span>
            <span className="text-xs text-white/60">day streak</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div variants={cardVariants} className="glass rounded-2xl p-6 border border-white/6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-brand-400" />
            Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickActions.map((a) => (
            <QuickAction key={a.label} {...a} />
          ))}
        </div>
      </motion.div>

      {/* Bottom row: Goals + Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Goals */}
        <motion.div variants={cardVariants} className="glass rounded-2xl p-6 border border-white/6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              Today's Goals
            </h2>
            <button className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add goal
            </button>
          </div>
          <div>
            {todayGoals.map((goal) => (
              <GoalItem key={goal.text} {...goal} />
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500">Progress</span>
              <span className="text-xs font-medium text-white">1 / 4 done</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full w-1/4 bg-brand-gradient rounded-full" />
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={cardVariants} className="glass rounded-2xl p-6 border border-white/6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Recent Activity
            </h2>
            <Link to={ROUTES.ANALYTICS} className="text-xs text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div>
            {recentItems.map((item) => (
              <RecentItem key={item.title} {...item} />
            ))}
          </div>

          {/* Study streak mini card */}
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-3">
            <div className="flex gap-1">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-4 h-4 rounded-sm',
                    i < (streak % 7) || streak >= 7 ? 'bg-brand-500' : 'bg-white/10'
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-slate-500">
              {streak > 0 ? `${streak} day streak 🔥` : 'Start your streak today!'}
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
