'use client';

import React, { useState } from 'react';
import { Plus, LayoutTemplate, Layers, Sparkles } from 'lucide-react';
import { DialogueBlock, BlockData } from './DialogueBlock';
import { moveBlock } from '@/lib/dndUtils';
import { reorderArrayItems } from '@/lib/mobileUtils';
import { ContextualHint } from '@/components/ui/ContextualHint';
import { QuickStartModal } from './QuickStartModal';
import { convertTemplateToBlocks } from '@/lib/onboardingContext';
import { StoryboardTemplate } from '@/types/onboarding';
import { usePresence } from '@/lib/presenceContext';
import { isBlockLocked } from '@/lib/presenceUtils';
import { AvatarGroup } from '@/components/collaboration/AvatarGroup';

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
  const [isQuickStartOpen, setIsQuickStartOpen] = useState(false);
  const { peers, currentUserId } = usePresence();

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
    updateBlock(id, { isSynthesizing: true });
    setTimeout(() => {
      updateBlock(id, { isSynthesizing: false });
    }, 1000);
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      setBlocks(reorderArrayItems(blocks, index, index - 1));
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < blocks.length - 1) {
      setBlocks(reorderArrayItems(blocks, index, index + 1));
    }
  };

  const handleMasterRender = () => {
    const totalTokens = blocks.reduce((acc, block) => acc + block.text.length, 0);
    onMasterRender(blocks, totalTokens);
  };

  const handleSelectTemplate = (template: StoryboardTemplate) => {
    const newBlocks = convertTemplateToBlocks(template);
    setBlocks(newBlocks);
  };

  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
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
    <div
      data-tour="storyboard-editor"
      className="flex flex-col gap-4 p-4 sm:p-6 glass-panel rounded-2xl relative min-h-[400px]"
    >
      <div className="flex justify-between items-center pb-2 border-b border-border-subtle gap-2">
        <div className="flex items-center gap-2 text-text-primary">
          <LayoutTemplate size={18} className="text-sky-400 shrink-0" />
          <h3 className="font-semibold text-sm sm:text-base tracking-tight">Multi-Track Storyboard</h3>
          <ContextualHint
            title="Multi-Track Dialogue Timeline"
            description="Chain dialogue blocks with distinct voice presets. Drag handles or use Up/Down arrows to re-order lines sequentially."
            proTip="Press Cmd+Enter to master render the entire script at once."
            placement="right"
          />
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Collaborators Avatar Group */}
          <AvatarGroup />

          {/* Quick Start Templates Button */}
          <button
            onClick={() => setIsQuickStartOpen(true)}
            data-tour="quick-templates-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-300 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 rounded-xl transition-all shadow-sm focus-ring min-h-[36px]"
            title="Choose Pre-configured Scenario Template"
          >
            <Sparkles size={13} className="text-sky-400" />
            <span className="hidden xs:inline">Quick Templates</span>
            <span className="xs:hidden">Templates</span>
          </button>

          <div className="text-xs text-text-muted font-mono">
            {blocks.length}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1 sm:pr-2 pb-4 storyboard-scroll">
        {blocks.map((block, index) => {
          const lockStatus = isBlockLocked(peers, block.id, currentUserId);

          return (
            <div
              key={block.id}
              className={`${draggedIndex === index ? 'opacity-50' : 'opacity-100'}`}
            >
              <DialogueBlock
                block={block}
                index={index}
                totalBlocks={blocks.length}
                lockedBy={lockStatus.lockedBy}
                onUpdate={updateBlock}
                onDelete={deleteBlock}
                onRender={renderBlock}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
                onDrop={onDrop}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
              />
            </div>
          );
        })}

        <button
          onClick={addBlock}
          className="flex items-center justify-center gap-2 p-4 w-full min-h-[48px] border-2 border-dashed border-border-subtle text-text-secondary rounded-xl hover:bg-surface-elevated hover:text-text-primary hover:border-text-muted transition-all font-medium text-sm focus-ring"
        >
          <Plus size={18} />
          <span>Add Dialogue Block</span>
        </button>
      </div>

      <div className="mt-auto pt-4 border-t border-border-subtle">
        <button
          onClick={handleMasterRender}
          disabled={isSynthesizing || blocks.length === 0}
          className="flex items-center justify-center gap-2 w-full py-4 min-h-[52px] bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-xl shadow-md shadow-sky-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] focus-ring"
        >
          <Layers size={18} />
          {isSynthesizing ? 'Master Rendering...' : 'Master Render Sequence'}
        </button>
      </div>

      {/* Quick Start Templates Modal */}
      <QuickStartModal
        isOpen={isQuickStartOpen}
        onClose={() => setIsQuickStartOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
}
