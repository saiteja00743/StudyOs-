/**
 * plannerService.ts — Supabase Cloud Storage
 * All tasks stored in the `planner_tasks` table, scoped to user via RLS.
 */
import { PlannerTask, TaskStatus } from '@/types/study';
import { rawFrom } from '@/services/supabase';

export const plannerService = {
  async getAll(userId: string): Promise<PlannerTask[]> {
    const { data, error } = await rawFrom('planner_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });
    if (error) { console.error('plannerService.getAll:', error.message); return []; }
    return (data as PlannerTask[]) ?? [];
  },

  async getByDate(userId: string, dateStr: string): Promise<PlannerTask[]> {
    const { data, error } = await rawFrom('planner_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('due_date', dateStr);
    if (error) return [];
    return (data as PlannerTask[]) ?? [];
  },

  async create(userId: string, data: Partial<PlannerTask>): Promise<PlannerTask | null> {
    const payload = {
      user_id: userId,
      title: data.title || 'New Task',
      description: data.description || '',
      subject: data.subject || 'General',
      priority: data.priority || 'medium',
      status: 'todo',
      due_date: data.due_date || new Date().toISOString().split('T')[0],
      estimated_minutes: data.estimated_minutes || 30,
      actual_minutes: 0,
      tags: data.tags || [],
      created_at: new Date().toISOString(),
    };
    const { data: created, error } = await rawFrom('planner_tasks').insert(payload).select().single();
    if (error) { console.error('plannerService.create:', error.message); return null; }
    return created as PlannerTask;
  },

  async update(id: string, data: Partial<PlannerTask>): Promise<PlannerTask | null> {
    const payload: Record<string, unknown> = { ...data };
    if (data.status === 'done' && !data.completed_at) {
      payload.completed_at = new Date().toISOString();
    }
    if (data.status && data.status !== 'done') {
      payload.completed_at = null;
    }
    const { data: updated, error } = await rawFrom('planner_tasks')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) { console.error('plannerService.update:', error.message); return null; }
    return updated as PlannerTask;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await rawFrom('planner_tasks').delete().eq('id', id);
    if (error) { console.error('plannerService.delete:', error.message); return false; }
    return true;
  },

  async toggleStatus(id: string, currentStatus: TaskStatus): Promise<PlannerTask | null> {
    const next: TaskStatus =
      currentStatus === 'done' ? 'todo' :
      currentStatus === 'todo' ? 'in_progress' :
      'done';
    return this.update(id, { status: next });
  },

  async getStats(userId: string): Promise<{ total: number; done: number; overdue: number; today: number }> {
    const tasks = await this.getAll(userId);
    const today = new Date().toISOString().split('T')[0];
    return {
      total: tasks.length,
      done: tasks.filter((t) => t.status === 'done').length,
      overdue: tasks.filter((t) => t.status !== 'done' && t.due_date < today).length,
      today: tasks.filter((t) => t.due_date === today).length,
    };
  },
};
