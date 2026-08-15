"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { OnboardingStep, StoryboardTemplate, TemplateCategory } from '@/types/onboarding';
import { STORYBOARD_TEMPLATES } from './templatesData';
import { BlockData } from '@/components/studio/DialogueBlock';

export const DEFAULT_STUDIO_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to EchoSync AI Studio',
    description: 'EchoSync AI is a next-generation neural voice cloning and conversational audio synthesis engine. Take a 60-second tour to discover key features!',
    targetSelector: '[data-tour="brand-logo"]',
    placement: 'bottom',
    badgeText: 'Step 1: Introduction',
    actionHint: 'Click Next to continue or Esc to skip anytime'
  },
  {
    id: 'voice-cloning',
    title: 'Zero-Shot Voice Cloning Reference',
    description: 'Record or upload a 5-second clean audio sample. Our 256-d neural encoder extracts speaker timbre embeddings without retraining models.',
    targetSelector: '[data-tour="voice-recorder"]',
    placement: 'right',
    badgeText: 'Step 2: Voice Reference',
    actionHint: 'Try recording a quick voice sample'
  },
  {
    id: 'multi-track-storyboard',
    title: 'Multi-Track Dialogue Storyboard',
    description: 'Construct conversational podcasts, audiobooks, or games. Drag-and-drop dialogue blocks, assign different neural voices, and render individual tracks.',
    targetSelector: '[data-tour="storyboard-editor"]',
    placement: 'right',
    badgeText: 'Step 3: Timeline & Storyboard',
    actionHint: 'Rearrange blocks using the drag handle'
  },
  {
    id: 'quick-templates',
    title: 'One-Click Dialogue Templates',
    description: 'Need inspiration? Use pre-configured templates for Tech Podcasts, Fantasy Audiobooks, Gaming NPCs, or Product Commercials.',
    targetSelector: '[data-tour="quick-templates-btn"]',
    placement: 'bottom',
    badgeText: 'Step 4: Templates',
    actionHint: 'Explore scenario presets with one click'
  },
  {
    id: 'spectrogram-analytics',
    title: 'Real-Time Acoustic Visualizers',
    description: 'Watch live FFT spectrograms at 60 FPS and inspect waveforms with interactive playhead tracking powered by WaveSurfer.',
    targetSelector: '[data-tour="spectrogram-canvas"]',
    placement: 'left',
    badgeText: 'Step 5: Visual Analytics',
    actionHint: 'Visualizes streaming PCM audio in real-time'
  },
  {
    id: 'telemetry-hotkeys',
    title: 'Sub-Millisecond Telemetry & Hotkeys',
    description: 'Monitor Real-Time Factor (RTF) and Time-To-First-Byte (TTFB). Press Cmd+K for the omnibar palette and Cmd+Enter to master render.',
    targetSelector: '[data-tour="telemetry-bar"]',
    placement: 'bottom',
    badgeText: 'Step 6: Power User Shortcuts',
    actionHint: 'You are now ready to create synthetic speech!'
  }
];

/**
 * Pure helper functions for business logic validation and testing
 */
export function calculateNextStep(current: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(current + 1, total - 1);
}

export function calculatePrevStep(current: number): number {
  return Math.max(0, current - 1);
}

export function validateStepIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  if (index < 0) return 0;
  if (index >= total) return total - 1;
  return index;
}

export function shouldAutoStartTour(hasCompleted: boolean, isFirstVisit: boolean): boolean {
  return !hasCompleted && isFirstVisit;
}

export function getTourProgressPercent(current: number, total: number): number {
  if (total <= 0) return 0;
  const clampedIndex = validateStepIndex(current, total);
  return Math.round(((clampedIndex + 1) / total) * 100);
}

export function filterTemplatesByCategory(
  templates: StoryboardTemplate[],
  category: TemplateCategory | string,
  searchQuery: string = ''
): StoryboardTemplate[] {
  let filtered = templates;

  if (category && category !== 'All') {
    filtered = filtered.filter(
      (t) => t.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }

  return filtered;
}

export function convertTemplateToBlocks(template: StoryboardTemplate): BlockData[] {
  return template.blocks.map((b, idx) => ({
    id: `tpl-${template.id}-${idx}-${Math.random().toString(36).substring(7)}`,
    text: b.text,
    preset: b.preset
  }));
}

interface OnboardingContextType {
  isActive: boolean;
  currentStepIndex: number;
  currentStep: OnboardingStep | null;
  totalSteps: number;
  steps: OnboardingStep[];
  hasCompletedOnboarding: boolean;
  isQuickStartOpen: boolean;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  skipTour: () => void;
  completeTour: () => void;
  resetTour: () => void;
  openQuickStart: () => void;
  closeQuickStart: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const STORAGE_KEY = 'echosync_onboarding_completed';

export function OnboardingProvider({
  children,
  initialSteps = DEFAULT_STUDIO_STEPS,
  autoStartNewUsers = false
}: {
  children: ReactNode;
  initialSteps?: OnboardingStep[];
  autoStartNewUsers?: boolean;
}) {
  const [steps] = useState<OnboardingStep[]>(initialSteps);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [isQuickStartOpen, setIsQuickStartOpen] = useState<boolean>(false);

  // Initialize from LocalStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedCompleted = localStorage.getItem(STORAGE_KEY);
        const completed = savedCompleted === 'true';
        setHasCompletedOnboarding(completed);

        if (!completed && autoStartNewUsers) {
          setIsActive(true);
        }
      }
    } catch {
      // LocalStorage access restricted / SSR
    }
  }, [autoStartNewUsers]);

  const startTour = useCallback(() => {
    setCurrentStepIndex(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      if (prev >= steps.length - 1) {
        // Completed
        setIsActive(false);
        setHasCompletedOnboarding(true);
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, 'true');
          }
        } catch {}
        return prev;
      }
      return prev + 1;
    });
  }, [steps.length]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => calculatePrevStep(prev));
  }, []);

  const goToStep = useCallback((index: number) => {
    setCurrentStepIndex(validateStepIndex(index, steps.length));
  }, [steps.length]);

  const skipTour = useCallback(() => {
    setIsActive(false);
    setHasCompletedOnboarding(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, 'true');
      }
    } catch {}
  }, []);

  const completeTour = useCallback(() => {
    setIsActive(false);
    setHasCompletedOnboarding(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, 'true');
      }
    } catch {}
  }, []);

  const resetTour = useCallback(() => {
    setHasCompletedOnboarding(false);
    setCurrentStepIndex(0);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
    setIsActive(true);
  }, []);

  const openQuickStart = useCallback(() => setIsQuickStartOpen(true), []);
  const closeQuickStart = useCallback(() => setIsQuickStartOpen(false), []);

  const currentStep = steps[currentStepIndex] || null;

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        currentStepIndex,
        currentStep,
        totalSteps: steps.length,
        steps,
        hasCompletedOnboarding,
        isQuickStartOpen,
        startTour,
        nextStep,
        prevStep,
        goToStep,
        skipTour,
        completeTour,
        resetTour,
        openQuickStart,
        closeQuickStart
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
