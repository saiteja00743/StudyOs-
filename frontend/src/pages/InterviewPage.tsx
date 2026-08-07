import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Brain, Code2, Users, Monitor, Server, Cpu, Database,
  ChevronRight, ChevronLeft, RotateCcw, Eye, EyeOff, CheckCircle2,
  Frown, Meh, Smile, Trophy, Clock, Zap, BookOpen, History, X,
  ArrowRight, Sparkles, Target, TrendingUp, Star,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type {
  InterviewCategory, InterviewQuestion, InterviewSession,
  InterviewAttempt, ConfidenceLevel, Difficulty,
} from '@/types/study';

// ─── Question Bank ─────────────────────────────────────────────────────────
const QUESTION_BANK: InterviewQuestion[] = [
  // DSA
  { id: 'dsa-1', category: 'dsa', difficulty: 'easy', question: 'What is the time complexity of binary search?', answer: 'O(log n) — binary search halves the search space at each step, giving logarithmic time complexity.', tips: ['Always mention the precondition: the array must be sorted.', 'Contrast with linear search O(n).', 'Mention that space complexity is O(1) for iterative, O(log n) for recursive.'], tags: ['searching', 'complexity'] },
  { id: 'dsa-2', category: 'dsa', difficulty: 'medium', question: 'Explain the difference between a stack and a queue. When would you use each?', answer: 'Stack is LIFO (Last In, First Out) — used for undo operations, call stack, DFS. Queue is FIFO (First In, First Out) — used for BFS, task scheduling, printer queues.', tips: ['Give a real-world analogy: stack = plates, queue = line at a store.', 'Mention monotonic stacks for optimization problems.', 'Discuss deque as a hybrid structure.'], tags: ['data-structures', 'stack', 'queue'] },
  { id: 'dsa-3', category: 'dsa', difficulty: 'hard', question: 'How does a hash map handle collisions? Describe at least two methods.', answer: 'Two main approaches: (1) Chaining — each bucket stores a linked list of entries that hash to the same index. (2) Open Addressing — probe for the next empty slot (linear probing, quadratic probing, double hashing).', tips: ['Discuss load factor and resizing.', 'Mention that Python dicts use open addressing.', 'Talk about worst-case O(n) vs average O(1).'], tags: ['hashing', 'collision'] },
  { id: 'dsa-4', category: 'dsa', difficulty: 'medium', question: 'What is dynamic programming? How do you identify if a problem can be solved with DP?', answer: 'DP solves problems by breaking them into overlapping subproblems and storing results (memoization/tabulation). Identify DP if: the problem has optimal substructure and overlapping subproblems (e.g., Fibonacci, knapsack, LCS).', tips: ['Top-down = recursion + memoization; Bottom-up = tabulation.', 'Draw the recursion tree to identify overlapping subproblems.', 'Common patterns: 1D DP, 2D DP, interval DP.'], tags: ['dp', 'optimization'] },
  { id: 'dsa-5', category: 'dsa', difficulty: 'easy', question: 'What is a linked list and what are its advantages over an array?', answer: 'A linked list is a sequential data structure where each node holds data and a pointer to the next node. Advantages: O(1) insertions/deletions at head, dynamic size, no memory pre-allocation needed.', tips: ['Disadvantages: O(n) access, poor cache locality.', 'Mention doubly linked list for O(1) deletion anywhere.', 'Used in LRU cache implementation.'], tags: ['linked-list', 'arrays'] },
  { id: 'dsa-6', category: 'dsa', difficulty: 'hard', question: 'Explain Dijkstra\'s algorithm and its time complexity.', answer: "Dijkstra finds shortest paths from a source vertex to all other vertices in a weighted graph with non-negative edges. Uses a min-heap priority queue. Time: O((V + E) log V) with a binary heap.", tips: ['Does NOT work with negative weights — use Bellman-Ford.', 'Relaxation step: dist[v] = min(dist[v], dist[u] + weight(u,v)).', 'Used in GPS navigation, network routing.'], tags: ['graphs', 'shortest-path'] },

  // System Design
  { id: 'sd-1', category: 'system_design', difficulty: 'medium', question: 'How would you design a URL shortener like bit.ly?', answer: 'Key components: (1) API layer to receive long URL, (2) Hashing service (Base62 encoding of auto-incremented ID), (3) Database (long_url → short_code mapping), (4) Redirect service, (5) Cache (Redis) for hot URLs. Consider: collision handling, expiry, analytics.', tips: ['Estimate scale first: 100M URLs/day = ~1000 writes/sec.', 'Discuss read-heavy vs write-heavy ratio (~100:1 reads).', 'Mention CDN for global low-latency redirects.'], tags: ['distributed-systems', 'hashing', 'caching'] },
  { id: 'sd-2', category: 'system_design', difficulty: 'hard', question: 'Design a distributed message queue (like Kafka). What are the key design decisions?', answer: 'Producers publish to topics/partitions. Brokers store logs (append-only). Consumers pull messages via consumer groups. Key decisions: partition strategy, replication factor, offset management, retention policy, delivery guarantees (at-least-once / exactly-once).', tips: ['Discuss CAP theorem tradeoffs.', 'Mention leader election and failover.', 'Kafka uses log compaction for efficiency.'], tags: ['kafka', 'distributed', 'messaging'] },
  { id: 'sd-3', category: 'system_design', difficulty: 'medium', question: 'Explain horizontal vs vertical scaling. When would you choose each?', answer: 'Vertical scaling: add more resources (CPU/RAM) to existing machine — simpler but has limits and single point of failure. Horizontal scaling: add more machines — better fault tolerance, unlimited scale, but requires load balancing and distributed state management.', tips: ['Most modern systems prefer horizontal scaling.', 'Stateless services scale horizontally more easily.', 'Databases often scale vertically first, then shard.'], tags: ['scalability', 'architecture'] },
  { id: 'sd-4', category: 'system_design', difficulty: 'easy', question: 'What is a CDN and how does it improve performance?', answer: 'Content Delivery Network — a geographically distributed network of servers that cache static content close to users. Reduces latency by serving from the nearest edge node, reduces origin server load, improves availability.', tips: ['Static assets (images, CSS, JS) are ideal CDN candidates.', 'Mention cache invalidation strategies.', 'Examples: Cloudflare, AWS CloudFront, Akamai.'], tags: ['cdn', 'performance', 'caching'] },

  // Behavioral
  { id: 'beh-1', category: 'behavioral', difficulty: 'medium', question: 'Tell me about a time you disagreed with a team decision. How did you handle it?', answer: 'Use STAR format: Situation → Task → Action → Result. Show that you voiced your concern respectfully with data/reasoning, listened to others\' perspectives, and ultimately committed to the team\'s decision while suggesting a follow-up review point.', tips: ['Avoid saying you just "went along" — show critical thinking.', 'Show emotional intelligence and collaboration.', 'Quantify the outcome if possible.'], tags: ['conflict', 'teamwork', 'star'] },
  { id: 'beh-2', category: 'behavioral', difficulty: 'easy', question: 'Describe a project you\'re most proud of. Why?', answer: 'Highlight a specific project with clear impact. Cover: problem you solved, your role, technical decisions made, challenges overcome, and measurable outcome (users, revenue, performance improvement).', tips: ['Tailor to the role you\'re interviewing for.', 'Demonstrate ownership and initiative.', 'Mention what you learned or would do differently.'], tags: ['achievement', 'communication'] },
  { id: 'beh-3', category: 'behavioral', difficulty: 'medium', question: 'How do you handle working under tight deadlines with incomplete requirements?', answer: 'Approach: (1) Clarify the most critical requirements immediately, (2) Break work into deliverables and communicate realistic timelines, (3) Make explicit tradeoffs and document assumptions, (4) Deliver an MVP first then iterate.', tips: ['Show proactive communication, not just execution.', 'Mention how you manage stakeholder expectations.', 'Discuss how you handle scope creep.'], tags: ['time-management', 'communication', 'agile'] },

  // Frontend
  { id: 'fe-1', category: 'frontend', difficulty: 'easy', question: 'Explain the difference between `null`, `undefined`, and `NaN` in JavaScript.', answer: '`undefined`: variable declared but not assigned. `null`: explicit "no value" assignment (intentional absence). `NaN`: result of invalid numeric operation (e.g., 0/0, parseInt("abc")) — notably NaN !== NaN.', tips: ['typeof null === "object" — a historical JS bug.', 'Use Number.isNaN() instead of global isNaN() for accuracy.', 'Nullish coalescing (??) and optional chaining (?.) are modern solutions.'], tags: ['javascript', 'types'] },
  { id: 'fe-2', category: 'frontend', difficulty: 'medium', question: 'What is the virtual DOM and why does React use it?', answer: 'The virtual DOM is an in-memory JS representation of the real DOM. React diffs the new VDOM against the previous one (reconciliation) and batches only the minimal set of real DOM updates. This avoids expensive direct DOM manipulation for every state change.', tips: ['Mention that React 18 uses concurrent rendering / Fiber.', 'Contrast with Svelte\'s compile-time approach (no VDOM).', 'Keys are critical for efficient list reconciliation.'], tags: ['react', 'performance', 'dom'] },
  { id: 'fe-3', category: 'frontend', difficulty: 'medium', question: 'Explain the CSS box model and how `box-sizing: border-box` changes things.', answer: 'Default (content-box): width applies to content only — padding and border add to total size. border-box: width includes content + padding + border — much more predictable for layout. Most modern resets apply `*, *::before, *::after { box-sizing: border-box }`.', tips: ['Draw a diagram in a whiteboard interview.', 'Mention `outline` doesn\'t affect box model.', 'Flex/Grid containers override some box model behaviors.'], tags: ['css', 'layout'] },
  { id: 'fe-4', category: 'frontend', difficulty: 'hard', question: 'What are Web Workers and when should you use them?', answer: 'Web Workers run JavaScript in a background thread, separate from the main UI thread. Use them for CPU-intensive tasks (image processing, data parsing, complex calculations) that would otherwise block rendering. Communicate via postMessage/onmessage. Cannot access DOM.', tips: ['SharedArrayBuffer allows shared memory between workers.', 'Service Workers are different — they intercept network requests.', 'Mention Comlink library for easier worker communication.'], tags: ['javascript', 'performance', 'threading'] },

  // Backend
  { id: 'be-1', category: 'backend', difficulty: 'easy', question: 'What is REST? What are the key constraints of a RESTful API?', answer: 'REST (Representational State Transfer) is an architectural style. Key constraints: (1) Stateless, (2) Client-server, (3) Cacheable, (4) Uniform interface (resource-based URLs, HTTP verbs), (5) Layered system, (6) Code on demand (optional).', tips: ['HTTP verbs: GET (read), POST (create), PUT/PATCH (update), DELETE.', 'Status codes matter: 200, 201, 400, 401, 403, 404, 500.', 'Contrast with GraphQL — single endpoint, client specifies shape.'], tags: ['api', 'rest', 'http'] },
  { id: 'be-2', category: 'backend', difficulty: 'medium', question: 'Explain the difference between SQL and NoSQL databases. When would you choose each?', answer: 'SQL: relational, schema-rigid, ACID transactions, great for structured data with complex queries. NoSQL: schema-flexible, horizontally scalable, better for unstructured/semi-structured data. Choose SQL for financial systems, NoSQL for real-time apps, content stores, time-series data.', tips: ['CAP theorem: Consistency vs Availability vs Partition tolerance.', 'MongoDB = document, Cassandra = column, Redis = key-value, Neo4j = graph.', 'Many modern systems use both (polyglot persistence).'], tags: ['databases', 'sql', 'nosql'] },
  { id: 'be-3', category: 'backend', difficulty: 'hard', question: 'What is database indexing and what are the tradeoffs?', answer: 'An index is a data structure (usually B-tree) that speeds up data retrieval at the cost of extra storage and slower writes (index must be updated on INSERT/UPDATE/DELETE). Composite indexes follow the leftmost prefix rule. Over-indexing hurts write performance.', tips: ['EXPLAIN ANALYZE in PostgreSQL shows query plan.', 'Partial indexes for filtered queries (e.g., WHERE status = \'active\').', 'Covering index: all needed columns in the index itself.'], tags: ['databases', 'performance', 'indexing'] },

  // ML
  { id: 'ml-1', category: 'ml', difficulty: 'easy', question: 'What is the difference between supervised, unsupervised, and reinforcement learning?', answer: 'Supervised: labeled training data, predict output (classification/regression). Unsupervised: no labels, find patterns (clustering, dimensionality reduction). Reinforcement: agent learns by taking actions and receiving rewards from environment.', tips: ['Examples: Supervised = spam filter; Unsupervised = customer segmentation; RL = game-playing AI.', 'Semi-supervised uses small labeled + large unlabeled dataset.', 'Self-supervised (e.g., GPT pre-training) is a form of unsupervised learning.'], tags: ['ml-basics', 'supervised', 'unsupervised'] },
  { id: 'ml-2', category: 'ml', difficulty: 'medium', question: 'What is overfitting and how do you prevent it?', answer: 'Overfitting: model performs well on training data but poorly on unseen data — it\'s memorizing noise. Prevention: regularization (L1/L2), dropout, early stopping, cross-validation, data augmentation, simpler model, more training data.', tips: ['Plot train vs validation loss to diagnose.', 'L1 (Lasso) promotes sparsity; L2 (Ridge) shrinks weights.', 'Bias-variance tradeoff: overfitting = high variance, underfitting = high bias.'], tags: ['overfitting', 'regularization'] },
  { id: 'ml-3', category: 'ml', difficulty: 'hard', question: 'Explain the attention mechanism in transformers.', answer: 'Attention allows the model to weigh the importance of different positions in the input sequence when producing each output. Scaled dot-product attention: Q·K^T / √d_k → softmax → multiply by V. Multi-head attention runs multiple attention functions in parallel for different representation subspaces.', tips: ['Q, K, V = Query, Key, Value — learned linear projections.', 'Self-attention: Q, K, V all come from the same sequence.', 'Positional encoding adds order info since attention is permutation-invariant.'], tags: ['transformers', 'attention', 'nlp'] },

  // SQL
  { id: 'sql-1', category: 'sql', difficulty: 'easy', question: 'What is the difference between INNER JOIN, LEFT JOIN, and FULL OUTER JOIN?', answer: 'INNER JOIN: only rows matching in both tables. LEFT JOIN: all rows from left table + matching rows from right (NULLs for non-matches). FULL OUTER JOIN: all rows from both tables with NULLs where no match.', tips: ['Draw Venn diagrams to explain joins.', 'RIGHT JOIN is the mirror of LEFT JOIN.', 'CROSS JOIN = Cartesian product (all combinations).'], tags: ['sql', 'joins'] },
  { id: 'sql-2', category: 'sql', difficulty: 'medium', question: 'What is a window function? Give an example.', answer: 'Window functions perform calculations across a set of rows related to the current row, without collapsing them into groups. Example: ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC) assigns rank within each department.', tips: ['Common: ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD, SUM OVER.', 'Unlike GROUP BY, window functions keep all rows.', 'PARTITION BY is the grouping, ORDER BY defines the window frame.'], tags: ['sql', 'window-functions', 'analytics'] },
  { id: 'sql-3', category: 'sql', difficulty: 'hard', question: 'Explain database normalization. What are 1NF, 2NF, and 3NF?', answer: '1NF: atomic values, no repeating groups. 2NF: 1NF + no partial dependencies on composite primary key. 3NF: 2NF + no transitive dependencies (non-key column depends only on primary key). Goal: reduce redundancy and update anomalies.', tips: ['BCNF (Boyce-Codd) is a stronger form of 3NF.', 'Denormalization is sometimes done for performance (analytics).', 'Each normal form builds on the previous.'], tags: ['sql', 'normalization', 'database-design'] },
];

