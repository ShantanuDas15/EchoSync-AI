"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useOnboarding, getTourProgressPercent } from '@/lib/onboardingContext';
import { X, ChevronRight, ChevronLeft, Check, Sparkles, Compass, Play, BookOpen, Layers } from 'lucide-react';

export function OnboardingTour() {
  const {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    prevStep,
    goToStep,
    skipTour,
    completeTour,
    openQuickStart
  } = useOnboarding();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [cardPosition, setCardPosition] = useState<{ top: number; left: number; isAnchored: boolean }>({
    top: 0,
    left: 0,
    isAnchored: false,
  });
  const cardRef = useRef<HTMLDivElement>(null);

  // Measure and track target DOM element position with smart anchoring
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
          if (rect.top < 80 || rect.bottom > window.innerHeight - 80) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }

          // Calculate intelligent anchoring position
          const cardWidth = cardRef.current ? cardRef.current.offsetWidth : 480;
          const cardHeight = cardRef.current ? cardRef.current.offsetHeight : 280;
          const isMobile = window.innerWidth < 640;

          if (isMobile) {
            // On mobile, position near bottom or center
            setCardPosition({
              top: Math.max(16, window.innerHeight - cardHeight - 24),
              left: Math.max(16, (window.innerWidth - cardWidth) / 2),
              isAnchored: false,
            });
            return;
          }

          const placement = currentStep.placement || 'bottom';
          let top = (window.innerHeight - cardHeight) / 2;
          let left = (window.innerWidth - cardWidth) / 2;
          let isAnchored = true;

          if (placement === 'bottom') {
            top = rect.bottom + 16;
            left = rect.left + rect.width / 2 - cardWidth / 2;
          } else if (placement === 'top') {
            top = rect.top - cardHeight - 16;
            left = rect.left + rect.width / 2 - cardWidth / 2;
          } else if (placement === 'right') {
            left = rect.right + 16;
            top = rect.top + rect.height / 2 - cardHeight / 2;
          } else if (placement === 'left') {
            left = rect.left - cardWidth - 16;
            top = rect.top + rect.height / 2 - cardHeight / 2;
          } else {
            isAnchored = false;
          }

          // Boundary clamp to keep card safely inside viewport
          const clampedLeft = Math.max(20, Math.min(left, window.innerWidth - cardWidth - 20));
          const clampedTop = Math.max(80, Math.min(top, window.innerHeight - cardHeight - 20));

          setCardPosition({ top: clampedTop, left: clampedLeft, isAnchored });
        } else {
          setTargetRect(null);
          setCardPosition({
            top: window.innerHeight / 2 - 140,
            left: window.innerWidth / 2 - 240,
            isAnchored: false,
          });
        }
      } catch {
        setTargetRect(null);
      }
    };

    updateTargetPosition();
    const timer = setTimeout(updateTargetPosition, 100);
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition, true);

    return () => {
      clearTimeout(timer);
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
  const isFirstStep = currentStepIndex === 0;
  const progressPercent = getTourProgressPercent(currentStepIndex, totalSteps);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-step-title"
      aria-describedby="tour-step-desc"
      className="fixed inset-0 z-[9999] pointer-events-auto overflow-hidden animate-in fade-in duration-200"
    >
      {/* Darkened Obsidian Backdrop Overlay */}
      <div 
        onClick={skipTour}
        className="absolute inset-0 bg-surface-root/80 backdrop-blur-[3px] transition-all"
        aria-hidden="true"
      />

      {/* Glowing Spotlight Cutout over target element */}
      {targetRect && targetRect.width > 0 && targetRect.height > 0 && (
        <div
          style={{
            position: 'absolute',
            top: `${Math.max(0, targetRect.top - 8)}px`,
            left: `${Math.max(0, targetRect.left - 8)}px`,
            width: `${targetRect.width + 16}px`,
            height: `${targetRect.height + 16}px`,
            borderRadius: '18px',
            boxShadow: '0 0 0 9999px rgba(3, 7, 18, 0.78), 0 0 25px 4px rgba(14, 165, 233, 0.4)',
            pointerEvents: 'none',
            zIndex: 10
          }}
          className="border-2 border-sky-400 transition-all duration-300 animate-pulse"
        />
      )}

      {/* Anchored Guided Tour Card */}
      <div 
        style={{
          position: 'absolute',
          top: `${cardPosition.top}px`,
          left: `${cardPosition.left}px`,
          zIndex: 30,
        }}
        className="transition-all duration-200 ease-out"
      >
        <div
          ref={cardRef}
          className="w-[calc(100vw-32px)] sm:w-[480px] bg-surface-panel border border-border-elevated rounded-2xl shadow-2xl backdrop-blur-2xl p-5 sm:p-6 flex flex-col gap-4 text-text-primary animate-in fade-in zoom-in-95"
        >
          {/* Header & Step Badges */}
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-sky-500/10 text-sky-300 rounded-lg border border-sky-500/20">
                <Compass size={15} />
              </span>
              <span className="text-xs font-mono font-semibold text-sky-300 uppercase tracking-wider">
                {currentStep.badgeText || `Step ${currentStepIndex + 1} of ${totalSteps}`}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Stepper Indicator Dots */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalSteps }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToStep(idx)}
                    className={`h-1.5 rounded-full transition-all focus-ring ${
                      idx === currentStepIndex
                        ? 'w-5 bg-sky-400 shadow-sm shadow-sky-400/50'
                        : idx < currentStepIndex
                        ? 'w-1.5 bg-sky-500/60'
                        : 'w-1.5 bg-surface-elevated hover:bg-border-subtle'
                    }`}
                    aria-label={`Go to step ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={skipTour}
                aria-label="Exit onboarding tour"
                className="text-text-muted hover:text-text-primary p-1 hover:bg-surface-elevated rounded-lg transition-colors focus-ring cursor-pointer"
                title="Skip Tour (Esc)"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-surface-root h-1 rounded-full overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Content Body */}
          <div className="space-y-2 py-0.5">
            <h3 id="tour-step-title" className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
              {currentStep.title}
            </h3>
            <p id="tour-step-desc" className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              {currentStep.description}
            </p>

            {currentStep.actionHint && (
              <div className="mt-2.5 p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center gap-2 text-xs text-sky-300 font-medium">
                <Sparkles size={14} className="shrink-0 text-sky-400" />
                <span>{currentStep.actionHint}</span>
              </div>
            )}

            {/* Quick First-Step Alternatives for First-Time Users */}
            {isFirstStep && (
              <div className="pt-2 flex flex-col gap-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-text-muted">
                  Quick Navigation Alternatives
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      skipTour();
                      openQuickStart();
                    }}
                    className="p-2.5 rounded-xl bg-surface-elevated/70 hover:bg-surface-elevated border border-border-subtle text-left text-xs text-text-secondary hover:text-sky-300 transition-all flex items-center gap-2 focus-ring"
                  >
                    <BookOpen size={14} className="text-sky-400 shrink-0" />
                    <span className="truncate">Load Scenario</span>
                  </button>
                  <button
                    onClick={skipTour}
                    className="p-2.5 rounded-xl bg-surface-elevated/70 hover:bg-surface-elevated border border-border-subtle text-left text-xs text-text-secondary hover:text-text-primary transition-all flex items-center gap-2 focus-ring"
                  >
                    <Play size={14} className="text-emerald-400 shrink-0" />
                    <span className="truncate">Skip to Studio</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons & Keyboard Helpers */}
          <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-text-muted font-mono">
              <kbd className="px-1.5 py-0.5 bg-surface-elevated border border-border-subtle rounded text-text-secondary">Esc</kbd> Skip
              <span className="mx-1">•</span>
              <kbd className="px-1.5 py-0.5 bg-surface-elevated border border-border-subtle rounded text-text-secondary">→</kbd> Next
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {currentStepIndex > 0 && (
                <button
                  onClick={prevStep}
                  className="px-3.5 py-2 text-xs font-medium text-text-secondary hover:text-text-primary bg-surface-elevated hover:bg-surface-panel border border-border-subtle rounded-xl transition-all flex items-center gap-1 focus-ring cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  Back
                </button>
              )}

              <button
                onClick={isLastStep ? completeTour : nextStep}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-500 hover:bg-sky-400 rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center gap-1.5 focus-ring active:scale-95 cursor-pointer"
              >
                <span>{isLastStep ? 'Complete Tour' : 'Next Step'}</span>
                {isLastStep ? <Check size={14} /> : <ChevronRight size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
