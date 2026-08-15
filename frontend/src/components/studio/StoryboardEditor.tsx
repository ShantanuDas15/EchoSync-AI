'use client';

import React, { useState, useRef } from 'react';
import { Plus, LayoutTemplate, Layers } from 'lucide-react';
import { DialogueBlock, BlockData } from './DialogueBlock';
import { moveBlock } from '@/lib/dndUtils';

interface StoryboardEditorProps {
  onMasterRender: (blocks: BlockData[], totalTokens: number) => void;
  isSynthesizing: boolean;
}

export function StoryboardEditor({ onMasterRender, isSynthesizing }: StoryboardEditorProps) {
  const [blocks, setBlocks] = useState<BlockData[]>([
    { id: '1', text: 'Welcome to the podcast. Today we are talking about AI.', preset: 'default' },
    { id: '2', text: 'That sounds like an amazing topic!', preset: 'sarah' }
  ]);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addBlock = () => {
    const newBlock: BlockData = {
      id: Math.random().toString(36).substring(7),
      text: '',
      preset: 'default'
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<BlockData>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const renderBlock = (id: string) => {
    // This would individually render a block.
    updateBlock(id, { isSynthesizing: true });
    setTimeout(() => {
      updateBlock(id, { isSynthesizing: false });
    }, 1000);
  };

  const handleMasterRender = () => {
    // Calculate token cost as sum of lengths
    const totalTokens = blocks.reduce((acc, block) => acc + block.text.length, 0);
    onMasterRender(blocks, totalTokens);
  };

  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox requires dataTransfer data to be set
    e.dataTransfer.setData('text/html', e.currentTarget.parentNode?.toString() || '');
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newBlocks = moveBlock(blocks, draggedIndex, index);
    
    setBlocks(newBlocks);
    setDraggedIndex(null);
  };

  const onDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="flex flex-col gap-4 p-6 glass-panel rounded-2xl relative min-h-[400px]">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2 text-slate-300">
          <LayoutTemplate size={18} className="text-indigo-400" />
          <h3 className="font-medium">Multi-Track Storyboard</h3>
        </div>
        <div className="text-xs text-slate-500 font-mono">
          {blocks.length} Blocks
        </div>
      </div>

      <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2 pb-4 storyboard-scroll">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            className={`${draggedIndex === index ? 'opacity-50' : 'opacity-100'}`}
          >
            <DialogueBlock
              block={block}
              index={index}
              onUpdate={updateBlock}
              onDelete={deleteBlock}
              onRender={renderBlock}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
              onDrop={onDrop}
            />
          </div>
        ))}

        <button
          onClick={addBlock}
          className="flex items-center justify-center gap-2 p-4 w-full border-2 border-dashed border-slate-700/50 text-slate-500 rounded-xl hover:bg-slate-800/30 hover:text-slate-400 hover:border-slate-600 transition-all"
        >
          <Plus size={18} />
          <span>Add Dialogue Block</span>
        </button>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-800">
        <button
          onClick={handleMasterRender}
          disabled={isSynthesizing || blocks.length === 0}
          className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          <Layers size={18} />
          {isSynthesizing ? 'Master Rendering...' : 'Master Render Sequence'}
        </button>
      </div>
    </div>
  );
}
