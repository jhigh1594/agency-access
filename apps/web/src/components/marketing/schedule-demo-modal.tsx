'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ScheduleDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScheduleDemoModal({ isOpen, onClose }: ScheduleDemoModalProps) {
  const embedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    // Initialize Cal.com embed loader
    (function (C: any, A: string, L: string) {
      let p = function (a: any, ar: any) { a.q.push(ar); };
      let d = C.document;
      C.Cal = C.Cal || function () {
        let cal = C.Cal;
        let ar = arguments;
        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q || [];
          d.head.appendChild(d.createElement("script")).src = A;
          cal.loaded = true;
        }
        if (ar[0] === L) {
          const api: { (): void; q: any[] } = function () { p(api, arguments); };
          api.q = api.q || [];
          const namespace = ar[1];
          if (typeof namespace === "string") {
            cal.ns[namespace] = cal.ns[namespace] || api;
            p(cal.ns[namespace], ar);
            p(cal, ["initNamespace", namespace]);
          } else p(cal, ar);
          return;
        }
        p(cal, ar);
      };
    })(window, "https://app.cal.com/embed/embed.js", "init");

    // Initialize Cal.com with namespace
    (window as any).Cal("init", "authhub-demo", { origin: "https://app.cal.com" });

    // Wait for script to load and DOM to be ready
    const initInline = () => {
      if (embedRef.current && (window as any).Cal?.ns?.["authhub-demo"]) {
        // Initialize inline embed
        (window as any).Cal.ns["authhub-demo"]("inline", {
          elementOrSelector: "#my-cal-inline-authhub-demo",
          config: { layout: "month_view" },
          calLink: "pillar-ai/authhub-demo",
        });

        // Configure UI with custom brand color
        (window as any).Cal.ns["authhub-demo"]("ui", {
          theme: "light",
          cssVarsPerTheme: {
            light: {
              "cal-brand": "#FF6B35"
            }
          },
          hideEventTypeDetails: false,
          layout: "month_view"
        });
      }
    };

    // Check if Cal is already loaded
    if ((window as any).Cal?.loaded) {
      // Small delay to ensure DOM is ready
      setTimeout(initInline, 100);
    } else {
      // Wait for script to load
      const checkInterval = setInterval(() => {
        if ((window as any).Cal?.loaded && embedRef.current) {
          clearInterval(checkInterval);
          initInline();
        }
      }, 100);

      // Cleanup interval after 10 seconds
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
      }, 10000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
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
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col pointer-events-auto border-2 border-black"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b-2 border-black bg-paper">
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

              {/* Content - Cal.com Inline Embed */}
              <div className="flex-1 overflow-hidden bg-paper min-h-0">
                <div
                  ref={embedRef}
                  id="my-cal-inline-authhub-demo"
                  className="w-full h-full"
                  style={{ width: '100%', minHeight: '600px', height: '100%' }}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