// ─── Category Config ────────────────────────────────────────────────────────
const CATEGORIES: { id: InterviewCategory; label: string; icon: React.ElementType; color: string; bg: string; desc: string }[] = [
  { id: 'dsa', label: 'DSA', icon: Brain, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', desc: 'Data Structures & Algorithms' },
  { id: 'system_design', label: 'System Design', icon: Server, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', desc: 'Distributed Systems & Architecture' },
  { id: 'behavioral', label: 'Behavioral', icon: Users, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20', desc: 'STAR Method & Soft Skills' },
  { id: 'frontend', label: 'Frontend', icon: Monitor, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', desc: 'JS, CSS, React & Browser APIs' },
  { id: 'backend', label: 'Backend', icon: Code2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', desc: 'APIs, Databases & Architecture' },
  { id: 'ml', label: 'Machine Learning', icon: Cpu, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', desc: 'ML Concepts & Deep Learning' },
  { id: 'sql', label: 'SQL', icon: Database, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', desc: 'Queries, Joins & Optimization' },
];

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; cls: string }> = {
  easy: { label: 'Easy', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  medium: { label: 'Medium', cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  hard: { label: 'Hard', cls: 'text-red-400 bg-red-500/10 border-red-500/20' },
};

const CONFIDENCE_CONFIG: Record<ConfidenceLevel, { icon: React.ElementType; label: string; cls: string; emoji: string }> = {
  low: { icon: Frown, label: 'Need Practice', cls: 'text-red-400 bg-red-500/10 border-red-500/30 hover:bg-red-500/20', emoji: '😕' },
  medium: { icon: Meh, label: 'Getting There', cls: 'text-amber-400 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20', emoji: '😐' },
  high: { icon: Smile, label: 'Got it!', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20', emoji: '😊' },
};

// ─── LocalStorage helpers ───────────────────────────────────────────────────
const LS_KEY = 'studyos_interview_sessions';

function loadSessions(): InterviewSession[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}

function saveSession(s: InterviewSession) {
  const all = loadSessions().filter(x => x.id !== s.id);
  localStorage.setItem(LS_KEY, JSON.stringify([s, ...all].slice(0, 50)));
}

// ─── Main Page ──────────────────────────────────────────────────────────────
type View = 'home' | 'session' | 'results' | 'history';

export function InterviewPage() {
  const [view, setView] = useState<View>('home');
  const [selectedCategory, setSelectedCategory] = useState<InterviewCategory | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [sessionQuestions, setSessionQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [attempts, setAttempts] = useState<InterviewAttempt[]>([]);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [startTime] = useState(() => new Date().toISOString());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setSessions(loadSessions()); }, []);

  const startSession = (cat: InterviewCategory) => {
    const pool = QUESTION_BANK.filter(
      q => q.category === cat && q.difficulty === selectedDifficulty
    );
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(5, pool.length));
    if (shuffled.length === 0) {
      // Fallback to any difficulty in category
      const fallback = QUESTION_BANK.filter(q => q.category === cat).slice(0, 5);
      setSessionQuestions(fallback);
    } else {
      setSessionQuestions(shuffled);
    }
    setSelectedCategory(cat);
    setCurrentIdx(0);
    setShowAnswer(false);
    setUserAnswer('');
    setAttempts([]);
    setView('session');
  };

  const handleConfidence = (level: ConfidenceLevel) => {
    const attempt: InterviewAttempt = {
      questionId: sessionQuestions[currentIdx].id,
      userAnswer,
      confidence: level,
      answeredAt: new Date().toISOString(),
    };
    const newAttempts = [...attempts, attempt];
    setAttempts(newAttempts);

    if (currentIdx < sessionQuestions.length - 1) {
      setCurrentIdx(i => i + 1);
      setShowAnswer(false);
      setUserAnswer('');
    } else {
      // Session complete
      const session: InterviewSession = {
        id: sessionId,
        category: selectedCategory!,
        difficulty: selectedDifficulty,
        totalQuestions: sessionQuestions.length,
        attempts: newAttempts,
        startedAt: startTime,
        completedAt: new Date().toISOString(),
      };
      saveSession(session);
      setSessions(loadSessions());
      setView('results');
    }
  };

  const currentQuestion = sessionQuestions[currentIdx];
  const catConfig = CATEGORIES.find(c => c.id === selectedCategory);

  const confidenceStats = (atts: InterviewAttempt[]) => ({
    high: atts.filter(a => a.confidence === 'high').length,
    medium: atts.filter(a => a.confidence === 'medium').length,
    low: atts.filter(a => a.confidence === 'low').length,
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Mic className="w-6 h-6 text-brand-400" />
            Interview Prep
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Practice mock questions · build confidence · track progress
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setView('history'); setSessions(loadSessions()); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/10 transition-all"
          >
            <History className="w-4 h-4" /> History
          </button>
          {view !== 'home' && (
            <button
              onClick={() => setView('home')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-gradient text-white text-sm font-medium hover:opacity-90 transition-all shadow-glow-sm"
            >
              <RotateCcw className="w-4 h-4" /> New Session
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── HOME: Category & Difficulty picker ── */}
        {view === 'home' && (
          <motion.div key="home" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-6">
            {/* Difficulty */}
            <div className="glass rounded-2xl p-5 border border-white/5">
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-brand-400" /> Select Difficulty
              </h2>
              <div className="flex gap-3">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setSelectedDifficulty(d)}
                    className={cn(
                      'flex-1 py-3 rounded-xl text-sm font-semibold border transition-all',
                      selectedDifficulty === d
                        ? DIFFICULTY_CONFIG[d].cls + ' border-current'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                    )}
                  >
                    {DIFFICULTY_CONFIG[d].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category grid */}
            <div>
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-400" /> Choose a Category
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {CATEGORIES.map(({ id, label, icon: Icon, color, bg, desc }) => (
                  <motion.button
                    key={id}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => startSession(id)}
                    className={cn(
                      'flex flex-col items-start p-4 rounded-2xl border text-left transition-all group relative overflow-hidden',
                      bg
                    )}
                  >
                    <div className={cn('absolute top-0 right-0 w-20 h-20 rounded-full opacity-5 -translate-y-1/2 translate-x-1/2', color.replace('text-', 'bg-'))} />
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', bg)}>
                      <Icon className={cn('w-5 h-5', color)} />
                    </div>
                    <span className="text-sm font-bold text-white">{label}</span>
                    <span className="text-2xs text-slate-500 mt-0.5 leading-snug">{desc}</span>
                    <ChevronRight className={cn('w-3.5 h-3.5 mt-2 opacity-50 group-hover:opacity-100 transition-all group-hover:translate-x-1', color)} />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Stats banner */}
            {sessions.length > 0 && (
              <div className="glass rounded-2xl p-5 border border-white/5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-400" /> Your Progress
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-black text-white">{sessions.length}</p>
                    <p className="text-2xs text-slate-500">Sessions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-emerald-400">
                      {sessions.reduce((acc, s) => acc + s.attempts.filter(a => a.confidence === 'high').length, 0)}
                    </p>
                    <p className="text-2xs text-slate-500">Mastered</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-amber-400">
                      {sessions.reduce((acc, s) => acc + s.totalQuestions, 0)}
                    </p>
                    <p className="text-2xs text-slate-500">Questions</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── SESSION: Question Q&A ── */}
        {view === 'session' && currentQuestion && (
          <motion.div key="session" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-4">
            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-brand-gradient rounded-full"
                  animate={{ width: `${((currentIdx) / sessionQuestions.length) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span className="text-2xs text-slate-400 font-mono">{currentIdx + 1}/{sessionQuestions.length}</span>
            </div>

            {/* Category + Difficulty badge */}
            <div className="flex items-center gap-2">
              {catConfig && (
                <span className={cn('px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1', catConfig.bg, catConfig.color)}>
                  <catConfig.icon className="w-3.5 h-3.5" />{catConfig.label}
                </span>
              )}
              <span className={cn('px-3 py-1 rounded-full text-xs font-semibold border', DIFFICULTY_CONFIG[currentQuestion.difficulty].cls)}>
                {DIFFICULTY_CONFIG[currentQuestion.difficulty].label}
              </span>
              {currentQuestion.tags.map(t => (
                <span key={t} className="px-2 py-0.5 rounded-full text-2xs bg-white/5 text-slate-500">{t}</span>
              ))}
            </div>

            {/* Question card */}
            <motion.div
              layout
              className="glass rounded-2xl p-6 border border-white/10 space-y-4"
            >
              <p className="text-white font-semibold text-lg leading-relaxed">{currentQuestion.question}</p>

              {/* User answer textarea */}
              <div>
                <label className="text-2xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">
                  Your Answer
                </label>
                <textarea
                  ref={textareaRef}
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here... (optional — helps reinforce learning)"
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-brand-500/50 resize-none transition-all"
                  disabled={showAnswer}
                />
              </div>

              {/* Reveal button */}
              {!showAnswer ? (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-medium hover:opacity-90 transition-all shadow-glow-sm"
                >
                  <Eye className="w-4 h-4" /> Reveal Answer & Tips
                </button>
              ) : (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                  {/* Model Answer */}
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                    <h4 className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Model Answer
                    </h4>
                    <p className="text-slate-200 text-sm leading-relaxed">{currentQuestion.answer}</p>
                  </div>

                  {/* Tips */}
                  {currentQuestion.tips.length > 0 && (
                    <div className="bg-brand-500/5 border border-brand-500/20 rounded-xl p-4">
                      <h4 className="text-brand-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Pro Tips
                      </h4>
                      <ul className="space-y-1.5">
                        {currentQuestion.tips.map((tip, i) => (
                          <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                            <span className="text-brand-400 mt-0.5">•</span> {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Confidence rating */}
                  <div>
                    <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">How confident were you?</p>
                    <div className="flex gap-2">
                      {(['low', 'medium', 'high'] as ConfidenceLevel[]).map(level => {
                        const cfg = CONFIDENCE_CONFIG[level];
                        return (
                          <motion.button
                            key={level}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleConfidence(level)}
                            className={cn('flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all', cfg.cls)}
                          >
                            <span className="text-lg">{cfg.emoji}</span>
                            <span>{cfg.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* ── RESULTS: Session summary ── */}
        {view === 'results' && (
          <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
            <div className="glass rounded-2xl p-8 border border-white/10 text-center">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
                className="w-20 h-20 rounded-full bg-brand-gradient flex items-center justify-center mx-auto mb-4 shadow-glow"
              >
                <Trophy className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-black text-white mb-1">Session Complete!</h2>
              <p className="text-slate-400 text-sm">
                You answered {attempts.length} {selectedCategory?.replace('_', ' ')} questions
              </p>

              <div className="grid grid-cols-3 gap-4 mt-6">
                {(['high', 'medium', 'low'] as ConfidenceLevel[]).map(level => {
                  const cfg = CONFIDENCE_CONFIG[level];
                  const count = attempts.filter(a => a.confidence === level).length;
                  return (
                    <div key={level} className={cn('rounded-xl p-4 border', cfg.cls.split(' hover:')[0])}>
                      <p className="text-2xl font-black">{count}</p>
                      <p className="text-xs mt-0.5 opacity-75">{cfg.emoji} {cfg.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Question review */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Question Review</h3>
              {sessionQuestions.map((q, i) => {
                const attempt = attempts[i];
                const cfg = attempt ? CONFIDENCE_CONFIG[attempt.confidence] : null;
                return (
                  <div key={q.id} className="glass rounded-xl p-4 border border-white/5 flex items-start gap-3">
                    <span className="text-slate-600 text-xs font-mono mt-0.5">Q{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium line-clamp-1">{q.question}</p>
                    </div>
                    {cfg && (
                      <span className={cn('px-2 py-0.5 rounded-full text-xs border flex-shrink-0', cfg.cls.split(' hover:')[0])}>
                        {cfg.emoji}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setView('home')}
                className="flex-1 py-3 rounded-xl bg-brand-gradient text-white font-medium hover:opacity-90 transition-all shadow-glow-sm flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" /> Practice Again
              </button>
              <button
                onClick={() => setView('history')}
                className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 font-medium hover:bg-white/5 transition-all flex items-center justify-center gap-2"
              >
                <History className="w-4 h-4" /> View History
              </button>
            </div>
          </motion.div>
        )}

        {/* ── HISTORY: Past sessions ── */}
        {view === 'history' && (
          <motion.div key="history" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-brand-400" /> Session History
            </h2>
            {sessions.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Mic className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No sessions yet. Start practicing!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map(s => {
                  const stats = confidenceStats(s.attempts);
                  const cat = CATEGORIES.find(c => c.id === s.category);
                  return (
                    <div key={s.id} className="glass rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-3">
                        {cat && <cat.icon className={cn('w-5 h-5', cat.color)} />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">{cat?.label || s.category}</p>
                          <p className="text-2xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(s.startedAt).toLocaleDateString()} ·
                            <span className={DIFFICULTY_CONFIG[s.difficulty].cls}>{DIFFICULTY_CONFIG[s.difficulty].label}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-emerald-400">😊 {stats.high}</span>
                          <span className="text-amber-400">😐 {stats.medium}</span>
                          <span className="text-red-400">😕 {stats.low}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
