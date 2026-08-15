'use client';

import React from 'react';
import { GripVertical, Play, X, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { canMoveUp, canMoveDown } from '@/lib/mobileUtils';

export interface BlockData {
  id: string;
  text: string;
  preset: string;
  isSynthesizing?: boolean;
}

interface DialogueBlockProps {
  block: BlockData;
  index: number;
  totalBlocks?: number;
  onUpdate: (id: string, updates: Partial<BlockData>) => void;
  onDelete: (id: string) => void;
  onRender: (id: string) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
}

export function DialogueBlock({
  block,
  index,
  totalBlocks = 1,
  onUpdate,
  onDelete,
  onRender,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onMoveUp,
  onMoveDown
}: DialogueBlockProps) {
  const hasUp = canMoveUp(index);
  const hasDown = canMoveDown(index, totalBlocks);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop(e, index)}
      className="flex gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl transition-all hover:border-slate-600 group"
    >
      {/* Left controls: Desktop Drag Handle + Mobile Reorder Chevrons */}
      <div className="flex flex-col items-center justify-between py-1 text-slate-500">
        {onMoveUp && (
          <button
            type="button"
            onClick={() => onMoveUp(index)}
            disabled={!hasUp}
            aria-label={`Move dialogue block ${index + 1} up`}
            className="min-w-[44px] min-h-[36px] flex items-center justify-center text-slate-500 hover:text-slate-200 disabled:opacity-20 disabled:hover:text-slate-500 transition-colors focus-ring rounded"
          >
            <ChevronUp size={18} />
          </button>
        )}

        <div className="hidden sm:flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:text-slate-300 my-auto">
          <GripVertical size={20} />
        </div>

        {onMoveDown && (
          <button
            type="button"
            onClick={() => onMoveDown(index)}
            disabled={!hasDown}
            aria-label={`Move dialogue block ${index + 1} down`}
            className="min-w-[44px] min-h-[36px] flex items-center justify-center text-slate-500 hover:text-slate-200 disabled:opacity-20 disabled:hover:text-slate-500 transition-colors focus-ring rounded"
          >
            <ChevronDown size={18} />
          </button>
        )}
      </div>
      
      {/* Main Dialogue Block Content */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="flex justify-between items-center gap-2">
          <select
            value={block.preset}
            onChange={(e) => onUpdate(block.id, { preset: e.target.value })}
            className="min-h-[44px] sm:min-h-0 p-2 sm:p-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500 focus-ring"
          >
            <option value="default">Default Neural Voice</option>
            <option value="sarah">Sarah (Expressive)</option>
            <option value="michael">Michael (Professional)</option>
          </select>

          <button
            onClick={() => onDelete(block.id)}
            aria-label="Delete dialogue block"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-red-400 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity focus-ring rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <textarea
          value={block.text}
          onChange={(e) => onUpdate(block.id, { text: e.target.value })}
          placeholder="Type dialogue here..."
          rows={2}
          className="w-full min-h-[60px] bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none focus-ring"
        />
        
        <div className="flex justify-end mt-1">
          <button
            onClick={() => onRender(block.id)}
            disabled={block.isSynthesizing || !block.text.trim()}
            className="min-h-[44px] sm:min-h-0 flex items-center gap-1.5 text-xs px-4 py-2 sm:py-1.5 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 rounded-lg transition-colors disabled:opacity-50 focus-ring font-medium active:scale-95"
          >
            {block.isSynthesizing ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
            {block.isSynthesizing ? 'Rendering...' : 'Render Block'}
          </button>
        </div>
      </div>
    </div>
  );
}
