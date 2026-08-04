import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, Play, Pause, RotateCcw, Sparkles, Maximize2, Minimize2, X, HeartPulse } from 'lucide-react';
import { cn } from '@/utils/cn';

export type BreathingMode = '4-7-8' | 'box' | 'deep-calm';

interface ModeConfig {
  name: string;
  subtitle: string;
  phases: { name: string; duration: number }[]; // durations in seconds
}

const MODES: Record<BreathingMode, ModeConfig> = {
  '4-7-8': {
    name: '4-7-8 Breathing',
    subtitle: 'Reduces anxiety and calms the nervous system in minutes',
    phases: [
      { name: 'Breathe In', duration: 4 },
      { name: 'Hold', duration: 7 },
      { name: 'Breathe Out', duration: 8 },
    ],
  },
  'box': {
    name: 'Box Breathing (4-4-4-4)',
    subtitle: 'Used by Navy SEALs to regain sharp focus under stress',
    phases: [
      { name: 'Breathe In', duration: 4 },
      { name: 'Hold', duration: 4 },
      { name: 'Breathe Out', duration: 4 },
      { name: 'Hold', duration: 4 },
    ],
  },
  'deep-calm': {
    name: 'Deep Calm (4-2-4)',
    subtitle: 'Quick 1-minute refresher before intense study sessions',
    phases: [
      { name: 'Breathe In', duration: 4 },
      { name: 'Hold', duration: 2 },
      { name: 'Breathe Out', duration: 4 },
    ],
  },
};

interface BreathingWidgetProps {
  isModal?: boolean;
  onClose?: () => void;
}

