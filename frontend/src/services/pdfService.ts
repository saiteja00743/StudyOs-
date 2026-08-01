/**
 * pdfService.ts — Supabase Cloud Storage
 * PDF document metadata stored in `pdf_documents` table.
 * Actual file bytes are NOT stored (no Supabase Storage bucket needed).
 */
import { PDFDocument } from '@/types/notes';
import { rawFrom } from '@/services/supabase';

export const pdfService = {
  async getAll(userId: string): Promise<PDFDocument[]> {
    const { data, error } = await rawFrom('pdf_documents')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });
    if (error) { console.error('pdfService.getAll:', error.message); return []; }
    return (data as PDFDocument[]) ?? [];
  },

  async getById(userId: string, id: string): Promise<PDFDocument | null> {
    const { data, error } = await rawFrom('pdf_documents')
      .select('*')
      .eq('user_id', userId)
      .eq('id', id)
      .single();
    if (error) return null;
    return data as PDFDocument;
  },

  async create(userId: string, data: Partial<PDFDocument>): Promise<PDFDocument | null> {
    const payload = {
      user_id: userId,
      name: data.name || 'Untitled PDF',
      size: data.size || 0,
      page_count: data.page_count || 0,
      status: data.status || 'ready',
      summary: data.summary || '',
      key_points: data.key_points || [],
      file_url: data.file_url || '',
      uploaded_at: new Date().toISOString(),
    };
    const { data: created, error } = await rawFrom('pdf_documents').insert(payload).select().single();
    if (error) { console.error('pdfService.create:', error.message); return null; }
    return created as PDFDocument;
  },

  async update(id: string, data: Partial<PDFDocument>): Promise<PDFDocument | null> {
    const { data: updated, error } = await rawFrom('pdf_documents')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) { console.error('pdfService.update:', error.message); return null; }
    return updated as PDFDocument;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await rawFrom('pdf_documents').delete().eq('id', id);
    if (error) { console.error('pdfService.delete:', error.message); return false; }
    return true;
  },
};
