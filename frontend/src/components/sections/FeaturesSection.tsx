import { motion, Variants } from 'framer-motion';
import { Brain, FileText, Zap, BookOpen, Calendar, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const features = [
  {
    id: 'ai-tutor',
    icon: Brain,
    title: 'AI Tutor',
    description:
      'Chat with a Gemini-powered AI that explains concepts, answers questions, and adapts to your learning style. Math, science, history — it knows it all.',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
    border: 'hover:border-brand-500/30',
    glow: 'group-hover:shadow-glow-sm',
    tag: 'Core Feature',
  },
  {
    id: 'smart-notes',
    icon: FileText,
    title: 'Smart Notes',
    description:
      'Create, organize, and search notes with AI assistance. Auto-format, summarize, and extract key points. Never lose an idea again.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'hover:border-blue-500/30',
    glow: 'group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]',
    tag: 'Productivity',
  },
  {
    id: 'pdf-intelligence',
    icon: Zap,
    title: 'PDF Intelligence',
    description:
      'Upload any PDF, DOCX, or PPTX. StudyOS reads it, summarizes it, generates notes, and creates quizzes — all automatically.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'hover:border-purple-500/30',
    glow: 'group-hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]',
    tag: 'AI Powered',
  },
  {
    id: 'quiz-generator',
    icon: BookOpen,
    title: 'Quiz Generator',
    description:
      'Generate MCQs, short answer, and coding questions from any topic, PDF, or notes. Set difficulty and timer. Track your results over time.',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'hover:border-green-500/30',
    glow: 'group-hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]',
    tag: 'Quiz & Test',
  },
  {
    id: 'study-planner',
    icon: Calendar,
    title: 'Study Planner',
    description:
      'AI-generated study plans, Pomodoro timer, calendar view, daily goals, and weekly schedules. Stay on track effortlessly.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'hover:border-amber-500/30',
    glow: 'group-hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]',
    tag: 'Planning',
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Study Analytics',
    description:
      'Visualize study hours, quiz scores, strong/weak topics, learning trends, and weekly heatmaps. Understand how you actually learn.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'hover:border-rose-500/30',
    glow: 'group-hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]',
    tag: 'Insights',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="section relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 dot-pattern opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl" />

      <div className="container-xl relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="feature-badge mb-4">
            <Zap className="w-3.5 h-3.5" />
            Everything You Need
          </span>
          <h2 className="text-4xl sm:text-5xl font-display font-black text-white mt-4 mb-5">
            One Platform.{' '}
            <span className="gradient-text">Infinite Learning.</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Stop switching between 10 different apps. StudyOS AI brings your entire study workflow into one intelligent, beautiful platform.
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.id}
              id={`feature-${feature.id}`}
              variants={cardVariants}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
              className="group"
            >
              <div
                className={`h-full glass rounded-2xl p-6 border border-white/5 transition-all duration-300 ${feature.border} ${feature.glow} cursor-default`}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-2xl ${feature.bg} flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>

                {/* Tag */}
                <span className="text-2xs font-semibold text-slate-500 uppercase tracking-widest mb-2 block">
                  {feature.tag}
                </span>

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>

                {/* Description */}
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>

                {/* Hover indicator */}
                <div className={`mt-5 flex items-center gap-1.5 text-xs font-semibold ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                  <span>Explore feature</span>
                  <span>→</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
