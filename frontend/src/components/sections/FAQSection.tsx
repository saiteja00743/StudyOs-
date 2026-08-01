import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

const faqs = [
  {
    id: 'faq-1',
    question: 'Is StudyOS AI really free?',
    answer:
      "Yes! The free plan gives you access to all core features including AI Chat (50 msg/day), unlimited notes, PDF uploads, quiz generation, flashcards, and the study planner. No credit card required, no hidden fees.",
  },
  {
    id: 'faq-2',
    question: 'What file types can I upload?',
    answer:
      "StudyOS AI supports PDF, DOCX (Word), PPTX (PowerPoint), and TXT files. We're working on adding image-based OCR for handwritten notes in a future update.",
  },
  {
    id: 'faq-3',
    question: 'Which AI powers StudyOS?',
    answer:
      "StudyOS AI is powered by Google's Gemini model — one of the most capable AI models available. It excels at understanding academic content, explaining complex topics, and generating high-quality study materials.",
  },
  {
    id: 'faq-4',
    question: 'Is my data private and secure?',
    answer:
      "Absolutely. Your notes, files, and chat history are stored securely in Supabase with row-level security (RLS). Only you can access your data. We never sell or share your information.",
  },
  {
    id: 'faq-5',
    question: 'Can I use StudyOS on mobile?',
    answer:
      "Yes! StudyOS is fully responsive and works beautifully on all devices — phone, tablet, and desktop. A dedicated React Native mobile app is planned for Version 3.",
  },
  {
    id: 'faq-6',
    question: 'How does the quiz generator work?',
    answer:
      "You can generate quizzes from a PDF you've uploaded, your own notes, or any topic you type in. Choose question types (MCQ, short answer, coding), set difficulty (easy/medium/hard), and add a timer. Results are saved to your analytics dashboard.",
  },
  {
    id: 'faq-7',
    question: 'What subjects does the AI tutor cover?',
    answer:
      "The AI tutor can help with virtually any academic subject — mathematics, physics, chemistry, biology, computer science, history, law, literature, economics, and more. It can explain concepts, solve problems step-by-step, and quiz you on any topic.",
  },
];

function FAQItem({ faq }: { faq: typeof faqs[number] }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      id={faq.id}
      className="border-b border-white/8 last:border-0"
      layout
    >
      <button
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className={cn(
          'text-base font-medium transition-colors duration-200',
          open ? 'text-white' : 'text-slate-300 group-hover:text-white'
        )}>
          {faq.question}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className={cn(
            'w-5 h-5 transition-colors duration-200',
            open ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'
          )} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="text-slate-400 text-sm leading-relaxed pb-5">{faq.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQSection() {
  return (
    <section id="faq" className="section relative">
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
            <HelpCircle className="w-3.5 h-3.5" />
            FAQ
          </span>
          <h2 className="text-4xl sm:text-5xl font-display font-black text-white mt-4 mb-5">
            Got Questions?{' '}
            <span className="gradient-text">We've Got Answers.</span>
          </h2>
        </motion.div>

        {/* FAQ List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-3xl mx-auto glass rounded-3xl p-8 border border-white/8"
          id="faq-accordion"
        >
          {faqs.map((faq) => (
            <FAQItem key={faq.id} faq={faq} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
