'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ScheduleDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScheduleDemoModal({ isOpen, onClose }: ScheduleDemoModalProps) {

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="schedule-demo-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="schedule-demo-content"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto border-2 border-black"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-paper">
                <div>
                  <h2 className="font-dela text-2xl font-black text-ink">Schedule a Demo</h2>
                  <p className="text-sm text-gray-600 mt-1 font-mono">
                    Book a time to see AuthHub in action
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors border-2 border-black hover:shadow-brutalist-sm"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5 text-ink" />
                </button>
              </div>

              {/* Content - Cal.com Embed */}
              <div className="flex-1 overflow-hidden px-6 py-6 bg-paper">
                <iframe
                  src="https://app.cal.com/pillar-ai/authhub-demo/embed?layout=month_view"
                  className="w-full h-full min-h-[600px] border-0 rounded-lg"
                  title="Schedule a demo with AuthHub"
                  allow="camera; microphone; geolocation"
                  style={{ minHeight: '600px' }}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
