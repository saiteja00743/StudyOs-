import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Calendar, Shield, Sparkles, X, Check, Award, ArrowRight } from 'lucide-react';
import { useStreak } from '@/contexts/StreakContext';
import { cn } from '@/utils/cn';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
}

export function StreakModal() {
  const {
    streakData,
    isTodayCheckedIn,
    checkInToday,
    useStreakFreeze,
    openStreakModal,
    setOpenStreakModal,
  } = useStreak();

  const [particles, setParticles] = useState<Particle[]>([]);
  const [justClaimed, setJustClaimed] = useState(false);

  const triggerConfetti = () => {
    const colors = ['#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#3b82f6'];
    const newParticles: Particle[] = [];
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        id: Math.random(),
        x: (Math.random() - 0.5) * 300,
        y: -Math.random() * 200 - 50,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
      });
    }
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1500);
  };

  const handleCheckIn = () => {
    if (isTodayCheckedIn) return;
    checkInToday();
    setJustClaimed(true);
    triggerConfetti();
  };

  const handleUseFreeze = () => {
    if (useStreakFreeze()) {
      triggerConfetti();
    }
  };

  if (!openStreakModal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-surface-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
        >
          {/* Confetti Particles Container */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: p.x, y: p.y + 300, opacity: 0, scale: 0.5, rotate: 360 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  borderRadius: '50%',
                }}
              />
            ))}
          </div>

          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={() => setOpenStreakModal(false)}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Main Hero Header */}
          <div className="text-center relative z-10 mb-6">
            <div className="relative inline-block mb-3">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center mx-auto shadow-glow-amber">
                <Flame className="w-10 h-10 text-amber-400 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500" />
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-display font-black text-white">
              {streakData.currentStreak} Day Study Streak!
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs mx-auto">
              {isTodayCheckedIn
                ? '🔥 You have completed your check-in for today! Keep up the momentum.'
                : 'Complete daily study tasks or check in now to extend your streak.'}
            </p>
          </div>

          {/* Check-In CTA Button */}
          <div className="relative z-10 mb-6">
            <button
              onClick={handleCheckIn}
              disabled={isTodayCheckedIn}
              className={cn(
                'w-full py-4 px-6 rounded-2xl font-display font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 shadow-lg',
                isTodayCheckedIn
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] shadow-amber-500/25'
              )}
            >
              {isTodayCheckedIn ? (
                <>
                  <Check className="w-5 h-5 text-emerald-400" />
                  <span>Today's Streak Claimed!</span>
                </>
              ) : (
                <>
                  <Flame className="w-5 h-5 text-slate-950 fill-current" />
                  <span>Check In for Today (+1 Streak)</span>
                  <Sparkles className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>

          {/* 7-Day Tracker Grid */}
          <div className="bg-white/4 border border-white/8 rounded-2xl p-4 mb-6 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> This Week's Activity
              </span>
              <span className="text-2xs text-slate-500 font-mono">Mon – Sun</span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {streakData.weeklyHistory.map((day) => (
                <div key={day.dayName} className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      'w-9 h-11 rounded-xl flex flex-col items-center justify-center border transition-all text-xs font-bold',
                      day.completed
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/10'
                        : day.isToday
                        ? 'bg-brand-500/20 border-brand-500/40 text-brand-300 ring-2 ring-brand-500/30 animate-pulse'
                        : 'bg-white/3 border-white/5 text-slate-600'
                    )}
                  >
                    {day.completed ? (
                      <Flame className="w-4 h-4 text-amber-400 fill-amber-400/30" />
                    ) : day.isToday ? (
                      <span className="w-2 h-2 rounded-full bg-brand-400" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    )}
                  </div>
                  <span className={cn('text-[10px] font-medium', day.isToday ? 'text-amber-400 font-bold' : 'text-slate-500')}>
                    {day.dayName}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
            <div className="bg-white/3 border border-white/6 rounded-2xl p-3 text-center">
              <Award className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <p className="text-lg font-black text-white">{streakData.longestStreak}d</p>
              <p className="text-[10px] text-slate-500">Best Streak</p>
            </div>

            <div className="bg-white/3 border border-white/6 rounded-2xl p-3 text-center">
              <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
              <p className="text-lg font-black text-white">{streakData.totalActiveDays}</p>
              <p className="text-[10px] text-slate-500">Active Days</p>
            </div>

            <div className="bg-white/3 border border-white/6 rounded-2xl p-3 text-center">
              <Shield className="w-4 h-4 text-sky-400 mx-auto mb-1" />
              <p className="text-lg font-black text-white">{streakData.streakFreezes}</p>
              <p className="text-[10px] text-slate-500">Streak Freezes</p>
            </div>
          </div>

          {/* Streak Freeze Banner (If streak freezes available) */}
          {streakData.streakFreezes > 0 && !isTodayCheckedIn && (
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-3.5 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-sky-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-white">Protect your streak!</p>
                  <p className="text-[10px] text-sky-300/80">Use 1 Streak Freeze to cover missed days.</p>
                </div>
              </div>
              <button
                onClick={handleUseFreeze}
                className="py-1.5 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-2xs font-bold border border-sky-500/40 transition-colors"
              >
                Use Freeze
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
