import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';

const testimonials = [
  {
    id: 'testimonial-priya',
    name: 'Priya Sharma',
    role: 'Computer Science, IIT Delhi',
    avatar: 'PS',
    avatarColor: 'from-purple-500 to-brand-600',
    rating: 5,
    text: "StudyOS completely changed how I study. I uploaded my entire OS textbook and it generated 200 flashcards in seconds. My exam score jumped from 68% to 91% in one semester!",
  },
  {
    id: 'testimonial-ryan',
    name: 'Ryan Chen',
    role: 'Pre-Med, University of Toronto',
    avatar: 'RC',
    avatarColor: 'from-blue-500 to-cyan-600',
    rating: 5,
    text: "The AI tutor is insane. It's like having a personal professor available 24/7. I ask it to explain pharmacology concepts at midnight and it walks me through everything step by step.",
  },
  {
    id: 'testimonial-amara',
    name: 'Amara Okonkwo',
    role: 'MBA Student, Lagos Business School',
    avatar: 'AO',
    avatarColor: 'from-green-500 to-emerald-600',
    rating: 5,
    text: "The study planner and Pomodoro integration are a game changer. I went from barely passing to top of my class. The analytics show exactly where I'm weak — that's pure gold.",
  },
  {
    id: 'testimonial-sofia',
    name: 'Sofia Martinez',
    role: 'High School Student, Madrid',
    avatar: 'SM',
    avatarColor: 'from-rose-500 to-pink-600',
    rating: 5,
    text: "I used to spend 3 hours reading PDFs and not remembering anything. Now I upload them to StudyOS and get a summary + quiz in 30 seconds. My grades have never been better!",
  },
  {
    id: 'testimonial-dev',
    name: 'Dev Patel',
    role: 'Full Stack Developer (self-taught)',
    avatar: 'DP',
    avatarColor: 'from-amber-500 to-orange-600',
    rating: 5,
    text: "Learning programming is 10x easier with StudyOS. I paste code examples into AI Chat and it explains every line. The quiz generator tests me on concepts I'm weak at. Brilliant tool.",
  },
  {
    id: 'testimonial-zara',
    name: 'Zara Khan',
    role: 'Law Student, Oxford',
    avatar: 'ZK',
    avatarColor: 'from-indigo-500 to-violet-600',
    rating: 5,
    text: "For law, reading dense case files is brutal. StudyOS summarizes 50-page judgments into key points, then quizzes me on the holdings. I've processed more material in 1 week than I used to in a month.",
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="section relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/3 to-transparent" />

      <div className="container-xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="feature-badge mb-4">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            Student Stories
          </span>
          <h2 className="text-4xl sm:text-5xl font-display font-black text-white mt-4 mb-5">
            Real Students.{' '}
            <span className="gradient-text">Real Results.</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Join thousands of students who've transformed their academic performance with StudyOS AI.
          </p>
        </motion.div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <motion.div
              key={t.id}
              id={t.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (index % 3) * 0.1 }}
              whileHover={{ y: -4 }}
              className="glass rounded-2xl p-6 border border-white/6 hover:border-white/12 transition-all duration-300"
            >
              {/* Quote icon */}
              <Quote className="w-6 h-6 text-brand-500/50 mb-4" />

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Text */}
              <p className="text-slate-300 text-sm leading-relaxed mb-6">"{t.text}"</p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-2xs text-slate-500">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom social proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-6 glass rounded-2xl px-8 py-4 border border-white/8">
            <div className="text-center">
              <p className="text-2xl font-black text-white">2,000+</p>
              <p className="text-xs text-slate-500">Students</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center">
                <p className="text-2xl font-black text-white">4.9</p>
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              </div>
              <p className="text-xs text-slate-500">Avg Rating</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-black text-white">+23%</p>
              <p className="text-xs text-slate-500">Grade Boost</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
