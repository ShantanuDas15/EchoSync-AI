"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useOnboarding, getTourProgressPercent } from '@/lib/onboardingContext';
import { X, ChevronRight, ChevronLeft, Check, Sparkles, HelpCircle, Compass } from 'lucide-react';

export function OnboardingTour() {
  const {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    prevStep,
    skipTour,
    completeTour
  } = useOnboarding();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Measure and track target DOM element position
  useEffect(() => {
    if (!isActive || !currentStep) {
      setTargetRect(null);
      return;
    }

    const updateTargetPosition = () => {
      try {
        const el = document.querySelector(currentStep.targetSelector);
        if (el) {
          const rect = el.getBoundingClientRect();
          setTargetRect(rect);
          // Scroll target element into view smoothly if off-screen
          if (rect.top < 0 || rect.bottom > window.innerHeight) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          setTargetRect(null);
        }
      } catch {
        setTargetRect(null);
      }
    };

    updateTargetPosition();
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition, true);

    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition, true);
    };
  }, [isActive, currentStep, currentStepIndex]);

  // Global Keyboard shortcuts for the Tour
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        skipTour();
      } else if (e.key === 'ArrowRight' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, nextStep, prevStep, skipTour]);

  if (!isActive || !currentStep) return null;

  const isLastStep = currentStepIndex === totalSteps - 1;
  const progressPercent = getTourProgressPercent(currentStepIndex, totalSteps);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-step-title"
      aria-describedby="tour-step-desc"
      className="fixed inset-0 z-[9999] pointer-events-auto overflow-hidden animate-in fade-in duration-200"
    >
      {/* Darkened Backdrop Overlay */}
      <div 
        onClick={skipTour}
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] transition-all"
        aria-hidden="true"
      />

      {/* Spotlight cutout highlight over target element if found */}
      {targetRect && targetRect.width > 0 && targetRect.height > 0 && (
        <div
          style={{
            position: 'absolute',
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
            borderRadius: '16px',
            boxShadow: '0 0 0 9999px rgba(3, 7, 18, 0.78), 0 0 25px 2px rgba(99, 102, 241, 0.4)',
            pointerEvents: 'none',
            zIndex: 10
          }}
          className="border-2 border-indigo-400/80 transition-all duration-300 animate-pulse"
        />
      )}

      {/* Guided Tour Modal Card */}
      <div className="absolute inset-0 flex items-center justify-center p-4 z-20 pointer-events-none">
        <div
          ref={cardRef}
          className="pointer-events-auto max-w-lg w-full bg-slate-900/95 border border-indigo-500/40 rounded-2xl shadow-2xl shadow-indigo-950/60 backdrop-blur-xl p-6 flex flex-col gap-4 text-slate-200 transition-all transform scale-100"
        >
          {/* Header & Step Badges */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/30">
                <Compass size={16} />
              </span>
              <span className="text-xs font-mono font-medium text-indigo-300 uppercase tracking-wider">
                {currentStep.badgeText || `Step ${currentStepIndex + 1} of ${totalSteps}`}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-mono">
                {currentStepIndex + 1} / {totalSteps}
              </span>
              <button
                onClick={skipTour}
                aria-label="Exit onboarding tour"
                className="text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded-lg transition-colors focus-ring"
                title="Skip Tour (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Content Body */}
          <div className="space-y-2 py-1">
            <h3 id="tour-step-title" className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              {currentStep.title}
            </h3>
            <p id="tour-step-desc" className="text-sm text-slate-300 leading-relaxed">
              {currentStep.description}
            </p>

            {currentStep.actionHint && (
              <div className="mt-3 p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center gap-2 text-xs text-indigo-300">
                <Sparkles size={14} className="shrink-0 text-indigo-400" />
                <span>{currentStep.actionHint}</span>
              </div>
            )}
          </div>

          {/* Action Buttons & Keyboard Helpers */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">Esc</kbd> Skip
              <span className="mx-1">•</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">→</kbd> Next
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {currentStepIndex > 0 && (
                <button
                  onClick={prevStep}
                  className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all flex items-center gap-1 focus-ring"
                >
                  <ChevronLeft size={14} />
                  Back
                </button>
              )}

              <button
                onClick={isLastStep ? completeTour : nextStep}
                className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-1.5 focus-ring active:scale-95"
              >
                <span>{isLastStep ? 'Get Started' : 'Next Step'}</span>
                {isLastStep ? <Check size={14} /> : <ChevronRight size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
