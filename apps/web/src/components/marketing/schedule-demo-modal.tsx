'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ScheduleDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScheduleDemoModal({ isOpen, onClose }: ScheduleDemoModalProps) {
  // Load lemcal script when modal opens
  useEffect(() => {
    if (isOpen) {
      // Check if script is already loaded
      const existingScript = document.querySelector('script[src="https://cdn.lemcal.com/lemcal-integrations.min.js"]');
      
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://cdn.lemcal.com/lemcal-integrations.min.js';
        script.defer = true;
        document.body.appendChild(script);
      }
    }
  }, [isOpen]);

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

              {/* Content - Lemcal Embed */}
              <div className="flex-1 overflow-y-auto px-6 py-6 bg-paper min-h-[500px]">
                <div 
                  className="lemcal-embed-booking-calendar" 
                  data-user="usr_aL9FN5c4HgaRuHc4m" 
                  data-meeting-type="met_GMNRzSYzaGpHXDLkq"
                ></div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
