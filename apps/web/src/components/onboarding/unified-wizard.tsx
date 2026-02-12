/**
 * UnifiedWizard
 *
 * Reusable full-screen wizard container for the PLG onboarding flow.
 * Provides:
 * - Full-screen layout with gradient background
 * - Linear progress bar at top with step indicators
 * - Keyboard shortcuts (Enter to continue, Esc to skip when allowed)
 * - Mobile-responsive layout
 * - Prevents accidental exit before value delivered
 *
 * Design Principles:
 * - Interruptive: Full-screen experience that can't be ignored
 * - Celebratory: Progress visualization creates momentum
 * - Accessible: Keyboard navigation and screen reader support
 */

'use client';

import { useEffect, useCallback, ReactNode, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

export interface UnifiedWizardProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  canGoNext: boolean;
  canGoBack: boolean;
  canSkip?: boolean;
  onSkip?: () => void;
  loading?: boolean;
  showClose?: boolean; // Only show close button after value delivered
  onClose?: () => void;
}

// ============================================================
// ANIMATION VARIANTS
// ============================================================

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 50 : -50,
    opacity: 0,
    scale: 0.95,
  }),
};

// ============================================================
// COMPONENT
// ============================================================

export function UnifiedWizard({
  children,
  currentStep,
  totalSteps,
  onNext,
  onBack,
  canGoNext,
  canGoBack,
  canSkip = false,
  onSkip,
  loading = false,
  showClose = false,
  onClose,
}: UnifiedWizardProps) {
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track direction for slide animations
  const handleNext = useCallback(() => {
    if (canGoNext && !loading) {
      setDirection(1);
      onNext();
    }
  }, [canGoNext, loading, onNext]);

  const handleBack = useCallback(() => {
    if (canGoBack && !loading) {
      setDirection(-1);
      onBack();
    }
  }, [canGoBack, loading, onBack]);

  const handleSkip = useCallback(() => {
    if (canSkip && !loading && onSkip) {
      onSkip();
    }
  }, [canSkip, loading, onSkip]);

  // ============================================================
  // KEYBOARD SHORTCUTS
  // ============================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter: Continue to next step
      if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        // Prevent if user is typing in an input field
        const target = e.target as HTMLElement;
        if (target.tagName !== 'TEXTAREA' && target.tagName !== 'INPUT') {
          e.preventDefault();
          handleNext();
        }
      }

      // Escape: Skip (if allowed) or close (if allowed)
      if (e.key === 'Escape') {
        if (canSkip && onSkip) {
          e.preventDefault();
          handleSkip();
        } else if (showClose && onClose) {
          e.preventDefault();
          onClose();
        }
      }

      // Arrow keys: Navigate between steps
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handleBack, handleSkip, canSkip, onSkip, showClose, onClose]);

  // ============================================================
  // PROGRESS CALCULATION
  // ============================================================

  const progressPercentage = Math.round(((currentStep + 1) / totalSteps) * 100);
  const completedSteps = currentStep; // Steps before current are completed
  const remainingSteps = totalSteps - currentStep - 1;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-ink flex flex-col"
    >
      {/* Progress Bar */}
      <div className="w-full bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Step Indicators */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-white/90">
              Step {currentStep + 1} of {totalSteps}
            </div>
            <div className="text-sm font-medium text-white/90">
              {progressPercentage}% Complete
            </div>
          </div>

          {/* Linear Progress Bar */}
          <div className="relative h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-white rounded-full"
              initial={{ width: `${((currentStep) / totalSteps) * 100}%` }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>

          {/* Step Markers */}
          <div className="flex items-center justify-between mt-3">
            {Array.from({ length: totalSteps }).map((_, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              const isUpcoming = index > currentStep;

              return (
                <div
                  key={index}
                  className="flex-1 flex items-center"
                  style={{ opacity: isUpcoming ? 0.5 : 1 }}
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: isCompleted ? 'white' : isCurrent ? 'white' : 'transparent',
                      color: isCompleted || isCurrent ? '#6366f1' : 'white',
                      border: isUpcoming ? '1px solid white/50' : 'none',
                    }}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  {index < totalSteps - 1 && (
                    <div className="flex-1 h-px bg-white/30 mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          className="w-full max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 },
              }}
            >
              {/* Content Card */}
              <div className="bg-white rounded-lg shadow-brutalist-lg overflow-hidden border-2 border-black">
                {/* Close Button (only after value delivered) */}
                {showClose && onClose && (
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                )}

                {children}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Navigation Footer */}
      <div className="bg-white/10 backdrop-blur-sm border-t border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            {canGoBack ? (
              <button
                onClick={handleBack}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Go back to previous step"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
            ) : (
              <div /> // Spacer for flex layout
            )}

            {/* Skip Button (optional steps only) */}
            {canSkip && onSkip && (
              <button
                onClick={handleSkip}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-transparent hover:bg-white/10 text-white/80 hover:text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Skip for now →
              </button>
            )}

            {/* Next/Continue Button */}
            <button
              onClick={handleNext}
              disabled={!canGoNext || loading}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-coral hover:bg-coral/90 text-white font-bold shadow-brutalist transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              aria-label={currentStep === totalSteps - 1 ? 'Complete onboarding' : 'Continue to next step'}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : currentStep === totalSteps - 1 ? (
                <>
                  Complete
                  <ChevronRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="mt-4 text-center text-xs text-white/60">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">Enter</kbd> to continue
            {canSkip && ' • '}
            {canSkip && <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">Esc</kbd>}
            {' to skip'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HELPER: useState hook for direction
// ============================================================

import { useState } from 'react';
