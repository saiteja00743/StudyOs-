import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, BookOpen, Brain, Zap, Star, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ROUTES } from '@/constants';

// ─── Floating Orbs ──────────────────────────────────────────
function FloatingOrb({ className }: { className?: string }) {
  return (
    <div
      className={`absolute rounded-full blur-3xl opacity-20 animate-pulse-glow ${className}`}
    />
  );
}

// ─── Stat Chip ─────────────────────────────────────────────
function StatChip({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 glass rounded-2xl px-4 py-3 border border-white/8">
      <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center">
        <Icon className="w-4 h-4 text-brand-400" />
      </div>
      <div>
        <p className="text-base font-bold text-white leading-none">{value}</p>
        <p className="text-2xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Mini Feature Pill ──────────────────────────────────────
function FeaturePill({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      className="flex items-center gap-2 bg-surface-800/60 border border-white/8 rounded-full px-3 py-1.5 text-xs text-slate-300 font-medium"
    >
      <Icon className="w-3.5 h-3.5 text-brand-400" />
      {label}
    </motion.div>
  );
}

// ─── Animated Dashboard Preview ────────────────────────────
function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
      className="relative perspective-1000"
    >
      {/* Glow behind card */}
      <div className="absolute inset-0 bg-brand-500/20 blur-3xl rounded-3xl scale-95" />

      {/* Main preview card */}
      <div className="relative glass-strong rounded-3xl p-5 border border-white/10 shadow-card">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-danger" />
            <div className="w-2.5 h-2.5 rounded-full bg-warning" />
            <div className="w-2.5 h-2.5 rounded-full bg-success" />
          </div>
          <Badge variant="primary" size="sm" dot>
            AI Active
          </Badge>
        </div>

        {/* Chat message preview */}
        <div className="space-y-3 mb-4">
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-gradient flex-shrink-0 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="glass rounded-xl rounded-tl-none px-3 py-2 text-xs text-slate-300 max-w-[85%]">
              I need help understanding Newton's laws. Can you explain with examples?
            </div>
          </div>

          <div className="flex gap-2.5 flex-row-reverse">
            <div className="w-7 h-7 rounded-lg bg-surface-700 flex-shrink-0 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-400" />
            </div>
            <div className="bg-brand-500/10 border border-brand-500/15 rounded-xl rounded-tr-none px-3 py-2 text-xs text-slate-200 max-w-[85%]">
              <span className="text-brand-300 font-semibold">StudyOS AI:</span> Newton's First Law states that an object at rest stays at rest...
              <div className="flex gap-1 mt-2">
                <div className="w-1 h-3 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-3 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-3 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
          {[
            { label: 'Notes', value: '24', color: 'text-blue-400' },
            { label: 'Quizzes', value: '12', color: 'text-purple-400' },
            { label: 'Streak', value: '7d', color: 'text-amber-400' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className={`text-base font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-2xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Hero Section ──────────────────────────────────────────
export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
    >
      {/* Background orbs */}
      <FloatingOrb className="w-96 h-96 bg-brand-500 top-1/4 -left-24" />
      <FloatingOrb className="w-80 h-80 bg-accent top-1/3 -right-16" />
      <FloatingOrb className="w-64 h-64 bg-purple-600 bottom-1/4 left-1/3" />

      {/* Dot grid */}
      <div className="absolute inset-0 dot-pattern opacity-30" />

      <div className="container-xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center px-4 sm:px-6 lg:px-8 py-20">
          {/* Left: Text Content */}
          <div className="text-center lg:text-left">
            {/* Launch badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-6"
            >
              <Badge variant="primary" size="lg" dot>
                🚀 Now in Beta — Free Forever
              </Badge>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-display font-black leading-[1.05] mb-6"
            >
              Study Smarter with{' '}
              <span className="gradient-text">AI That Gets</span>{' '}
              <span className="text-white">You</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-slate-400 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0"
            >
              Your AI tutor, smart notes, PDF intelligence, quiz generator, and study planner — all in one powerful platform. Built for students who want to actually learn.
            </motion.p>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="flex flex-wrap gap-2 mb-8 justify-center lg:justify-start"
            >
              <FeaturePill icon={Brain} label="AI Tutor" />
              <FeaturePill icon={BookOpen} label="Smart Notes" />
              <FeaturePill icon={Sparkles} label="PDF Intelligence" />
              <FeaturePill icon={Zap} label="Quiz Generator" />
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                as="a"
                href={ROUTES.SIGNUP}
                size="xl"
                variant="primary"
                leftIcon={<Zap className="w-5 h-5" />}
                rightIcon={<ArrowRight className="w-5 h-5" />}
                id="hero-cta-primary"
              >
                Start Learning Free
              </Button>
              <Button
                as="a"
                href="#features"
                size="xl"
                variant="outline"
                id="hero-cta-secondary"
              >
                See Features
              </Button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex items-center gap-4 mt-8 justify-center lg:justify-start"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-surface-950 bg-gradient-to-br from-brand-500 to-accent"
                    style={{ backgroundImage: `hsl(${i * 60}, 70%, 60%)` }}
                  />
                ))}
              </div>
              <div className="text-sm text-slate-400">
                <span className="text-white font-semibold">2,000+</span> students already studying smarter
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right: Dashboard Preview */}
          <div className="relative hidden lg:block">
            <DashboardPreview />

            {/* Floating stat chips */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="absolute -left-8 top-1/4"
            >
              <StatChip icon={Users} label="Active Students" value="2k+" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute -right-8 bottom-1/4"
            >
              <StatChip icon={TrendingUp} label="Avg Grade Boost" value="+23%" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface-950 to-transparent" />
    </section>
  );
}
