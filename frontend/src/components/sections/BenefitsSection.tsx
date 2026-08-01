import { motion } from 'framer-motion';
import { Clock, Target, Brain, BarChart2, Shield, Sparkles } from 'lucide-react';

const benefits = [
  {
    icon: Clock,
    title: 'Save 5+ Hours Per Week',
    description: 'Stop re-reading the same material. StudyOS distills what matters in seconds.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Target,
    title: 'Study What Actually Matters',
    description: "AI identifies your weak spots and focuses your time where it's most needed.",
    color: 'text-green-400',
    bg: 'bg-green-500/10',
  },
  {
    icon: Brain,
    title: 'Understand, Don\'t Memorize',
    description: 'The AI tutor builds real understanding through explanations, examples, and follow-up questions.',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
  },
  {
    icon: BarChart2,
    title: 'Track Your Progress',
    description: 'Beautiful analytics show exactly how you\'re improving over time — and where to focus next.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Shield,
    title: 'Your Data, Protected',
    description: 'End-to-end encrypted. Your notes and files are private, always. We never sell your data.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
  {
    icon: Sparkles,
    title: 'Always Getting Smarter',
    description: 'New features ship regularly. Voice AI, mind maps, mobile app — all coming soon.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
];

export function BenefitsSection() {
  return (
    <section id="benefits" className="section relative">
      <div className="container-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-display font-black text-white mb-5">
            Why Students{' '}
            <span className="gradient-text">Love StudyOS</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            It's not just another study tool. It's a system that actually changes how you learn.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex gap-4 glass rounded-2xl p-5 border border-white/6 hover:border-white/12 transition-all duration-300"
            >
              <div className={`w-10 h-10 rounded-xl ${b.bg} flex items-center justify-center flex-shrink-0`}>
                <b.icon className={`w-5 h-5 ${b.color}`} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white mb-1.5">{b.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{b.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
