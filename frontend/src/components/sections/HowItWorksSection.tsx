import { motion } from 'framer-motion';
import { Upload, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';

const steps = [
  {
    step: '01',
    icon: Upload,
    title: 'Upload Your Material',
    description:
      'Drop in any PDF, DOCX, PPT, or paste text. Or just start chatting — StudyOS works with whatever you have.',
    color: 'from-brand-500 to-brand-700',
    details: ['PDF, DOCX, PPTX, TXT', 'Drag & drop upload', 'Paste text directly'],
  },
  {
    step: '02',
    icon: Sparkles,
    title: 'AI Does the Heavy Lifting',
    description:
      'StudyOS reads, understands, and transforms your material into smart notes, quizzes, flashcards, and summaries — instantly.',
    color: 'from-purple-500 to-purple-700',
    details: ['AI-generated summaries', 'Auto quiz generation', 'Smart flashcards'],
  },
  {
    step: '03',
    icon: TrendingUp,
    title: 'Track & Improve',
    description:
      'See your progress with beautiful analytics. StudyOS identifies your weak points and adapts your study plan automatically.',
    color: 'from-green-500 to-green-700',
    details: ['Progress analytics', 'Weak topic detection', 'AI study plans'],
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="section relative">
      <div className="container-xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="feature-badge mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            How It Works
          </span>
          <h2 className="text-4xl sm:text-5xl font-display font-black text-white mt-4 mb-5">
            From Material to Mastery{' '}
            <span className="gradient-text">in 3 Steps</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            StudyOS eliminates the friction between you and learning. Here's the magic:
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-24 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />

          <div className="grid lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                id={`step-${step.step}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative text-center"
              >
                {/* Arrow between steps (desktop) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-20 -right-4 z-10 items-center justify-center w-8 h-8">
                    <ArrowRight className="w-5 h-5 text-brand-500/60" />
                  </div>
                )}

                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-glow`}>
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-surface-950 border-2 border-brand-500/40 flex items-center justify-center">
                      <span className="text-2xs font-black text-brand-400">{step.step}</span>
                    </div>
                  </div>
                </div>

                {/* Text */}
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-5">{step.description}</p>

                {/* Detail chips */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {step.details.map((detail) => (
                    <span
                      key={detail}
                      className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/8 text-slate-400"
                    >
                      {detail}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
