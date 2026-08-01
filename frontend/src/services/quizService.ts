import { Quiz, QuizQuestion, QuizAttempt, Difficulty } from '@/types/study';

const STORAGE_KEY = 'studyos_quizzes';
const ATTEMPTS_KEY = 'studyos_quiz_attempts';

const DEMO_QUIZZES: Quiz[] = [
  {
    id: 'quiz-1',
    title: 'Python Data Structures',
    topic: 'Computer Science',
    difficulty: 'medium',
    time_limit_minutes: 10,
    tags: ['Python', 'Coding'],
    created_at: new Date().toISOString(),
    questions: [
      {
        id: 'q1', type: 'mcq', difficulty: 'easy',
        question: 'Which Python data structure uses key-value pairs?',
        options: [
          { id: 'a', text: 'List' }, { id: 'b', text: 'Tuple' },
          { id: 'c', text: 'Dictionary' }, { id: 'd', text: 'Set' },
        ],
        correct_answer: 'c',
        explanation: 'Dictionaries (dict) store data in key-value pairs and are defined with curly braces {}.',
      },
      {
        id: 'q2', type: 'mcq', difficulty: 'medium',
        question: 'What is the time complexity of accessing an element in a Python list by index?',
        options: [
          { id: 'a', text: 'O(n)' }, { id: 'b', text: 'O(log n)' },
          { id: 'c', text: 'O(1)' }, { id: 'd', text: 'O(n²)' },
        ],
        correct_answer: 'c',
        explanation: 'Python lists are backed by arrays, so index access is O(1) — constant time.',
      },
      {
        id: 'q3', type: 'true_false', difficulty: 'easy',
        question: 'Python tuples are mutable (can be changed after creation).',
        options: [{ id: 'true', text: 'True' }, { id: 'false', text: 'False' }],
        correct_answer: 'false',
        explanation: 'Tuples are immutable — they cannot be modified after creation, unlike lists.',
      },
      {
        id: 'q4', type: 'mcq', difficulty: 'hard',
        question: 'Which operation has O(1) average time complexity for a Python set?',
        options: [
          { id: 'a', text: 'Sorted iteration' }, { id: 'b', text: 'Membership test (x in set)' },
          { id: 'c', text: 'Union with large set' }, { id: 'd', text: 'None of the above' },
        ],
        correct_answer: 'b',
        explanation: 'Sets use hash tables internally, making membership tests O(1) on average.',
      },
      {
        id: 'q5', type: 'mcq', difficulty: 'medium',
        question: 'What does list.pop() do by default (with no argument)?',
        options: [
          { id: 'a', text: 'Removes the first element' }, { id: 'b', text: 'Removes a random element' },
          { id: 'c', text: 'Removes the last element' }, { id: 'd', text: 'Clears the entire list' },
        ],
        correct_answer: 'c',
        explanation: 'list.pop() with no argument removes and returns the last element (index -1).',
      },
    ],
  },
  {
    id: 'quiz-2',
    title: 'Calculus Fundamentals',
    topic: 'Mathematics',
    difficulty: 'hard',
    time_limit_minutes: 15,
    tags: ['Math', 'Calculus'],
    created_at: new Date().toISOString(),
    questions: [
      {
        id: 'c1', type: 'mcq', difficulty: 'medium',
        question: 'What is the derivative of f(x) = x³?',
        options: [
          { id: 'a', text: 'x²' }, { id: 'b', text: '3x²' },
          { id: 'c', text: '3x' }, { id: 'd', text: '6x' },
        ],
        correct_answer: 'b',
        explanation: 'Using the power rule: d/dx(xⁿ) = n·xⁿ⁻¹, so d/dx(x³) = 3x².',
      },
      {
        id: 'c2', type: 'true_false', difficulty: 'easy',
        question: 'The integral of a constant function f(x) = c is cx + C.',
        options: [{ id: 'true', text: 'True' }, { id: 'false', text: 'False' }],
        correct_answer: 'true',
        explanation: '∫c dx = cx + C, where C is the constant of integration.',
      },
      {
        id: 'c3', type: 'mcq', difficulty: 'hard',
        question: 'What is lim(x→0) of sin(x)/x?',
        options: [
          { id: 'a', text: '0' }, { id: 'b', text: 'undefined' },
          { id: 'c', text: '1' }, { id: 'd', text: '∞' },
        ],
        correct_answer: 'c',
        explanation: 'This is a fundamental limit: lim(x→0) sin(x)/x = 1. Proven by squeeze theorem.',
      },
    ],
  },
];

function loadQuizzes(): Quiz[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEMO_QUIZZES;
  } catch { return DEMO_QUIZZES; }
}

function saveQuizzes(quizzes: Quiz[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quizzes));
}

export const quizService = {
  getAll(): Quiz[] {
    return loadQuizzes();
  },
  getById(id: string): Quiz | undefined {
    return loadQuizzes().find((q) => q.id === id);
  },
  save(quiz: Quiz): Quiz {
    const quizzes = loadQuizzes();
    const idx = quizzes.findIndex((q) => q.id === quiz.id);
    if (idx >= 0) quizzes[idx] = quiz;
    else quizzes.unshift(quiz);
    saveQuizzes(quizzes);
    return quiz;
  },
  delete(id: string) {
    saveQuizzes(loadQuizzes().filter((q) => q.id !== id));
  },
  saveAttempt(attempt: QuizAttempt) {
    const all: QuizAttempt[] = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '[]');
    all.unshift(attempt);
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(all.slice(0, 50)));
  },
  getAttempts(): QuizAttempt[] {
    return JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '[]');
  },
  async generateFromTopic(topic: string, difficulty: Difficulty, count: number): Promise<Quiz> {
    // Backend call in production; mock here
    await new Promise((r) => setTimeout(r, 1200));
    const quiz: Quiz = {
      id: `quiz-${Date.now()}`,
      title: `${topic} Quiz`,
      topic,
      difficulty,
      time_limit_minutes: count * 2,
      tags: [topic],
      created_at: new Date().toISOString(),
      questions: Array.from({ length: count }, (_, i) => ({
        id: `gen-${i}`,
        type: i % 3 === 0 ? 'true_false' : 'mcq',
        difficulty,
        question: `Question ${i + 1} about ${topic}: Which of the following is correct?`,
        options: [
          { id: 'a', text: 'First option' }, { id: 'b', text: 'Second option' },
          { id: 'c', text: 'Third option' }, { id: 'd', text: 'Fourth option' },
        ],
        correct_answer: 'b',
        explanation: `This is a generated question about ${topic}. Connect to Gemini API for real explanations.`,
      })),
    };
    this.save(quiz);
    return quiz;
  },
};
