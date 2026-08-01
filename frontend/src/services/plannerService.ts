import { PlannerTask, TaskPriority, TaskStatus } from '@/types/study';
import { scopedKey } from '@/services/userScope';

const BASE_KEY = 'studyos_tasks';
const POMODORO_KEY = 'studyos_pomodoro_sessions';

function daysFromNow(n: number) {
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

const DEMO_TASKS: PlannerTask[] = [
  {
    id: 'task-1', title: 'Complete Neural Networks assignment',
    description: 'Build a 2-layer feedforward network with backpropagation',
    subject: 'AI & Machine Learning', priority: 'high', status: 'in_progress',
    due_date: daysFromNow(1), estimated_minutes: 120, tags: ['AI', 'Assignment'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'task-2', title: 'Review Calculus Chapter 5 — Integration',
    description: '', subject: 'Mathematics', priority: 'medium', status: 'todo',
    due_date: daysFromNow(2), estimated_minutes: 60, tags: ['Calculus', 'Review'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'task-3', title: 'Flashcard review — Chemistry reactions',
    description: 'SN1, SN2, E1, E2 mechanisms', subject: 'Chemistry',
    priority: 'medium', status: 'todo',
    due_date: daysFromNow(0), estimated_minutes: 30, tags: ['Flashcards'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'task-4', title: 'Read CS research paper on Transformers',
    description: '"Attention Is All You Need" — Vaswani et al.',
    subject: 'Computer Science', priority: 'low', status: 'todo',
    due_date: daysFromNow(4), estimated_minutes: 90, tags: ['Research', 'AI'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'task-5', title: 'Physics problem set — Kinematics',
    description: 'Chapters 3–4 exercises', subject: 'Physics',
    priority: 'urgent', status: 'todo',
    due_date: daysFromNow(-1), estimated_minutes: 75, tags: ['Problem Set'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'task-6', title: 'Write essay outline — Industrial Revolution',
    description: '', subject: 'History', priority: 'low', status: 'done',
    due_date: daysFromNow(-2), estimated_minutes: 45, actual_minutes: 50, tags: ['Essay'],
    created_at: new Date().toISOString(),
  },
];

function load(): PlannerTask[] {
  try { return JSON.parse(localStorage.getItem(scopedKey(BASE_KEY)) || 'null') ?? []; }
  catch { return []; }
}
function save(tasks: PlannerTask[]) { localStorage.setItem(scopedKey(BASE_KEY), JSON.stringify(tasks)); }

export const plannerService = {
  getAll(): PlannerTask[] { return load(); },

  getByDate(dateStr: string): PlannerTask[] {
    return load().filter((t) => t.due_date === dateStr);
  },

  create(data: Partial<PlannerTask>): PlannerTask {
    const tasks = load();
    const task: PlannerTask = {
      id: `task-${Date.now()}`, title: 'New Task', subject: 'General',
      priority: 'medium', status: 'todo', due_date: new Date().toISOString().split('T')[0],
      estimated_minutes: 30, tags: [], created_at: new Date().toISOString(), ...data,
    };
    tasks.unshift(task);
    save(tasks);
    return task;
  },

  update(id: string, data: Partial<PlannerTask>): PlannerTask | null {
    const tasks = load();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    tasks[idx] = { ...tasks[idx], ...data };
    save(tasks);
    return tasks[idx];
  },

  delete(id: string) { save(load().filter((t) => t.id !== id)); },

  toggleStatus(id: string): PlannerTask | null {
    const task = load().find((t) => t.id === id);
    if (!task) return null;
    const next: TaskStatus = task.status === 'done' ? 'todo' : task.status === 'todo' ? 'in_progress' : 'done';
    return this.update(id, { status: next });
  },

  getStats() {
    const tasks = load();
    return {
      total: tasks.length,
      done: tasks.filter((t) => t.status === 'done').length,
      overdue: tasks.filter((t) => t.status !== 'done' && t.due_date < new Date().toISOString().split('T')[0]).length,
      today: tasks.filter((t) => t.due_date === new Date().toISOString().split('T')[0]).length,
    };
  },
};
