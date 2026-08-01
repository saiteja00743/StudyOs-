import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, CheckCircle2, Circle, Clock, Plus, Trash2,
  AlertTriangle, Flame, Pause, Play, RotateCcw, Bell,
  Target, TrendingUp, ChevronDown, Filter,
} from 'lucide-react';
import { PlannerTask, TaskPriority, TaskStatus } from '@/types/study';
import { plannerService } from '@/services/plannerService';
import { cn } from '@/utils/cn';

const PRIORITY_STYLES: Record<TaskPriority, { label: string; cls: string; dot: string }> = {
  low: { label: 'Low', cls: 'text-slate-400 bg-slate-500/10', dot: 'bg-slate-400' },
  medium: { label: 'Medium', cls: 'text-amber-400 bg-amber-500/10', dot: 'bg-amber-400' },
  high: { label: 'High', cls: 'text-orange-400 bg-orange-500/10', dot: 'bg-orange-400' },
  urgent: { label: 'Urgent', cls: 'text-danger bg-danger/10', dot: 'bg-danger' },
};

const STATUS_ICONS: Record<TaskStatus, React.ElementType> = {
  todo: Circle,
  in_progress: Flame,
  done: CheckCircle2,
};

// ─── Pomodoro Timer ───────────────────────────────────────────
function PomodoroWidget() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<'work' | 'break'>('work');
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const WORK_MIN = 25;
  const BREAK_MIN = 5;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s === 0) {
            setMinutes((m) => {
              if (m === 0) {
                // Switch phase
                if (phase === 'work') {
                  setSessions((n) => n + 1);
                  setPhase('break');
                  setMinutes(BREAK_MIN);
                } else {
                  setPhase('work');
                  setMinutes(WORK_MIN);
                }
                setRunning(false);
                return phase === 'work' ? BREAK_MIN : WORK_MIN;
              }
              return m - 1;
            });
            return 59;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, phase]);

  const totalSec = (phase === 'work' ? WORK_MIN : BREAK_MIN) * 60;
  const elapsed = totalSec - (minutes * 60 + seconds);
  const progress = (elapsed / totalSec) * 100;

  const reset = () => {
    setRunning(false);
    setMinutes(phase === 'work' ? WORK_MIN : BREAK_MIN);
    setSeconds(0);
  };

  return (
    <div className="glass rounded-2xl p-5 border border-white/5">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Flame className="w-4 h-4 text-orange-400" /> Pomodoro Timer
      </h3>

      {/* Circular progress */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-28 h-28">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
            <circle cx="56" cy="56" r="48" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            <circle cx="56" cy="56" r="48" fill="none"
              stroke={phase === 'work' ? '#6d4bff' : '#22c55e'}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 48}`}
              strokeDashoffset={`${2 * Math.PI * 48 * (1 - progress / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white font-mono">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span className={cn('text-2xs font-semibold mt-0.5', phase === 'work' ? 'text-brand-400' : 'text-emerald-400')}>
              {phase === 'work' ? 'FOCUS' : 'BREAK'}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <button onClick={reset} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all">
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => setRunning(!running)}
          className="px-6 py-2 rounded-xl bg-brand-gradient text-white font-medium text-sm hover:opacity-90 transition-all shadow-glow-sm flex items-center gap-1.5"
        >
          {running ? <><Pause className="w-4 h-4" />Pause</> : <><Play className="w-4 h-4" />Start</>}
        </button>
        <button onClick={() => setPhase(phase === 'work' ? 'break' : 'work')}
          className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all text-xs">
          <Bell className="w-4 h-4" />
        </button>
      </div>

      <div className="text-center text-2xs text-slate-500">
        Sessions completed today: <span className="text-brand-400 font-semibold">{sessions}</span>
      </div>
    </div>
  );
}

// ─── Task Item ─────────────────────────────────────────────────
function TaskItem({ task, onToggle, onDelete }: {
  task: PlannerTask;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const StatusIcon = STATUS_ICONS[task.status];
  const isOverdue = task.status !== 'done' && task.due_date < new Date().toISOString().split('T')[0];
  const priorityStyle = PRIORITY_STYLES[task.priority];

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border group transition-all',
        task.status === 'done' ? 'opacity-50 bg-white/2 border-white/3' : 'glass border-white/5 hover:border-brand-500/20'
      )}
    >
      <button onClick={onToggle} className="mt-0.5 flex-shrink-0">
        <StatusIcon className={cn('w-5 h-5 transition-colors',
          task.status === 'done' ? 'text-success' : task.status === 'in_progress' ? 'text-orange-400' : 'text-slate-500 hover:text-brand-400'
        )} />
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium text-white', task.status === 'done' && 'line-through text-slate-500')}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-2xs text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className={cn('px-2 py-0.5 rounded-full text-2xs font-medium', priorityStyle.cls)}>
            <span className={cn('inline-block w-1.5 h-1.5 rounded-full mr-1', priorityStyle.dot)} />
            {priorityStyle.label}
          </span>
          <span className="text-2xs text-slate-500">{task.subject}</span>
          <span className={cn('text-2xs flex items-center gap-0.5', isOverdue ? 'text-danger' : 'text-slate-500')}>
            <Clock className="w-3 h-3" />
            {isOverdue ? '⚠ Overdue' : task.due_date}
          </span>
          <span className="text-2xs text-slate-500">{task.estimated_minutes}min</span>
        </div>
      </div>

      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-danger transition-all flex-shrink-0">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// ─── Main Planner Page ────────────────────────────────────────
