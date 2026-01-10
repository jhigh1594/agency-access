'use client';

import { useEffect } from 'react';

/**
 * Cal.com Element-Click Embed Script
 * Initializes Cal.com embed script for element-click functionality.
 * Add data-cal-link, data-cal-namespace, and data-cal-config attributes
 * to any element to make it open the Cal.com booking popup.
 */
export function CalEmbedScript() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if Cal is already initialized
    if ((window as any).Cal?.loaded) {
      return;
    }

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
          const api = function () { p(api, arguments); };
          const namespace = ar[1];
          api.q = api.q || [];
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

    // Configure UI
    (window as any).Cal.ns["authhub-demo"]("ui", {
      theme: "light",
      hideEventTypeDetails: false,
      layout: "month_view"
    });
  }, []);

  return null;
}
