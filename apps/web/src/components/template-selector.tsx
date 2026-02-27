/**
 * Template Selector Component
 *
 * Step 0 of the access request wizard.
 * Allows users to select a template or start from scratch.
 */

'use client';

import { useState, useEffect } from 'react';
import { Star, LayoutTemplate, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import type { AccessRequestTemplate } from '@agency-platform/shared';
import { getPlatformCount, getGroupCount } from '@/lib/transform-platforms';

interface TemplateSelectorProps {
  agencyId: string;
  onSelect: (template: AccessRequestTemplate | null) => void;
  selectedTemplate?: AccessRequestTemplate | null;
}

export function TemplateSelector({ agencyId, onSelect, selectedTemplate }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<AccessRequestTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTemplates() {
      const { getAgencyTemplates } = await import('@/lib/api/templates');
      const result = await getAgencyTemplates(agencyId);
      if (result.data) {
        setTemplates(result.data);
      }
      setLoading(false);
    }
    loadTemplates();
  }, [agencyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">Choose a Template</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Start with a pre-configured template or create from scratch
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start from scratch option */}
        <motion.button
          type="button"
          onClick={() => onSelect(null)}
          className={`p-6 rounded-lg border-2 text-left transition-all ${
            selectedTemplate === null
              ? 'border-coral bg-coral/10 ring-2 ring-coral/30'
              : 'border-border hover:border-coral/40 hover:bg-muted/20'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-muted/30 rounded-lg">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-ink">Start from Scratch</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create a custom access request with your preferred settings
              </p>
            </div>
          </div>
        </motion.button>

        {/* Template cards */}
        {templates.map((template) => {
          const platformCount = getPlatformCount(template.platforms);
          const groupCount = getGroupCount(template.platforms);

          return (
            <motion.button
              key={template.id}
              type="button"
              onClick={() => onSelect(template)}
              className={`p-6 rounded-lg border-2 text-left transition-all ${
                selectedTemplate?.id === template.id
                  ? 'border-coral bg-coral/10 ring-2 ring-coral/30'
                  : 'border-border hover:border-coral/40 hover:bg-muted/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-coral/20 rounded-lg">
                    <LayoutTemplate className="h-5 w-5 text-coral" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-ink">{template.name}</h3>
                      {template.isDefault && (
                        <Star className="h-4 w-4 text-coral fill-coral" />
                      )}
                    </div>
                    {template.description && (
                      <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>
                        {platformCount} platform{platformCount !== 1 ? 's' : ''}
                      </span>
                      <span>•</span>
                      <span>
                        {template.intakeFields?.length || 0} form field
                        {(template.intakeFields?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No templates yet. Create your first template by saving a configuration!
        </div>
      )}
    </div>
  );
}
