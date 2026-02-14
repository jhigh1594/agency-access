'use client';

import { useState } from 'react';
import { Mail, Calendar, Clock, Linkedin, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScheduleDemoModal } from '@/components/marketing/schedule-demo-modal';

export function ContactInfoCard() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  return (
    <>
      <div className="bg-paper p-8 border-2 border-black shadow-brutalist h-full flex flex-col">
        {/* Header */}
        <h3 className="font-display text-xl font-bold text-ink mb-6">
          Contact Information
        </h3>

        {/* Contact Methods */}
        <div className="space-y-6">
          {/* Email */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-coral/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-coral" />
            </div>
            <div>
              <p className="font-mono text-sm text-gray-500 mb-1">Email us</p>
              <a
                href="mailto:jon@pillaraiagency.com"
                className="text-ink hover:text-coral transition-colors font-medium"
              >
                jon@pillaraiagency.com
              </a>
            </div>
          </div>

          {/* Schedule Demo */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-coral/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-coral" />
            </div>
            <div>
              <p className="font-mono text-sm text-gray-500 mb-1">Talk to us</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsDemoModalOpen(true)}
                className="hover:bg-coral/10 hover:border-coral"
              >
                Schedule a Demo
              </Button>
            </div>
          </div>

          {/* Response Time */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-teal/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-teal" />
            </div>
            <div>
              <p className="font-mono text-sm text-gray-500 mb-1">Response time</p>
              <p className="text-ink font-medium">Within 24 hours</p>
            </div>
          </div>
        </div>

        {/* Spacer to push bottom content down */}
        <div className="flex-1" />

        {/* Divider */}
        <div className="border-t border-gray-200 my-6" />

        {/* Social Links */}
        <div>
          <p className="font-mono text-sm text-gray-500 mb-3">Follow us</p>
          <div className="flex gap-3">
            <a
              href="https://linkedin.com/company/authhub"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 hover:bg-coral/10 hover:text-coral transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a
              href="https://twitter.com/authhub"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 hover:bg-coral/10 hover:text-coral transition-colors"
              aria-label="X (Twitter)"
            >
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Quick Help */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="font-mono text-xs text-gray-500 mb-2">Looking for quick answers?</p>
          <a
            href="/pricing#faq"
            className="text-coral hover:text-coral/80 transition-colors text-sm font-medium"
          >
            Check our FAQ &rarr;
          </a>
        </div>
      </div>

      {/* Schedule Demo Modal */}
      <ScheduleDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </>
  );
}
