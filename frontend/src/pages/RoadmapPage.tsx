import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map, Plus, Flame, CheckSquare, Square, Trophy, Star,
  Trash2, ChevronDown, ChevronUp, Calendar, Target,
  Flag, X, Edit3, Sparkles, TrendingUp, Lock, Clock,
  Circle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { RoadmapGoal, RoadmapDay, RoadmapMilestone } from '@/types/study';

// ─── Constants ──────────────────────────────────────────────────────────────
const LS_KEY = 'studyos_roadmaps';
const DAY_OPTIONS = [7, 14, 21, 30, 60, 90];

const GOAL_COLORS = [
  '#6d4bff', '#06b6d4', '#10b981', '#f59e0b',
  '#ec4899', '#f43f5e', '#8b5cf6', '#da7756',
];

// ─── LocalStorage helpers ───────────────────────────────────────────────────
function loadGoals(): RoadmapGoal[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function saveGoals(goals: RoadmapGoal[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(goals));
}

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function buildDays(totalDays: number, startDate: string): RoadmapDay[] {
  const start = new Date(startDate);
  return Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return { day: i + 1, date: toDateString(d), completed: false };
  });
}

function computeStreak(days: RoadmapDay[]): number {
  const today = toDateString(new Date());
  const sorted = [...days].sort((a, b) => a.day - b.day);
  let streak = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const d = sorted[i];
    if (d.date > today) continue;
    if (d.completed) streak++;
    else break;
  }
  return streak;
}

// ─── Day Box component ───────────────────────────────────────────────────────
function DayBox({
  day, color, milestone, onCheck,
}: {
  day: RoadmapDay;
  color: string;
  milestone?: RoadmapMilestone;
  onCheck: () => void;
}) {
  const today = toDateString(new Date());
  const isToday = day.date === today;
  const isPast = day.date < today;
  const isFuture = day.date > today;

  const canCheck = isToday || (isPast && !day.completed);

  return (
    <div className="relative flex flex-col items-center gap-1">
      {/* Milestone flag */}
      {milestone && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2">
          <Flag className="w-3 h-3 text-amber-400" />
        </div>
      )}

      <motion.button
        onClick={canCheck ? onCheck : undefined}
        whileHover={canCheck ? { scale: 1.15 } : {}}
        whileTap={canCheck ? { scale: 0.9 } : {}}
        title={
          isToday ? `Day ${day.day} — Today! Click to check in` :
          isPast && !day.completed ? `Day ${day.day} — ${day.date} (missed)` :
          isFuture ? `Day ${day.day} — ${day.date} (upcoming)` :
          `Day ${day.day} — ✓ Completed`
        }
        className={cn(
          'w-7 h-7 rounded-md flex items-center justify-center border transition-all duration-300 relative overflow-hidden',
          day.completed
            ? 'border-transparent shadow-sm'
            : isToday
            ? 'border-current animate-pulse cursor-pointer'
            : isPast
            ? 'bg-red-500/10 border-red-500/20 cursor-pointer'
            : 'bg-white/3 border-white/5 cursor-not-allowed opacity-40'
        )}
        style={day.completed ? { backgroundColor: color + '33', borderColor: color + '66' } :
               isToday ? { borderColor: color, color: color } : undefined}
      >
        {day.completed ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-3.5 h-3.5 rounded-sm"
            style={{ backgroundColor: color }}
          />
        ) : isToday ? (
          <Circle className="w-3 h-3" />
        ) : isPast ? (
          <X className="w-3 h-3 text-red-500/50" />
        ) : (
          <div className="w-2 h-2 rounded-sm bg-white/10" />
        )}

        {/* Today glow pulse */}
        {isToday && !day.completed && (
          <span className="absolute inset-0 rounded-md animate-ping opacity-30" style={{ backgroundColor: color }} />
        )}
      </motion.button>

      {/* Day number */}
      <span className={cn(
        'text-[9px] font-mono tabular-nums leading-none',
        day.completed ? 'text-slate-400' :
        isToday ? 'font-bold' : 'text-slate-700'
      )} style={isToday ? { color } : undefined}>
        {day.day}
      </span>

      {/* Milestone label */}
      {milestone && (
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-amber-400 whitespace-nowrap">
          {milestone.label}
        </span>
      )}
    </div>
  );
}

