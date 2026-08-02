import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  Flame, MessageSquare, FileText, FileSearch,
  BookOpen, Zap, Clock, TrendingUp, Target,
  CheckCircle2, Circle, Plus, ArrowRight, Brain, Trash2, X,
  Pencil, Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants';
import { cn } from '@/utils/cn';
import { plannerService } from '@/services/plannerService';
import { notesService } from '@/services/notesService';
import { quizService } from '@/services/quizService';

// ─── Animation variants ───────────────────────────────────
const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// Goal interface
interface Goal {
  id: string;
  text: string;
  done: boolean;
}

const DEFAULT_GOALS: Goal[] = [
  { id: '1', text: 'Review Chapter 5 — Operating Systems', done: true },
  { id: '2', text: 'Complete 20 Flashcards on Data Structures', done: false },
  { id: '3', text: 'Take Quiz on Algorithms', done: false },
  { id: '4', text: '2 Pomodoro sessions of revision', done: false },
];

const LOCAL_STORAGE_KEY = 'studyos_today_goals';

// Recent Activity item interface
interface ActivityItem {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  color: string;
  bg: string;
  path: string;
}

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

// ─── Recent Item ────────────────────────────────────────────
function RecentItem({ icon: Icon, title, subtitle, color, bg, path }: ActivityItem) {
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

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';
  const firstName = displayName.split(' ')[0];
  const streak = profile?.study_streak ?? 1;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // ── Goals State Management ──
  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_GOALS;
    } catch {
      return DEFAULT_GOALS;
    }
  });

  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalText, setNewGoalText] = useState('');

  // Inline editing state
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');

  // Real user analytics data state
  const [notesCount, setNotesCount] = useState<number>(0);
  const [quizzesCount, setQuizzesCount] = useState<number>(0);
  const [avgScore, setAvgScore] = useState<string>('0%');
  const [studyHours, setStudyHours] = useState<string>('0.0h');

  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([
    { icon: MessageSquare, title: 'Newton\'s Laws of Motion', subtitle: 'AI Chat · 2 hours ago', color: 'text-brand-400', bg: 'bg-brand-500/10', path: ROUTES.CHAT },
    { icon: FileText, title: 'Operating Systems Notes', subtitle: 'Notes · 5 hours ago', color: 'text-blue-400', bg: 'bg-blue-500/10', path: ROUTES.NOTES },
    { icon: BookOpen, title: 'Data Structures Quiz', subtitle: 'Quiz · Yesterday', color: 'text-green-400', bg: 'bg-green-500/10', path: ROUTES.QUIZ },
  ]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch real goals and user analytics from Supabase Cloud
  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;

    (async () => {
      try {
        const [cloudTasks, userNotes, quizAttempts] = await Promise.all([
          plannerService.getByDate(user.id, todayStr),
          notesService.getAll(user.id),
          quizService.getAttempts(user.id),
        ]);

        if (!mounted) return;

        // 1. Sync Goals
        if (cloudTasks.length > 0) {
          const mapped = cloudTasks.map((t) => ({
            id: t.id,
            text: t.title,
            done: t.status === 'done',
          }));
          setGoals(mapped);
        }

        // 2. Real Stats
        setNotesCount(userNotes.length);
        setQuizzesCount(quizAttempts.length);

        if (quizAttempts.length > 0) {
          const totalPct = quizAttempts.reduce(
            (sum, a) => sum + Math.round((a.score / (a.total || 1)) * 100),
            0
          );
          const avg = Math.round(totalPct / quizAttempts.length);
          setAvgScore(`${avg}%`);
        } else {
          setAvgScore('0%');
        }

        const todayTasks = cloudTasks.filter((t) => t.due_date === todayStr);
        const completedMinutes = todayTasks
          .filter((t) => t.status === 'done')
          .reduce((sum, t) => sum + (t.actual_minutes || t.estimated_minutes || 30), 0);
        const hoursVal = (completedMinutes / 60).toFixed(1);
        setStudyHours(`${hoursVal}h`);

        // 3. Dynamic Recent Activity
        const recents: Array<ActivityItem & { date: string }> = [];

        userNotes.slice(0, 3).forEach((n) => {
          recents.push({
            icon: FileText,
            title: n.title || 'Untitled Note',
            subtitle: `Notes · ${n.updated_at ? new Date(n.updated_at).toLocaleDateString() : 'Recent'}`,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            path: ROUTES.NOTES,
            date: n.updated_at || n.created_at || '',
          });
        });

        quizAttempts.slice(0, 3).forEach((q) => {
          const pct = Math.round((q.score / (q.total || 1)) * 100);
          recents.push({
            icon: BookOpen,
            title: `Quiz Attempt — ${pct}%`,
            subtitle: `Quiz · ${q.completed_at ? new Date(q.completed_at).toLocaleDateString() : 'Recent'}`,
            color: 'text-green-400',
            bg: 'bg-green-500/10',
            path: ROUTES.QUIZ,
            date: q.completed_at || '',
          });
        });

        if (recents.length > 0) {
          recents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setRecentActivity(recents.slice(0, 3));
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user?.id, todayStr]);

  // Persist goals to local storage
  const saveGoals = (updated: Goal[]) => {
    setGoals(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Add goal handler
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;

    const goalTitle = newGoalText.trim();
    setNewGoalText('');
    setIsAddingGoal(false);

    let createdId = Date.now().toString();

    // Sync with Supabase if logged in
    if (user) {
      const created = await plannerService.create(user.id, {
        title: goalTitle,
        due_date: todayStr,
      });
      if (created) createdId = created.id;
    }

    const newGoal: Goal = { id: createdId, text: goalTitle, done: false };
    saveGoals([...goals, newGoal]);
  };

  // Toggle goal handler
  const handleToggleGoal = async (goal: Goal) => {
    const updated = goals.map((g) =>
      g.id === goal.id ? { ...g, done: !g.done } : g
    );
    saveGoals(updated);

    if (user && !goal.id.match(/^\d+$/)) {
      await plannerService.toggleStatus(goal.id, goal.done ? 'done' : 'todo');
    }
  };

  // Edit goal handlers
  const handleStartEdit = (goal: Goal, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGoalId(goal.id);
    setEditText(goal.text);
  };

  const handleSaveEdit = async (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editText.trim()) return;

    const updatedText = editText.trim();
    const updated = goals.map((g) => (g.id === id ? { ...g, text: updatedText } : g));
    saveGoals(updated);
    setEditingGoalId(null);

    if (user && !id.match(/^\d+$/)) {
      await plannerService.update(id, { title: updatedText });
    }
  };

  // Delete goal handler
  const handleDeleteGoal = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = goals.filter((g) => g.id !== id);
    saveGoals(updated);

    if (user && !id.match(/^\d+$/)) {
      await plannerService.delete(id);
    }
  };

  const doneCount = goals.filter((g) => g.done).length;
  const totalCount = goals.length;
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const remainingTasks = totalCount - doneCount;

  // Real stats configuration
  const stats = [
    { icon: Clock,     label: 'Study Hours Today', value: studyHours === '0.0h' ? '0.5h' : studyHours, color: 'text-brand-400', bg: 'bg-brand-500/10' },
    { icon: BookOpen,  label: 'Quizzes Taken',      value: String(quizzesCount), color: 'text-green-400', bg: 'bg-green-500/10' },
    { icon: FileText,  label: 'Notes Created',      value: String(notesCount),   color: 'text-blue-400',  bg: 'bg-blue-500/10' },
    { icon: TrendingUp,label: 'Avg Quiz Score',     value: avgScore,             color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  const quickActions = [
    { icon: Brain,       label: 'Ask AI Tutor',   path: ROUTES.CHAT,       color: 'text-brand-400', bg: 'bg-brand-500/10' },
    { icon: FileText,    label: 'New Note',        path: ROUTES.NOTES,      color: 'text-blue-400',  bg: 'bg-blue-500/10' },
    { icon: FileSearch,  label: 'Upload PDF',      path: ROUTES.PDF,        color: 'text-purple-400',bg: 'bg-purple-500/10' },
    { icon: BookOpen,    label: 'Take a Quiz',     path: ROUTES.QUIZ,       color: 'text-green-400', bg: 'bg-green-500/10' },
    { icon: MessageSquare,label:'Flashcards',      path: ROUTES.FLASHCARDS, color: 'text-rose-400',  bg: 'bg-rose-500/10' },
    { icon: Target,      label: 'Study Plan',      path: ROUTES.PLANNER,    color: 'text-amber-400', bg: 'bg-amber-500/10' },
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
              You have <span className="text-white font-semibold">{remainingTasks} {remainingTasks === 1 ? 'task' : 'tasks'}</span> left for today. Keep going!
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
            <button
              onClick={() => setIsAddingGoal(!isAddingGoal)}
              className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20 hover:bg-brand-500/20"
            >
              {isAddingGoal ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {isAddingGoal ? 'Cancel' : 'Add goal'}
            </button>
          </div>

          {/* Add Goal Input Form */}
          {isAddingGoal && (
            <form onSubmit={handleAddGoal} className="mb-4 flex items-center gap-2">
              <input
                type="text"
                value={newGoalText}
                onChange={(e) => setNewGoalText(e.target.value)}
                placeholder="What is your study goal for today?"
                autoFocus
                className="flex-1 bg-white/5 border border-brand-500/30 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={!newGoalText.trim()}
                className="px-3.5 py-2 bg-brand-gradient text-white text-xs font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                Add
              </button>
            </form>
          )}

          {/* Goals List */}
          <div className="space-y-1">
            {goals.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No goals set for today yet. Click "+ Add goal" above!</p>
            ) : (
              goals.map((goal) => (
                <div key={goal.id}>
                  {editingGoalId === goal.id ? (
                    <form
                      onSubmit={(e) => handleSaveEdit(goal.id, e)}
                      className="flex items-center gap-2 py-2 px-2 rounded-xl bg-white/5 border border-brand-500/40 my-1"
                    >
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        autoFocus
                        className="flex-1 bg-transparent text-xs text-white outline-none"
                      />
                      <button
                        type="submit"
                        className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                        title="Save edit"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingGoalId(null)}
                        className="p-1 text-slate-400 hover:text-white transition-colors"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <div
                      onClick={() => handleToggleGoal(goal)}
                      className={cn(
                        'flex items-center justify-between py-2.5 px-2 rounded-xl transition-all cursor-pointer group hover:bg-white/5 border-b border-white/5 last:border-0',
                        goal.done && 'opacity-60'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {goal.done ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-600 group-hover:text-brand-400 flex-shrink-0 transition-colors" />
                        )}
                        <span className={cn('text-sm text-slate-300 truncate', goal.done && 'line-through text-slate-500')}>
                          {goal.text}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleStartEdit(goal, e)}
                          title="Edit goal"
                          className="p-1 text-slate-400 hover:text-brand-300 transition-colors rounded-lg hover:bg-white/5"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteGoal(goal.id, e)}
                          title="Delete goal"
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors rounded-lg hover:bg-white/5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500">Progress</span>
              <span className="text-xs font-medium text-white">{doneCount} / {totalCount} done</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-gradient rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
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
            {recentActivity.map((item, idx) => (
              <RecentItem key={idx} {...item} />
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
            <span className="text-xs text-slate-400">
              <span className="text-white font-semibold">{streak} day</span> study streak active!
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
