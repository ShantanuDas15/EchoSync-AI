'use client';

import React from 'react';
import { GripVertical, Play, X, Loader2, ChevronUp, ChevronDown, Lock } from 'lucide-react';
import { canMoveUp, canMoveDown } from '@/lib/mobileUtils';
import { PeerPresence } from '@/types/presence';

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
  lockedBy?: PeerPresence;
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
  lockedBy,
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
  const isLocked = Boolean(lockedBy);

  return (
    <div
      draggable={!isLocked}
      onDragStart={(e) => !isLocked && onDragStart(e, index)}
      onDragOver={(e) => !isLocked && onDragOver(e, index)}
      onDragEnd={onDragEnd}
      onDrop={(e) => !isLocked && onDrop(e, index)}
      style={isLocked ? { borderColor: `${lockedBy?.color}80`, boxShadow: `0 0 15px -3px ${lockedBy?.color}30` } : {}}
      className={`flex gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-900/50 border rounded-xl transition-all ${
        isLocked ? 'border-slate-700 bg-slate-900/80' : 'border-slate-700/50 hover:border-slate-600'
      } group`}
    >
      {/* Left controls: Desktop Drag Handle + Mobile Reorder Chevrons */}
      <div className="flex flex-col items-center justify-between py-1 text-slate-500">
        {onMoveUp && (
          <button
            type="button"
            onClick={() => onMoveUp(index)}
            disabled={!hasUp || isLocked}
            aria-label={`Move dialogue block ${index + 1} up`}
            className="min-w-[44px] min-h-[36px] flex items-center justify-center text-slate-500 hover:text-slate-200 disabled:opacity-20 disabled:hover:text-slate-500 transition-colors focus-ring rounded"
          >
            <ChevronUp size={18} />
          </button>
        )}

        <div className="hidden sm:flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:text-slate-300 my-auto">
          {isLocked ? (
            <Lock size={16} style={{ color: lockedBy?.color }} />
          ) : (
            <GripVertical size={20} />
          )}
        </div>

        {onMoveDown && (
          <button
            type="button"
            onClick={() => onMoveDown(index)}
            disabled={!hasDown || isLocked}
            aria-label={`Move dialogue block ${index + 1} down`}
            className="min-w-[44px] min-h-[36px] flex items-center justify-center text-slate-500 hover:text-slate-200 disabled:opacity-20 disabled:hover:text-slate-500 transition-colors focus-ring rounded"
          >
            <ChevronDown size={18} />
          </button>
        )}
      </div>
      
      {/* Main Dialogue Block Content */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Collaborative Lock Notice */}
        {isLocked && lockedBy && (
          <div
            style={{
              backgroundColor: `${lockedBy.color}15`,
              borderColor: `${lockedBy.color}40`,
              color: lockedBy.color
            }}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border font-medium animate-in fade-in"
          >
            <Lock size={12} />
            <span>{lockedBy.name} is currently editing this block</span>
          </div>
        )}

        <div className="flex justify-between items-center gap-2">
          <select
            value={block.preset}
            disabled={isLocked}
            onChange={(e) => onUpdate(block.id, { preset: e.target.value })}
            className="min-h-[44px] sm:min-h-0 p-2 sm:p-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500 focus-ring disabled:opacity-50"
          >
            <option value="default">Default Neural Voice</option>
            <option value="sarah">Sarah (Expressive)</option>
            <option value="michael">Michael (Professional)</option>
          </select>

          {!isLocked && (
            <button
              onClick={() => onDelete(block.id)}
              aria-label="Delete dialogue block"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-red-400 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity focus-ring rounded-lg"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <textarea
          value={block.text}
          disabled={isLocked}
          onChange={(e) => onUpdate(block.id, { text: e.target.value })}
          placeholder={isLocked ? "Editing locked by collaborator..." : "Type dialogue here..."}
          rows={2}
          className="w-full min-h-[60px] bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none focus-ring disabled:opacity-60 disabled:cursor-not-allowed"
        />
        
        <div className="flex justify-end mt-1">
          <button
            onClick={() => onRender(block.id)}
            disabled={isLocked || block.isSynthesizing || !block.text.trim()}
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
