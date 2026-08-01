/**
 * notesService.ts — Supabase Cloud Storage
 * All notes are stored in the `notes` table, scoped to the logged-in user via RLS.
 */
import { Note } from '@/types/notes';
import { rawFrom } from '@/services/supabase';

export const notesService = {
  async getAll(userId: string): Promise<Note[]> {
    const { data, error } = await rawFrom('notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) { console.error('notesService.getAll:', error.message); return []; }
    return (data as Note[]) ?? [];
  },

  async getById(userId: string, id: string): Promise<Note | null> {
    const { data, error } = await rawFrom('notes')
      .select('*')
      .eq('user_id', userId)
      .eq('id', id)
      .single();
    if (error) return null;
    return data as Note;
  },

  async create(userId: string, data: Partial<Note>): Promise<Note | null> {
    const now = new Date().toISOString();
    const content = data.content || '';
    const payload = {
      user_id: userId,
      title: data.title || 'Untitled Note',
      content,
      folder: data.folder || 'General',
      tags: data.tags || [],
      is_starred: false,
      is_ai_enhanced: false,
      word_count: content.split(/\s+/).filter(Boolean).length,
      created_at: now,
      updated_at: now,
    };
    const { data: created, error } = await rawFrom('notes').insert(payload).select().single();
    if (error) { console.error('notesService.create:', error.message); return null; }
    return created as Note;
  },

  async update(id: string, data: Partial<Note>): Promise<Note | null> {
    const payload: Record<string, unknown> = {
      ...data,
      updated_at: new Date().toISOString(),
    };
    if (data.content !== undefined) {
      payload.word_count = data.content.split(/\s+/).filter(Boolean).length;
    }
    const { data: updated, error } = await rawFrom('notes')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) { console.error('notesService.update:', error.message); return null; }
    return updated as Note;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await rawFrom('notes').delete().eq('id', id);
    if (error) { console.error('notesService.delete:', error.message); return false; }
    return true;
  },

  async toggleStar(id: string, currentValue: boolean): Promise<Note | null> {
    return this.update(id, { is_starred: !currentValue });
  },

  async getFolders(userId: string): Promise<string[]> {
    const { data, error } = await rawFrom('notes')
      .select('folder')
      .eq('user_id', userId);
    if (error) return [];
    const folders = Array.from(new Set((data as { folder: string }[]).map((n) => n.folder))).filter(Boolean);
    return folders.sort();
  },
};