export function BreathingWidget({ isModal = false, onClose }: BreathingWidgetProps) {
  const [selectedMode, setSelectedMode] = useState<BreathingMode>('4-7-8');
  const [isActive, setIsActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(MODES['4-7-8'].phases[0].duration);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeModeConfig = MODES[selectedMode];
  const currentPhase = activeModeConfig.phases[phaseIndex];

  // Reset phase state when mode changes
  useEffect(() => {
    setIsActive(false);
    setPhaseIndex(0);
    setSecondsLeft(activeModeConfig.phases[0].duration);
    setCompletedCycles(0);
  }, [selectedMode]);

  // Breathing timer interval
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    if (isActive) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Advance phase
            const nextPhaseIndex = (phaseIndex + 1) % activeModeConfig.phases.length;
            
            // If wrapping back to Inhale, increment cycle
            if (nextPhaseIndex === 0) {
              setCompletedCycles((c) => c + 1);
            }
            
            setPhaseIndex(nextPhaseIndex);
            return activeModeConfig.phases[nextPhaseIndex].duration;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, phaseIndex, activeModeConfig]);

  const handleTogglePlay = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setPhaseIndex(0);
    setSecondsLeft(activeModeConfig.phases[0].duration);
    setCompletedCycles(0);
  };

  // Determine scale factor for the glowing breathing sphere based on phase
  let sphereScale = 1;
  if (!isActive) {
    sphereScale = 1;
  } else if (currentPhase.name === 'Breathe In') {
    // Scaling up from 1 to 1.35
    const phaseTotal = currentPhase.duration;
    const progress = (phaseTotal - secondsLeft) / phaseTotal;
    sphereScale = 1 + progress * 0.35;
  } else if (currentPhase.name === 'Hold') {
    sphereScale = 1.35;
  } else if (currentPhase.name === 'Breathe Out') {
    // Scaling down from 1.35 to 1
    const phaseTotal = currentPhase.duration;
    const progress = (phaseTotal - secondsLeft) / phaseTotal;
    sphereScale = 1.35 - progress * 0.35;
  }

  const mainContent = (
    <div className={cn(
      'relative flex flex-col items-center justify-between text-center overflow-hidden transition-all',
      isModal || isFullscreen ? 'p-8 sm:p-10 max-w-xl mx-auto w-full' : 'p-5'
    )}>
      {/* Glow Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-transparent to-sky-900/10 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 w-full mb-6">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <Wind className="w-5 h-5 text-sky-400 animate-pulse" />
            <h3 className={cn('font-display font-bold text-white', isModal || isFullscreen ? 'text-xl' : 'text-base')}>
              {activeModeConfig.name}
            </h3>
          </div>

          <div className="flex items-center gap-1">
            {!isModal && (
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title={isFullscreen ? 'Exit Fullscreen' : 'Expand View'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}
            {isModal && onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        <p className="text-2xs sm:text-xs text-slate-400 max-w-sm mx-auto">
          {activeModeConfig.subtitle}
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="relative z-10 flex items-center justify-center gap-1 p-1 bg-white/5 border border-white/8 rounded-2xl mb-8 w-full max-w-xs text-2xs">
        {(Object.keys(MODES) as BreathingMode[]).map((modeKey) => (
          <button
            key={modeKey}
            onClick={() => setSelectedMode(modeKey)}
            className={cn(
              'flex-1 py-1.5 px-2 rounded-xl transition-all font-medium capitalize',
              selectedMode === modeKey
                ? 'bg-gradient-to-r from-sky-500 to-purple-600 text-white shadow-glow-sm font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
          >
            {modeKey === '4-7-8' ? '4-7-8' : modeKey === 'box' ? 'Box (4s)' : 'Calm'}
          </button>
        ))}
      </div>

      {/* Breathing Sphere Animation */}
      <div className="relative z-10 my-6 sm:my-8 flex items-center justify-center">
        {/* Outer Aura Ring */}
        <motion.div
          animate={{
            scale: sphereScale * 1.15,
            opacity: isActive ? 0.35 : 0.15,
          }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="absolute w-52 h-52 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tr from-purple-500 via-sky-400 to-indigo-500 blur-2xl pointer-events-none"
        />

        {/* Main Breathing Circle */}
        <motion.div
          animate={{ scale: sphereScale }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className={cn(
            'relative w-44 h-44 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center shadow-2xl border transition-all duration-500',
            isActive
              ? 'bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 border-sky-300/40 text-white shadow-sky-500/30'
              : 'bg-gradient-to-tr from-surface-800 via-surface-900 to-surface-800 border-white/15 text-slate-300'
          )}
        >
          {/* Phase Text */}
          <motion.span
            key={isActive ? currentPhase.name : 'ready'}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xl sm:text-2xl font-display font-black tracking-tight text-white mb-1 drop-shadow-md"
          >
            {isActive ? currentPhase.name : 'Ready'}
          </motion.span>

          {/* Seconds remaining in phase */}
          {isActive ? (
            <span className="text-3xl font-mono font-black text-sky-200">
              {secondsLeft}s
            </span>
          ) : (
            <span className="text-xs text-slate-400 max-w-[120px] leading-tight mt-1">
              Click Start to center yourself
            </span>
          )}
        </motion.div>
      </div>

      {/* Phase Indicator Progress Dots */}
      <div className="relative z-10 flex items-center justify-center gap-2 mb-6">
        {activeModeConfig.phases.map((p, idx) => (
          <div
            key={idx}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs transition-all border',
              isActive && phaseIndex === idx
                ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold scale-105'
                : 'bg-white/3 border-white/5 text-slate-500'
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>{p.name} ({p.duration}s)</span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="relative z-10 flex items-center justify-center gap-4 w-full">
        <button
          onClick={handleReset}
          className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={handleTogglePlay}
          className={cn(
            'flex-1 py-3 px-8 rounded-2xl font-display font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg',
            isActive
              ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
              : 'bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:opacity-95 text-white shadow-sky-500/25'
          )}
        >
          {isActive ? (
            <>
              <Pause className="w-4 h-4 fill-current" /> Pause Exercise
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current ml-0.5" /> Start Breathing
            </>
          )}
        </button>
      </div>

      {/* Cycle Stats */}
      <div className="relative z-10 mt-5 text-2xs text-slate-500 flex items-center justify-center gap-1.5">
        <HeartPulse className="w-3.5 h-3.5 text-purple-400" />
        <span>Completed Cycles: <strong className="text-slate-300">{completedCycles}</strong></span>
      </div>
    </div>
  );

  // Fullscreen Modal View
  if (isFullscreen) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/90 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl glass rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
          >
            {mainContent}
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  // Modal View
  if (isModal) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-lg bg-surface-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            {mainContent}
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  // Default Embedded Sidebar Card
  return (
    <div className="glass rounded-2xl border border-white/5 overflow-hidden">
      {mainContent}
    </div>
  );
}
