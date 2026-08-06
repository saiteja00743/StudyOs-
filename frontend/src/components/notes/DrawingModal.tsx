import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PenTool, Eraser, RotateCcw, Trash2, Check, X,
  Maximize2, Minimize2, Sparkles, Palette,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface DrawingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDrawing: (dataUrl: string) => void;
}

const COLORS = [
  { label: 'White', hex: '#faf8f5' },
  { label: 'Terracotta', hex: '#da7756' },
  { label: 'Cyan', hex: '#38bdf8' },
  { label: 'Emerald', hex: '#34d399' },
  { label: 'Amber', hex: '#fbbf24' },
  { label: 'Rose', hex: '#fb7185' },
];

const SIZES = [
  { label: 'Fine', size: 2 },
  { label: 'Medium', size: 4 },
  { label: 'Thick', size: 8 },
  { label: 'Marker', size: 16 },
];

export function DrawingModal({ isOpen, onClose, onSaveDrawing }: DrawingModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [color, setColor] = useState('#faf8f5');
  const [lineWidth, setLineWidth] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);

  // Initialize canvas context
  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, []);

  // Save state for undo
  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-15), imageData]); // keep last 15 states
  }, [getContext]);

  // Handle Canvas Resizing & Background Setup
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#171716';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw subtle grid dots
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        for (let x = 20; x < canvas.width; x += 30) {
          for (let y = 20; y < canvas.height; y += 30) {
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        saveState();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, saveState]);

  // Drawing event handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;

    saveState();
    setIsDrawing(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#171716';
      ctx.lineWidth = lineWidth * 3;
    } else if (tool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color + '40'; // opacity
      ctx.lineWidth = lineWidth * 2.5;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
  };

  // Clear canvas
  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;

    saveState();
    ctx.fillStyle = '#171716';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw grid
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let x = 20; x < canvas.width; x += 30) {
      for (let y = 20; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // Undo
  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;

    const newHistory = [...history];
    newHistory.pop(); // Remove current
    const previousState = newHistory[newHistory.length - 1];

    if (previousState) {
      ctx.putImageData(previousState, 0, 0);
      setHistory(newHistory);
    }
  };

  // Export Drawing to Note
  const handleInsertDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Export as compressed WebP for lightweight data URL
    const rawUrl = canvas.toDataURL('image/webp', 0.85);
    const cleanUrl = rawUrl.replace(/[\r\n]+/g, '');
    onSaveDrawing(cleanUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-4xl h-[85vh] bg-surface-900 border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-surface-950/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                <PenTool className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Sketch Pad &amp; Diagram Canvas</h3>
                <p className="text-2xs text-stone-400">Draw diagrams, equations, or handwritten notes</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 text-stone-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tools Bar */}
          <div className="px-4 py-2.5 bg-surface-850 border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
            {/* Tools */}
            <div className="flex items-center gap-1 bg-surface-900 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setTool('pen')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  tool === 'pen' ? 'bg-brand-500 text-white shadow-sm' : 'text-stone-400 hover:text-white'
                )}
              >
                <PenTool className="w-3.5 h-3.5" /> Pen
              </button>

              <button
                onClick={() => setTool('highlighter')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  tool === 'highlighter' ? 'bg-amber-500 text-white shadow-sm' : 'text-stone-400 hover:text-white'
                )}
              >
                <Palette className="w-3.5 h-3.5" /> Highlighter
              </button>

              <button
                onClick={() => setTool('eraser')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  tool === 'eraser' ? 'bg-rose-500 text-white shadow-sm' : 'text-stone-400 hover:text-white'
                )}
              >
                <Eraser className="w-3.5 h-3.5" /> Eraser
              </button>
            </div>

            {/* Color Swatches */}
            {tool !== 'eraser' && (
              <div className="flex items-center gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setColor(c.hex)}
                    className={cn(
                      'w-6 h-6 rounded-full border border-white/20 transition-all flex items-center justify-center',
                      color === c.hex ? 'scale-125 ring-2 ring-brand-400' : 'opacity-80 hover:opacity-100'
                    )}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            )}

            {/* Stroke Size */}
            <div className="flex items-center gap-1.5 bg-surface-900 px-2 py-1 rounded-xl border border-white/5">
              {SIZES.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setLineWidth(s.size)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-2xs font-semibold transition-all',
                    lineWidth === s.size ? 'bg-white/15 text-white font-bold' : 'text-stone-400 hover:text-white'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* History & Clear */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleUndo}
                disabled={history.length <= 1}
                className="p-2 text-stone-400 hover:text-white hover:bg-white/5 rounded-xl disabled:opacity-30"
                title="Undo"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handleClear}
                className="p-2 text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl"
                title="Clear canvas"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Canvas Viewport */}
          <div className="flex-1 relative bg-[#171716] overflow-hidden">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-full cursor-crosshair touch-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="px-5 py-3 border-t border-white/10 bg-surface-950 flex items-center justify-between">
            <p className="text-2xs text-stone-500">Drawing embeds directly as an image into your note.</p>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancel
              </button>

              <button
                onClick={handleInsertDrawing}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-brand-gradient text-white text-xs font-semibold shadow-glow-sm hover:opacity-90 transition-all"
              >
                <Check className="w-3.5 h-3.5" /> Insert into Note
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
