import { Note } from '@/types/notes';

const STORAGE_KEY = 'studyos_notes';

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : getDefaultNotes();
  } catch {
    return getDefaultNotes();
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function getDefaultNotes(): Note[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'note-1',
      title: 'Introduction to Neural Networks',
      content:
        '# Neural Networks\n\nA neural network is a series of algorithms that endeavors to recognize underlying relationships in a set of data through a process that mimics the way the human brain operates.\n\n## Key Concepts\n\n- **Neurons**: Basic units that take inputs, apply weights, and pass through an activation function.\n- **Layers**: Input, Hidden, and Output layers form the architecture.\n- **Backpropagation**: The algorithm for training networks by adjusting weights.\n\n## Activation Functions\n\n- ReLU: `f(x) = max(0, x)` — most common in hidden layers\n- Sigmoid: maps to (0,1) — good for binary output\n- Softmax: for multi-class classification\n\n> 💡 Practice: Build a simple XOR gate neural network from scratch.',
      folder: 'AI & Machine Learning',
      tags: ['AI', 'Deep Learning', 'Neural Networks'],
      is_starred: true,
      is_ai_enhanced: true,
      word_count: 120,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'note-2',
      title: 'Big-O Complexity Cheat Sheet',
      content:
        '# Big-O Complexity\n\n| Operation | Array | Linked List | Hash Map |\n|---|---|---|---|\n| Access | O(1) | O(n) | O(1) |\n| Search | O(n) | O(n) | O(1) |\n| Insert | O(n) | O(1) | O(1) |\n| Delete | O(n) | O(1) | O(1) |\n\n## Common Algorithms\n\n- **Binary Search**: O(log n)\n- **Merge Sort**: O(n log n)\n- **Quick Sort**: avg O(n log n), worst O(n²)',
      folder: 'Computer Science',
      tags: ['Algorithms', 'Data Structures', 'Coding'],
      is_starred: false,
      is_ai_enhanced: false,
      word_count: 90,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'note-3',
      title: 'Organic Chemistry Reactions',
      content:
        '# Key Organic Reactions\n\n## SN1 vs SN2\n\n**SN1 (Unimolecular)**\n- Rate depends on substrate only\n- Proceeds via carbocation intermediate\n- Racemization occurs\n\n**SN2 (Bimolecular)**\n- Rate depends on substrate and nucleophile\n- Backside attack → inversion\n- Favored by primary substrates\n\n## Elimination (E1/E2)\n\nE2 is concerted — requires anti-periplanar geometry.',
      folder: 'Chemistry',
      tags: ['Chemistry', 'Organic', 'Reactions'],
      is_starred: true,
      is_ai_enhanced: false,
      word_count: 85,
      created_at: now,
      updated_at: now,
    },
  ];
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
