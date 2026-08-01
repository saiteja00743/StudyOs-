import { Note } from '@/types/notes';
import { scopedKey } from '@/services/userScope';

const BASE_KEY = 'studyos_notes';

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(scopedKey(BASE_KEY));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(scopedKey(BASE_KEY), JSON.stringify(notes));
}


export const notesService = {
  getAll(): Note[] {
    return loadNotes().sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  },

  getById(id: string): Note | undefined {
    return loadNotes().find((n) => n.id === id);
  },

  create(data: Partial<Note>): Note {
    const notes = loadNotes();
    const now = new Date().toISOString();
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: data.title || 'Untitled Note',
      content: data.content || '',
      folder: data.folder || 'General',
      tags: data.tags || [],
      is_starred: false,
      is_ai_enhanced: false,
      word_count: (data.content || '').split(/\s+/).filter(Boolean).length,
      created_at: now,
      updated_at: now,
      ...data,
    };
    notes.unshift(newNote);
    saveNotes(notes);
    return newNote;
  },

  update(id: string, data: Partial<Note>): Note | null {
    const notes = loadNotes();
    const idx = notes.findIndex((n) => n.id === id);
    if (idx === -1) return null;
    const updated: Note = {
      ...notes[idx],
      ...data,
      updated_at: new Date().toISOString(),
      word_count: data.content
        ? data.content.split(/\s+/).filter(Boolean).length
        : notes[idx].word_count,
    };
    notes[idx] = updated;
    saveNotes(notes);
    return updated;
  },

  delete(id: string): boolean {
    const notes = loadNotes();
    const filtered = notes.filter((n) => n.id !== id);
    if (filtered.length === notes.length) return false;
    saveNotes(filtered);
    return true;
  },

  toggleStar(id: string): Note | null {
    const note = loadNotes().find((n) => n.id === id);
    if (!note) return null;
    return this.update(id, { is_starred: !note.is_starred });
  },

  getFolders(): string[] {
    const notes = loadNotes();
    const folders = Array.from(new Set(notes.map((n) => n.folder))).filter(Boolean);
    return folders.sort();
  },

  async aiEnhance(noteId: string): Promise<Note | null> {
    const note = this.getById(noteId);
    if (!note) return null;
    // Would call backend in production. For now, flag as AI-enhanced.
    return this.update(noteId, { is_ai_enhanced: true });
  },
};