// ─── Goal Card ───────────────────────────────────────────────────────────────
function GoalCard({
  goal,
  onUpdate,
  onDelete,
}: {
  goal: RoadmapGoal;
  onUpdate: (updated: RoadmapGoal) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [mDay, setMDay] = useState('');
  const [mLabel, setMLabel] = useState('');

  const today = toDateString(new Date());
  const completedDays = goal.days.filter(d => d.completed).length;
  const progress = Math.round((completedDays / goal.totalDays) * 100);
  const streak = computeStreak(goal.days);
  const activeDays = goal.days.filter(d => d.date <= today);
  const missed = activeDays.filter(d => !d.completed).length;

  const handleCheck = useCallback((day: RoadmapDay) => {
    const updated = {
      ...goal,
      days: goal.days.map(d =>
        d.day === day.day
          ? { ...d, completed: !d.completed, completedAt: !d.completed ? new Date().toISOString() : undefined }
          : d
      ),
    };
    onUpdate(updated);
  }, [goal, onUpdate]);

  const addMilestone = () => {
    const dayNum = parseInt(mDay);
    if (!dayNum || dayNum < 1 || dayNum > goal.totalDays || !mLabel.trim()) return;
    const updated = {
      ...goal,
      milestones: [...goal.milestones.filter(m => m.day !== dayNum), { day: dayNum, label: mLabel }],
    };
    onUpdate(updated);
    setAddingMilestone(false);
    setMDay('');
    setMLabel('');
  };

  // Group days into weeks of 7
  const weeks: RoadmapDay[][] = [];
  for (let i = 0; i < goal.days.length; i += 7) {
    weeks.push(goal.days.slice(i, i + 7));
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-white/5 overflow-hidden"
    >
      {/* Top color strip */}
      <div className="h-1 w-full" style={{ backgroundColor: goal.color }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: goal.color + '22', border: `1px solid ${goal.color}44` }}
          >
            <Target className="w-5 h-5" style={{ color: goal.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white truncate">{goal.title}</h3>
            {goal.description && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{goal.description}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-2xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {goal.totalDays} days
              </span>
              <span className="text-2xs text-slate-500">
                Started {new Date(goal.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Streak */}
          {streak > 0 && (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20"
            >
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-black text-orange-400">{streak}</span>
              <span className="text-2xs text-orange-400/70">streak</span>
            </motion.div>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-all"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-xl hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-2xs text-slate-500">{completedDays}/{goal.totalDays} days complete</span>
            <div className="flex items-center gap-3 text-2xs">
              {missed > 0 && <span className="text-red-400">{missed} missed</span>}
              <span className="font-semibold" style={{ color: goal.color }}>{progress}%</span>
            </div>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: goal.color }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              {/* Day grid by weeks */}
              <div className="space-y-4 mt-4">
                {weeks.map((week, wi) => (
                  <div key={wi} className="relative">
                    <div className="text-2xs text-slate-600 mb-2 font-mono">
                      Week {wi + 1}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {week.map(day => (
                        <DayBox
                          key={day.day}
                          day={day}
                          color={goal.color}
                          milestone={goal.milestones.find(m => m.day === day.day)}
                          onCheck={() => handleCheck(day)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Milestone actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => setAddingMilestone(!addingMilestone)}
                  className="flex items-center gap-1.5 text-2xs text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" /> Add Milestone
                </button>

                {goal.milestones.length > 0 && (
                  <div className="flex gap-2 flex-wrap ml-2">
                    {goal.milestones.map(m => (
                      <span key={m.day} className="px-2 py-0.5 rounded-full text-2xs bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1">
                        <Flag className="w-2.5 h-2.5" /> Day {m.day}: {m.label}
                        <button
                          onClick={() => onUpdate({ ...goal, milestones: goal.milestones.filter(x => x.day !== m.day) })}
                          className="hover:text-red-400 transition-colors ml-1"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <AnimatePresence>
                {addingMilestone && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-2"
                  >
                    <input
                      type="number"
                      placeholder="Day #"
                      value={mDay}
                      onChange={e => setMDay(e.target.value)}
                      min={1}
                      max={goal.totalDays}
                      className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-brand-500/50"
                    />
                    <input
                      type="text"
                      placeholder="Milestone label"
                      value={mLabel}
                      onChange={e => setMLabel(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-brand-500/50"
                      onKeyDown={e => e.key === 'Enter' && addMilestone()}
                    />
                    <button
                      onClick={addMilestone}
                      className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm hover:bg-amber-500/30 transition-all"
                    >
                      Add
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Create Roadmap Modal ────────────────────────────────────────────────────
function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (g: RoadmapGoal) => void }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [totalDays, setTotalDays] = useState(30);
  const [color, setColor] = useState(GOAL_COLORS[0]);

  const handleCreate = () => {
    if (!title.trim()) return;
    const startDate = toDateString(new Date());
    const goal: RoadmapGoal = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: desc.trim() || undefined,
      totalDays,
      color,
      days: buildDays(totalDays, startDate),
      milestones: [],
      createdAt: new Date().toISOString(),
    };
    onCreate(goal);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="glass rounded-2xl p-6 border border-white/10 w-full max-w-md space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Map className="w-5 h-5 text-brand-400" /> Create Roadmap Goal
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <input
          autoFocus
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Goal title (e.g. 'Master React in 30 days')"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-brand-500/50"
        />

        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-brand-500/50 resize-none"
        />

        {/* Day count picker */}
        <div>
          <label className="text-2xs text-slate-400 uppercase tracking-wider font-semibold mb-2 block">
            <Clock className="w-3 h-3 inline mr-1" /> Timeline
          </label>
          <div className="flex gap-2 flex-wrap">
            {DAY_OPTIONS.map(d => (
              <button
                key={d}
                onClick={() => setTotalDays(d)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                  totalDays === d
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                )}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div>
          <label className="text-2xs text-slate-400 uppercase tracking-wider font-semibold mb-2 block">Color</label>
          <div className="flex gap-2">
            {GOAL_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  'w-7 h-7 rounded-lg border-2 transition-all',
                  color === c ? 'scale-125 border-white' : 'border-transparent hover:scale-110'
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-xl overflow-hidden border border-white/5">
          <div className="h-1 w-full" style={{ backgroundColor: color }} />
          <div className="p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '22' }}>
              <Target className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{title || 'My Roadmap Goal'}</p>
              <p className="text-2xs text-slate-500">{totalDays} day journey</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim()}
            className="flex-1 py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all shadow-glow-sm flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Create Roadmap
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export function RoadmapPage() {
  const [goals, setGoals] = useState<RoadmapGoal[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { setGoals(loadGoals()); }, []);

  const persist = (updated: RoadmapGoal[]) => {
    setGoals(updated);
    saveGoals(updated);
  };

  const handleCreate = (goal: RoadmapGoal) => {
    persist([goal, ...goals]);
  };

  const handleUpdate = (updated: RoadmapGoal) => {
    persist(goals.map(g => g.id === updated.id ? updated : g));
  };

  const handleDelete = (id: string) => {
    persist(goals.filter(g => g.id !== id));
  };

  // Aggregate stats
  const totalGoals = goals.length;
  const totalDays = goals.reduce((acc, g) => acc + g.days.filter(d => d.completed).length, 0);
  const maxStreak = goals.reduce((max, g) => Math.max(max, computeStreak(g.days)), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Map className="w-6 h-6 text-brand-400" /> Roadmap Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Build daily habits · check in every day · track your streak
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-medium hover:opacity-90 transition-all shadow-glow-sm"
          id="roadmap-create-btn"
        >
          <Plus className="w-4 h-4" /> New Roadmap
        </button>
      </div>

      {/* Stats bar */}
      {totalGoals > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Active Goals', value: totalGoals, icon: Target, color: 'text-brand-400' },
            { label: 'Days Completed', value: totalDays, icon: CheckSquare, color: 'text-emerald-400' },
            { label: 'Best Streak 🔥', value: maxStreak, icon: Flame, color: 'text-orange-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass rounded-xl p-4 border border-white/5 text-center">
              <Icon className={cn('w-5 h-5 mx-auto mb-1', color)} />
              <p className={cn('text-2xl font-black', color)}>{value}</p>
              <p className="text-2xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      {totalGoals > 0 && (
        <div className="flex items-center gap-4 text-2xs text-slate-500 flex-wrap">
          <span className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-brand-500/30 border border-brand-500/50" /> Completed
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded border border-brand-400 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full border border-brand-400 animate-pulse" />
            </div> Today (click to check in!)
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-red-500/10 border border-red-500/20" /> Missed
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-white/3 border border-white/5 opacity-40" /> Upcoming
          </span>
          <span className="flex items-center gap-1.5">
            <Flag className="w-3 h-3 text-amber-400" /> Milestone
          </span>
        </div>
      )}

      {/* Goal cards */}
      <AnimatePresence>
        {goals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-24 h-24 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
              <Map className="w-12 h-12 text-brand-400 opacity-60" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No roadmaps yet</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-sm">
              Create your first learning roadmap. Set a goal, pick a timeline, and check off each day to build a habit!
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-gradient text-white font-medium hover:opacity-90 transition-all shadow-glow"
            >
              <Plus className="w-5 h-5" /> Create Your First Roadmap
            </button>
          </motion.div>
        ) : (
          <div className="space-y-5">
            {goals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onUpdate={handleUpdate}
                onDelete={() => handleDelete(goal.id)}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateModal
            onClose={() => setShowCreate(false)}
            onCreate={handleCreate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
