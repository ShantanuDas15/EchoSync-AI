'use client';

import React from 'react';
import { GripVertical, Play, X, Loader2 } from 'lucide-react';

export interface BlockData {
  id: string;
  text: string;
  preset: string;
  isSynthesizing?: boolean;
}

interface DialogueBlockProps {
  block: BlockData;
  index: number;
  onUpdate: (id: string, updates: Partial<BlockData>) => void;
  onDelete: (id: string) => void;
  onRender: (id: string) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
}

export function DialogueBlock({
  block,
  index,
  onUpdate,
  onDelete,
  onRender,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop
}: DialogueBlockProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop(e, index)}
      className="flex gap-3 p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl transition-all hover:border-slate-600 group"
    >
      <div className="flex flex-col items-center justify-center cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300">
        <GripVertical size={20} />
      </div>
      
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <select
            value={block.preset}
            onChange={(e) => onUpdate(block.id, { preset: e.target.value })}
            className="p-1.5 text-xs bg-slate-800 border border-slate-700 rounded text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="default">Default Neural Voice</option>
            <option value="sarah">Sarah (Expressive)</option>
            <option value="michael">Michael (Professional)</option>
          </select>
          <button
            onClick={() => onDelete(block.id)}
            className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>

        <textarea
          value={block.text}
          onChange={(e) => onUpdate(block.id, { text: e.target.value })}
          placeholder="Type dialogue here..."
          className="w-full min-h-[60px] bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none resize-none"
        />
        
        <div className="flex justify-end mt-1">
          <button
            onClick={() => onRender(block.id)}
            disabled={block.isSynthesizing || !block.text.trim()}
            className="flex items-center gap-1 text-xs px-3 py-1.5 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 rounded-md transition-colors disabled:opacity-50"
          >
            {block.isSynthesizing ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
            {block.isSynthesizing ? 'Rendering...' : 'Render Block'}
          </button>
        </div>
      </div>
    </div>
  );
}