export function PlannerPage() {
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'overdue' | TaskStatus>('all');
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newDue, setNewDue] = useState(new Date().toISOString().split('T')[0]);
  const [newMinutes, setNewMinutes] = useState(30);

  const refresh = () => setTasks(plannerService.getAll());
  useEffect(() => { refresh(); }, []);

  const stats = plannerService.getStats();
  const today = new Date().toISOString().split('T')[0];

  const filtered = tasks.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'today') return t.due_date === today;
    if (filter === 'overdue') return t.status !== 'done' && t.due_date < today;
    return t.status === filter;
  });

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    plannerService.create({ title: newTitle, subject: newSubject || 'General', priority: newPriority, due_date: newDue, estimated_minutes: newMinutes });
    setNewTitle(''); setNewSubject(''); setShowForm(false); refresh();
  };

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-6 max-w-6xl mx-auto">
      {/* Main content */}
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-brand-400" /> Study Planner
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {stats.today} tasks today · {stats.overdue > 0 && <span className="text-danger">{stats.overdue} overdue · </span>}
              {stats.done}/{stats.total} done
            </p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-gradient text-white text-sm font-medium hover:opacity-90 transition-all shadow-glow-sm">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-white' },
            { label: 'Today', value: stats.today, color: 'text-cyan-400' },
            { label: 'Overdue', value: stats.overdue, color: 'text-danger' },
            { label: 'Done', value: stats.done, color: 'text-emerald-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="glass rounded-xl p-3 border border-white/5 text-center">
              <p className={cn('text-xl font-black', color)}>{value}</p>
              <p className="text-2xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'all', label: 'All' },
            { id: 'today', label: 'Today' },
            { id: 'overdue', label: '⚠ Overdue' },
            { id: 'todo', label: 'To Do' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'done', label: 'Done' },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setFilter(id as typeof filter)}
              className={cn('px-3 py-1.5 rounded-xl text-xs font-medium transition-all border',
                filter === id ? 'bg-brand-500 text-white border-brand-500' : 'bg-white/5 text-slate-400 border-white/5 hover:border-brand-500/30 hover:text-white'
              )}>
              {label}
            </button>
          ))}
        </div>

        {/* Task list */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No tasks in this view. Add a new task to get started!</p>
            </div>
          ) : (
            filtered.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() => { plannerService.toggleStatus(task.id); refresh(); }}
                onDelete={() => { plannerService.delete(task.id); refresh(); }}
              />
            ))
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <div className="space-y-5 lg:sticky lg:top-0 lg:self-start">
        <PomodoroWidget />

        {/* Progress chart placeholder */}
        <div className="glass rounded-2xl p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-400" /> Weekly Progress
          </h3>
          <div className="space-y-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
              const val = [60, 80, 45, 90, 70, 30, 55][i];
              return (
                <div key={day} className="flex items-center gap-2">
                  <span className="text-2xs text-slate-500 w-6">{day}</span>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${val}%` }}
                      transition={{ delay: i * 0.05 }}
                      className="h-full bg-brand-gradient rounded-full"
                    />
                  </div>
                  <span className="text-2xs text-slate-500 w-6">{val}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="glass rounded-2xl p-6 border border-white/10 w-full max-w-md space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white">Add Task</h3>
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Task title"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-brand-500/50" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Subject"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-brand-500/50" />
                <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:ring-1 focus:ring-brand-500/50">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-2xs text-slate-400 block mb-1">Due Date</label>
                  <input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-brand-500/50" />
                </div>
                <div>
                  <label className="text-2xs text-slate-400 block mb-1">Estimated (min)</label>
                  <input type="number" value={newMinutes} onChange={(e) => setNewMinutes(Number(e.target.value))} min={5}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-brand-500/50" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-slate-300 hover:bg-white/5 transition-all">Cancel</button>
                <button onClick={handleCreate} disabled={!newTitle.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all shadow-glow-sm">
                  Add Task
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
