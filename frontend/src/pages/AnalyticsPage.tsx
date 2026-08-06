import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Brain, BookOpen, Layers, Target,
  Calendar, Flame, Clock, Zap, Award, Activity, ChevronUp,
  ChevronDown, FileText, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { quizService } from '@/services/quizService';
import { flashcardService } from '@/services/flashcardService';
import { notesService } from '@/services/notesService';
import { plannerService } from '@/services/plannerService';
import { useAuth } from '@/hooks/useAuth';
import { Note } from '@/types/notes';
import { Flashcard, PlannerTask, QuizAttempt } from '@/types/study';

// ─── Mini Bar Chart (Glowing Capsules + Tooltips) ───────────────
function BarChart({
  data,
  unit = '',
  gradient = 'from-brand-700 via-brand-500 to-amber-400',
  glowColor = 'rgba(218, 119, 86, 0.45)',
  accentTextColor = 'text-brand-400',
}: {
  data: number[];
  unit?: string;
  gradient?: string;
  glowColor?: string;
  accentTextColor?: string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const max = Math.max(...data, 1);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="pt-5 pb-1">
      <div className="flex items-end gap-2.5 h-32 relative px-1">
        {data.map((val, i) => {
          const heightPercent = Math.max((val / max) * 100, 8);
          const isHovered = hoveredIdx === i;

          return (
            <div
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="flex-1 flex flex-col items-center gap-2 relative group cursor-pointer"
            >
              {/* Floating Tooltip */}
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.9 }}
                  className="absolute -top-9 z-20 px-2.5 py-1 rounded-xl bg-surface-800 border border-white/10 text-white font-bold text-2xs shadow-2xl whitespace-nowrap pointer-events-none flex items-center gap-1"
                >
                  <span className="text-stone-400 font-normal">{days[i]}:</span>
                  <span className={cn('font-mono font-bold', accentTextColor)}>{val}{unit}</span>
                </motion.div>
              )}

              {/* Recessed Track Container */}
              <div className="w-full bg-white/5 hover:bg-white/10 rounded-2xl h-24 flex items-end p-1 transition-colors relative overflow-hidden border border-white/5">
                {/* Glowing Capsule Bar */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercent}%` }}
                  transition={{ delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    'w-full rounded-xl bg-gradient-to-t transition-all duration-200',
                    gradient,
                    isHovered ? 'brightness-125 scale-[1.02]' : 'opacity-90'
                  )}
                  style={{
                    boxShadow: isHovered ? `0 0 20px ${glowColor}` : `0 0 8px ${glowColor.replace('0.45', '0.15')}`,
                  }}
                />
              </div>

              {/* Day Label */}
              <span className={cn(
                'text-2xs font-semibold uppercase tracking-wider transition-colors',
                isHovered ? 'text-white font-bold' : 'text-stone-500'
              )}>
                {days[i][0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────
function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let offset = 0;
  const r = 36; const circ = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 88 88" className="w-24 h-24 -rotate-90 flex-shrink-0">
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        {segments.map((seg, i) => {
          const len = (seg.value / total) * circ;
          const gap = circ - len;
          const el = (
            <circle key={i} cx="44" cy="44" r={r} fill="none"
              stroke={seg.color} strokeWidth="10"
              strokeDasharray={`${len} ${gap}`}
              strokeDashoffset={-offset}
              className="transition-all duration-700"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="space-y-1.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-2xs text-slate-400">{seg.label}</span>
            <span className="text-2xs font-semibold text-slate-200 ml-auto pl-3">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Heatmap ─────────────────────────────────────────────────
function StudyHeatmap() {
  // Generate 12 weeks × 7 days of mock data
  const cells = Array.from({ length: 84 }, (_, i) => Math.random() > 0.45 ? Math.floor(Math.random() * 4) : 0);
  const levels = ['bg-white/5', 'bg-brand-900/80', 'bg-brand-700', 'bg-brand-500', 'bg-brand-400'];

  return (
    <div>
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <Activity className="w-4 h-4 text-brand-400" /> Study Heatmap
      </h3>
      <div className="flex gap-1">
        {Array.from({ length: 12 }, (_, week) => (
          <div key={week} className="flex flex-col gap-1">
            {Array.from({ length: 7 }, (_, day) => {
              const val = cells[week * 7 + day];
              return (
                <div key={day} title={`${val} sessions`}
                  className={cn('w-3 h-3 rounded-sm transition-colors', levels[val])} />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-2 text-2xs text-slate-500">
        <span>Less</span>
        {levels.map((cls, i) => <div key={i} className={cn('w-3 h-3 rounded-sm', cls)} />)}
        <span>More</span>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, bg, trend }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  color: string; bg: string; trend?: number;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} className="glass rounded-2xl p-5 border border-white/5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {trend !== undefined && (
          <span className={cn('flex items-center gap-0.5 text-2xs font-semibold', trend >= 0 ? 'text-success' : 'text-danger')}>
            {trend >= 0 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-2xs text-slate-500 mt-1">{sub}</p>}
    </motion.div>
  );
}

// ─── Main Analytics Page ──────────────────────────────────────
export function AnalyticsPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      notesService.getAll(user.id),
      flashcardService.getAll(user.id),
      plannerService.getAll(user.id),
      quizService.getAttempts(user.id),
    ]).then(([n, c, t, a]) => {
      setNotes(n);
      setCards(c);
      setTasks(t);
      setAttempts(a);
    });
  }, [user?.id]);

  const masteredCards = cards.filter((c) => c.status === 'mastered').length;
  const avgQuizScore = attempts.length
    ? Math.round(attempts.reduce((s, a) => s + (a.score / a.total) * 100, 0) / attempts.length)
    : 0;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;

  // Mock weekly study hours
  const studyHours = [1.5, 2.5, 0.5, 3, 2, 1, 0];
  const quizScores = [72, 85, 68, 91, 78, 88, 0];

  const cardStatusSegments = [
    { label: 'Mastered', value: cards.filter((c) => c.status === 'mastered').length, color: '#22c55e' },
    { label: 'Review', value: cards.filter((c) => c.status === 'review').length, color: '#3b82f6' },
    { label: 'Learning', value: cards.filter((c) => c.status === 'learning').length, color: '#f59e0b' },
    { label: 'New', value: cards.filter((c) => c.status === 'new').length, color: '#64748b' },
  ];

  const taskSegments = [
    { label: 'Done', value: tasks.filter((t) => t.status === 'done').length, color: '#22c55e' },
    { label: 'In Progress', value: tasks.filter((t) => t.status === 'in_progress').length, color: '#f59e0b' },
    { label: 'To Do', value: tasks.filter((t) => t.status === 'todo').length, color: '#6d4bff' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-400" /> Analytics
        </h1>
        <p className="text-slate-400 text-sm mt-1">Track your learning progress across all modules.</p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Flame} label="Study Streak" value="5 days" sub="Keep it going!" color="text-orange-400" bg="bg-orange-500/10" trend={20} />
        <StatCard icon={Brain} label="Cards Mastered" value={masteredCards} sub={`of ${cards.length} total`} color="text-emerald-400" bg="bg-emerald-500/10" trend={15} />
        <StatCard icon={Target} label="Avg Quiz Score" value={attempts.length ? `${avgQuizScore}%` : '—'} sub={`${attempts.length} quizzes taken`} color="text-cyan-400" bg="bg-cyan-500/10" trend={8} />
        <StatCard icon={CheckCircle2} label="Tasks Completed" value={doneTasks} sub={`of ${tasks.length} total`} color="text-brand-400" bg="bg-brand-500/10" trend={-5} />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Study Hours Bar Chart */}
        <div className="glass rounded-2xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-400" /> Study Hours This Week
            </h3>
            <span className="text-2xs text-stone-400 font-mono bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">Total: {studyHours.reduce((a, b) => a + b, 0).toFixed(1)}h</span>
          </div>
          <BarChart
            data={studyHours}
            unit="h"
            gradient="from-brand-700 via-brand-500 to-amber-400"
            glowColor="rgba(218, 119, 86, 0.45)"
            accentTextColor="text-brand-400"
          />
        </div>

        {/* Quiz Performance */}
        <div className="glass rounded-2xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Quiz Scores (Last 7 Days)
            </h3>
            <span className="text-2xs text-stone-400 font-mono bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">Avg: {quizScores.filter(Boolean).length ? Math.round(quizScores.filter(Boolean).reduce((a, b) => a + b, 0) / quizScores.filter(Boolean).length) : 0}%</span>
          </div>
          <BarChart
            data={quizScores}
            unit="%"
            gradient="from-cyan-600 via-emerald-500 to-teal-300"
            glowColor="rgba(6, 182, 212, 0.45)"
            accentTextColor="text-cyan-400"
          />
        </div>
      </div>

      {/* Donut charts + heatmap */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Flashcard Status */}
        <div className="glass rounded-2xl p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" /> Flashcard Status
          </h3>
          <DonutChart segments={cardStatusSegments} />
        </div>

        {/* Task Status */}
        <div className="glass rounded-2xl p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-brand-400" /> Task Status
          </h3>
          <DonutChart segments={taskSegments} />
        </div>

        {/* Subject breakdown */}
        <div className="glass rounded-2xl p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" /> Notes by Subject
          </h3>
          <div className="space-y-2.5">
            {Object.entries(
              notes.reduce((acc, n) => { acc[n.folder] = (acc[n.folder] || 0) + 1; return acc; }, {} as Record<string, number>)
            ).map(([subject, count]) => (
              <div key={subject}>
                <div className="flex justify-between text-2xs mb-1">
                  <span className="text-slate-400 truncate">{subject}</span>
                  <span className="text-slate-300 font-medium">{count}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${(count / Math.max(notes.length, 1)) * 100}%` }}
                    className="h-full bg-brand-gradient rounded-full"
                  />
                </div>
              </div>
            ))}
            {notes.length === 0 && <p className="text-2xs text-slate-500">No notes yet</p>}
          </div>
        </div>
      </div>

      {/* Study Heatmap */}
      <div className="glass rounded-2xl p-5 border border-white/5">
        <StudyHeatmap />
      </div>

      {/* Recent Activity */}
      <div className="glass rounded-2xl p-5 border border-white/5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-400" /> Recent Activity
        </h3>
        <div className="space-y-3">
          {[
            { icon: Brain, text: 'Completed "Python Data Structures" quiz', sub: '2 hours ago', score: '4/5', color: 'text-brand-400', bg: 'bg-brand-500/10' },
            { icon: Layers, text: 'Reviewed 8 flashcards in Computer Science deck', sub: '5 hours ago', score: null, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { icon: FileText, text: 'Created note: "Neural Networks"', sub: 'Yesterday', score: null, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
            { icon: Target, text: 'Completed task: Write essay outline', sub: '2 days ago', score: null, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          ].map(({ icon: Icon, text, sub, score, color, bg }, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 truncate">{text}</p>
                <p className="text-2xs text-slate-500">{sub}</p>
              </div>
              {score && <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">{score}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

