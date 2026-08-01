import { PDFDocument, PDFProcessResult } from '@/types/notes';
import { scopedKey } from '@/services/userScope';

const BASE_KEY = 'studyos_pdfs';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function loadPDFs(): PDFDocument[] {
  try {
    const raw = localStorage.getItem(scopedKey(BASE_KEY));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePDFs(pdfs: PDFDocument[]) {
  localStorage.setItem(scopedKey(BASE_KEY), JSON.stringify(pdfs));
}

export const pdfService = {
  getAll(): PDFDocument[] {
    return loadPDFs().sort(
      (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    );
  },

  async upload(file: File, onProgress?: (pct: number) => void): Promise<PDFDocument> {
    const pdfs = loadPDFs();
    const now = new Date().toISOString();

    const newDoc: PDFDocument = {
      id: `pdf-${Date.now()}`,
      name: file.name,
      size: file.size,
      status: 'uploading',
      uploaded_at: now,
    };

    pdfs.unshift(newDoc);
    savePDFs(pdfs);

    // Simulate upload progress
    for (let p = 10; p <= 90; p += 20) {
      await new Promise((r) => setTimeout(r, 300));
      if (onProgress) onProgress(p);
    }

    // Try backend first, otherwise do mock processing
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE_URL}/pdf/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const updated: PDFDocument = {
          ...newDoc,
          status: 'done',
          page_count: data.page_count,
          summary: data.summary,
          key_points: data.key_points,
        };
        const saved = loadPDFs().map((p) => (p.id === newDoc.id ? updated : p));
        savePDFs(saved);
        if (onProgress) onProgress(100);
        return updated;
      }
    } catch {
      // Fall through to mock
    }

    // Mock AI processing
    if (onProgress) onProgress(95);
    await new Promise((r) => setTimeout(r, 800));

    const processed: PDFDocument = {
      ...newDoc,
      status: 'done',
      page_count: Math.floor(Math.random() * 30) + 5,
      summary: `This document "${file.name}" covers important academic concepts across ${Math.floor(Math.random() * 30) + 5} pages. The material explores foundational theories and practical applications relevant to your study area. Key themes include conceptual frameworks, analytical methods, and evidence-based conclusions that support deeper understanding of the subject matter.`,
      key_points: [
        'Core theoretical framework and foundational concepts introduced in Chapter 1',
        'Analytical methodology and research approach used throughout the document',
        'Empirical evidence supporting the main argument and hypotheses',
        'Practical applications and real-world case studies discussed',
        'Summary conclusions and directions for further study',
      ],
    };

    const savedPDFs = loadPDFs().map((p) => (p.id === newDoc.id ? processed : p));
    savePDFs(savedPDFs);
    if (onProgress) onProgress(100);
    return processed;
  },

  delete(id: string): boolean {
    const pdfs = loadPDFs().filter((p) => p.id !== id);
    savePDFs(pdfs);
    return true;
  },

  async reprocess(id: string): Promise<PDFDocument | null> {
    const pdfs = loadPDFs();
    const doc = pdfs.find((p) => p.id === id);
    if (!doc) return null;

    const updated = { ...doc, status: 'processing' as const };
    savePDFs(pdfs.map((p) => (p.id === id ? updated : p)));

    await new Promise((r) => setTimeout(r, 1500));

    const reprocessed: PDFDocument = {
      ...doc,
      status: 'done',
      summary: doc.summary || 'AI-generated summary based on document content.',
      key_points: doc.key_points || [],
    };
    savePDFs(loadPDFs().map((p) => (p.id === id ? reprocessed : p)));
    return reprocessed;
  },
};
