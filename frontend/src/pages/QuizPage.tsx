import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Zap, Plus, Trash2, Clock, ChevronRight, CheckCircle2,
  XCircle, BarChart3, Target, Loader2, Sparkles, RotateCcw,
  Trophy, AlertTriangle, Filter, TrendingUp,
} from 'lucide-react';
import { Quiz, QuizQuestion, Difficulty } from '@/types/study';
import { quizService } from '@/services/quizService';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

const DIFF_COLORS: Record<Difficulty, string> = {
  easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  hard: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
};

// ─── Quiz Runner ──────────────────────────────────────────────
function QuizRunner({ quiz, onFinish }: { quiz: Quiz; onFinish: (score: number, total: number, timeSec: number) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quiz.time_limit_minutes * 60);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(interval); handleFinish(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const question = quiz.questions[currentIndex];
  const selected = answers[question.id];
  const isAnswered = !!selected;
  const isCorrect = selected === question.correct_answer;

  const handleAnswer = (optionId: string) => {
    if (isAnswered) return;
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentIndex < quiz.questions.length - 1) setCurrentIndex((i) => i + 1);
    else handleFinish();
  };

  const handleFinish = useCallback(() => {
    const score = quiz.questions.filter((q) => answers[q.id] === q.correct_answer).length;
    const timeSec = Math.floor((Date.now() - startTime.current) / 1000);
    onFinish(score, quiz.questions.length, timeSec);
  }, [answers, quiz, onFinish]);

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const progress = ((currentIndex + (isAnswered ? 1 : 0)) / quiz.questions.length) * 100;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="glass rounded-2xl p-4 border border-white/5 flex items-center justify-between">
        <div className="text-sm text-slate-300 font-medium">
          Question {currentIndex + 1} <span className="text-slate-500">/ {quiz.questions.length}</span>
        </div>
        <div className="flex-1 mx-6">
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-brand-gradient rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
        <div className={cn('flex items-center gap-1.5 text-sm font-mono font-bold', timeLeft < 60 ? 'text-danger' : 'text-slate-300')}>
          <Clock className="w-4 h-4" /> {mm}:{ss}
        </div>
      </div>

      {/* Question Card */}
      <div className="glass rounded-2xl p-6 border border-white/5 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-white leading-relaxed flex-1">{question.question}</h3>
          <span className={cn('px-2 py-0.5 rounded-full text-2xs font-semibold border', DIFF_COLORS[question.difficulty])}>
            {question.difficulty}
          </span>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {question.options?.map((opt) => {
            const isSelected = selected === opt.id;
            const isRight = opt.id === question.correct_answer;
            let style = 'border-white/10 bg-white/3 hover:bg-white/8 hover:border-brand-500/30 cursor-pointer';
            if (isAnswered) {
              if (isRight) style = 'border-success/50 bg-success/10 cursor-default';
              else if (isSelected) style = 'border-danger/50 bg-danger/10 cursor-default';
              else style = 'border-white/5 bg-white/2 cursor-default opacity-50';
            }

            return (
              <motion.button
                key={opt.id}
                onClick={() => handleAnswer(opt.id)}
                whileHover={!isAnswered ? { x: 4 } : {}}
                className={cn('w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all', style)}
              >
                <span className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border',
                  isAnswered && isRight ? 'bg-success text-white border-success'
                    : isAnswered && isSelected ? 'bg-danger text-white border-danger'
                    : 'bg-white/5 text-slate-400 border-white/10'
                )}>
                  {opt.id.toUpperCase()}
                </span>
                <span className="text-sm text-slate-200 flex-1">{opt.text}</span>
                {isAnswered && isRight && <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />}
                {isAnswered && isSelected && !isRight && <XCircle className="w-4 h-4 text-danger flex-shrink-0" />}
              </motion.button>
            );
          })}
        </div>

        {/* Explanation */}
        <AnimatePresence>
          {showExplanation && question.explanation && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className={cn('p-4 rounded-xl border text-sm', isCorrect ? 'bg-success/8 border-success/20 text-emerald-200' : 'bg-danger/8 border-danger/20 text-rose-200')}
            >
              <p className="font-semibold mb-1 flex items-center gap-1.5">
                {isCorrect ? <><CheckCircle2 className="w-4 h-4" /> Correct!</> : <><XCircle className="w-4 h-4" /> Incorrect</>}
              </p>
              <p className="text-slate-300">{question.explanation}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Next Button */}
        {isAnswered && (
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={handleNext}
            className="w-full py-3 rounded-xl bg-brand-gradient text-white font-semibold text-sm hover:opacity-90 transition-all shadow-glow-sm flex items-center justify-center gap-2"
          >
            {currentIndex < quiz.questions.length - 1 ? <><ChevronRight className="w-4 h-4" />Next Question</> : <><Trophy className="w-4 h-4" />Finish Quiz</>}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Quiz Results ─────────────────────────────────────────────
function QuizResults({ score, total, timeSec, onRetry, onBack }: {
  score: number; total: number; timeSec: number; onRetry: () => void; onBack: () => void;
}) {
  const pct = Math.round((score / total) * 100);
  const grade = pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F';
  const gradeColor = pct >= 80 ? 'text-success' : pct >= 60 ? 'text-amber-400' : 'text-danger';

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto text-center space-y-6">
      <div className={cn('text-7xl font-black', gradeColor)}>{grade}</div>
      <div>
        <p className="text-3xl font-black text-white">{pct}%</p>
        <p className="text-slate-400 mt-1">{score} / {total} correct · {Math.floor(timeSec / 60)}m {timeSec % 60}s</p>
      </div>
      <div className="glass rounded-2xl p-4 border border-white/5 grid grid-cols-3 gap-4 text-center">
        {[
          { label: 'Score', value: `${score}/${total}`, color: 'text-brand-400' },
          { label: 'Accuracy', value: `${pct}%`, color: gradeColor },
          { label: 'Time', value: `${Math.floor(timeSec / 60)}:${String(timeSec % 60).padStart(2, '0')}`, color: 'text-cyan-400' },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <p className={cn('text-xl font-black', color)}>{value}</p>
            <p className="text-2xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm hover:bg-white/5 transition-all">Back to Quizzes</button>
        <button onClick={onRetry} className="flex-1 py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-medium hover:opacity-90 transition-all shadow-glow-sm flex items-center justify-center gap-1.5">
          <RotateCcw className="w-4 h-4" /> Retry Quiz
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Quiz Page ───────────────────────────────────────────
export function QuizPage() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [mode, setMode] = useState<'list' | 'running' | 'results'>('list');
  const [results, setResults] = useState<{ score: number; total: number; timeSec: number } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [genTopic, setGenTopic] = useState('');
  const [genDifficulty, setGenDifficulty] = useState<Difficulty>('medium');
  const [genCount, setGenCount] = useState(5);

  const refresh = async () => {
    if (!user?.id) return;
    const all = await quizService.getAll(user.id);
    setQuizzes(all);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [user?.id]);

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setResults(null);
    setMode('running');
  };

  const handleFinish = async (score: number, total: number, timeSec: number) => {
    if (user?.id && activeQuiz) {
      await quizService.saveAttempt(user.id, {
        quiz_id: activeQuiz.id,
        answers: {},
        score,
        total,
        time_taken_seconds: timeSec,
        completed_at: new Date().toISOString(),
      });
    }
    setResults({ score, total, timeSec });
    setMode('results');
  };

  const handleGenerate = async () => {
    if (!genTopic.trim() || !user?.id) return;
    setGenerating(true);
    const quiz = await quizService.generateFromTopic(user.id, genTopic.trim(), genDifficulty, genCount);
    await refresh();
    setGenerating(false);
    handleStartQuiz(quiz);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await quizService.delete(id);
    await refresh();
  };

  if (mode === 'running' && activeQuiz) {
    return (
      <div className="max-w-2xl mx-auto py-4">
        <QuizRunner quiz={activeQuiz} onFinish={handleFinish} />
      </div>
    );
  }

  if (mode === 'results' && results) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <QuizResults {...results} onRetry={() => handleStartQuiz(activeQuiz!)} onBack={() => setMode('list')} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-brand-400" /> Quiz Generator
        </h1>
        <p className="text-slate-400 text-sm mt-1">Test your knowledge with AI-generated or curated quizzes.</p>
      </div>

      {/* AI Generate Panel */}
      <div className="glass rounded-2xl p-5 border border-brand-500/20 bg-brand-500/5">
        <h2 className="text-sm font-semibold text-brand-300 flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4" /> Generate Quiz with AI
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <input
            type="text" value={genTopic} onChange={(e) => setGenTopic(e.target.value)}
            placeholder="Topic (e.g. Photosynthesis)"
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500/30 outline-none"
          />
          <select
            value={genDifficulty} onChange={(e) => setGenDifficulty(e.target.value as Difficulty)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:ring-1 focus:ring-brand-500/50 outline-none"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <div className="flex gap-2">
            <select
              value={genCount} onChange={(e) => setGenCount(Number(e.target.value))}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:ring-1 focus:ring-brand-500/50 outline-none"
            >
              {[3, 5, 10, 15, 20].map((n) => <option key={n} value={n}>{n} Questions</option>)}
            </select>
            <button
              onClick={handleGenerate} disabled={!genTopic.trim() || generating}
              className="px-4 py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all shadow-glow-sm flex items-center gap-1.5 whitespace-nowrap"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {generating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      </div>

      {/* Quiz List */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-400" /> Available Quizzes ({quizzes.length})
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {quizzes.map((quiz) => (
            <motion.div
              key={quiz.id} whileHover={{ y: -2, scale: 1.01 }}
              className="glass rounded-2xl p-5 border border-white/5 hover:border-brand-500/20 transition-all group cursor-pointer"
              onClick={() => handleStartQuiz(quiz)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-brand-400" />
                </div>
                <span className={cn('px-2 py-0.5 rounded-full text-2xs font-semibold border', DIFF_COLORS[quiz.difficulty])}>
                  {quiz.difficulty}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1 group-hover:text-brand-300 transition-colors">{quiz.title}</h3>
              <p className="text-2xs text-slate-500 mb-3">{quiz.topic}</p>
              <div className="flex items-center justify-between text-2xs text-slate-500">
                <span className="flex items-center gap-1"><Target className="w-3 h-3" />{quiz.questions.length} questions</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{quiz.time_limit_minutes} min</span>
                <button
                  onClick={(e) => handleDelete(quiz.id, e)}
                  className="hover:text-danger transition-colors p-1 rounded-lg hover:bg-white/5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
