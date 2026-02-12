/**
 * Design System Utilities Tests
 * 
 * Tests for design system validation helpers.
 * These tests ensure our migration utilities correctly identify
 * design system violations.
 */

import { describe, it, expect } from 'vitest';
import {
  hasBrutalistShadow,
  hasSoftShadow,
  usesGenericColor,
  usesBrandColor,
  hasOverRoundedRadius,
  hasBrutalistRadius,
  semanticColorMapping,
  extractClassNames,
  hasClassMatching,
  validateDesignSystem,
  brutalistShadowFor,
} from '../design-system';

describe('hasBrutalistShadow', () => {
  it('should return true for brutalist shadow variants', () => {
    expect(hasBrutalistShadow('shadow-brutalist')).toBe(true);
    expect(hasBrutalistShadow('shadow-brutalist-sm')).toBe(true);
    expect(hasBrutalistShadow('shadow-brutalist-lg')).toBe(true);
    expect(hasBrutalistShadow('shadow-brutalist-xl')).toBe(true);
    expect(hasBrutalistShadow('shadow-brutalist-2xl')).toBe(true);
  });

  it('should return false for soft shadows', () => {
    expect(hasBrutalistShadow('shadow-md')).toBe(false);
    expect(hasBrutalistShadow('shadow-lg')).toBe(false);
    expect(hasBrutalistShadow('shadow-xl')).toBe(false);
  });

  it('should return false for empty/undefined input', () => {
    expect(hasBrutalistShadow('')).toBe(false);
    expect(hasBrutalistShadow(undefined as any)).toBe(false);
  });

  it('should handle multiple classes', () => {
    expect(hasBrutalistShadow('bg-white shadow-brutalist p-4')).toBe(true);
    expect(hasBrutalistShadow('bg-white shadow-xl p-4')).toBe(false);
  });
});

describe('hasSoftShadow', () => {
  it('should return true for soft shadow variants', () => {
    expect(hasSoftShadow('shadow-sm')).toBe(true);
    expect(hasSoftShadow('shadow-md')).toBe(true);
    expect(hasSoftShadow('shadow-lg')).toBe(true);
    expect(hasSoftShadow('shadow-xl')).toBe(true);
    expect(hasSoftShadow('shadow-2xl')).toBe(true);
    expect(hasSoftShadow('shadow-3xl')).toBe(true);
  });

  it('should return false for brutalist shadows', () => {
    expect(hasSoftShadow('shadow-brutalist')).toBe(false);
    expect(hasSoftShadow('shadow-brutalist-lg')).toBe(false);
  });

  it('should return false for empty/undefined input', () => {
    expect(hasSoftShadow('')).toBe(false);
    expect(hasSoftShadow(undefined as any)).toBe(false);
  });
});

describe('usesGenericColor', () => {
  it('should return true for generic color usage', () => {
    expect(usesGenericColor('text-slate-900')).toBe(true);
    expect(usesGenericColor('bg-indigo-100')).toBe(true);
    expect(usesGenericColor('border-green-200')).toBe(true);
    expect(usesGenericColor('text-red-600')).toBe(true);
  });

  it('should return false for brand colors', () => {
    expect(usesGenericColor('text-ink')).toBe(false);
    expect(usesGenericColor('bg-coral')).toBe(false);
    expect(usesGenericColor('bg-teal/10')).toBe(false);
    expect(usesGenericColor('bg-acid/20')).toBe(false);
  });

  it('should return false for neutral Tailwind colors not in generic list', () => {
    // gray/black/white are acceptable neutrals
    expect(usesGenericColor('text-white')).toBe(false);
    expect(usesGenericColor('bg-black')).toBe(false);
  });
});

describe('usesBrandColor', () => {
  it('should return true for brand colors', () => {
    expect(usesBrandColor('bg-coral')).toBe(true);
    expect(usesBrandColor('text-teal')).toBe(true);
    expect(usesBrandColor('border-acid')).toBe(true);
  });

  it('should return true for neutral colors', () => {
    expect(usesBrandColor('text-white')).toBe(true);
    expect(usesBrandColor('bg-black')).toBe(true);
  });

  it('should return false for generic colors', () => {
    expect(usesBrandColor('text-slate-900')).toBe(false);
    expect(usesBrandColor('bg-indigo-500')).toBe(false);
  });

  it('should return true for empty input', () => {
    expect(usesBrandColor('')).toBe(true);
    expect(usesBrandColor(undefined as any)).toBe(true);
  });
});

describe('hasOverRoundedRadius', () => {
  it('should return true for over-rounded borders', () => {
    expect(hasOverRoundedRadius('rounded-2xl')).toBe(true);
    expect(hasOverRoundedRadius('rounded-3xl')).toBe(true);
    expect(hasOverRoundedRadius('rounded-full')).toBe(true);
  });

  it('should return false for acceptable border radius', () => {
    expect(hasOverRoundedRadius('rounded')).toBe(false);
    expect(hasOverRoundedRadius('rounded-md')).toBe(false);
    expect(hasOverRoundedRadius('rounded-lg')).toBe(false);
    expect(hasOverRoundedRadius('rounded-xl')).toBe(false);
  });
});

describe('hasBrutalistRadius', () => {
  it('should return true for acceptable radius', () => {
    expect(hasBrutalistRadius('rounded')).toBe(true);
    expect(hasBrutalistRadius('rounded-md')).toBe(true);
    expect(hasBrutalistRadius('rounded-lg')).toBe(true);
  });

  it('should return false for over-rounded borders', () => {
    expect(hasBrutalistRadius('rounded-2xl')).toBe(false);
    expect(hasBrutalistRadius('rounded-3xl')).toBe(false);
    expect(hasBrutalistRadius('rounded-full')).toBe(false);
  });
});

describe('semanticColorMapping', () => {
  it('should provide correct mappings for semantic colors', () => {
    const mappings = semanticColorMapping();
    
    // Success should be teal, not green
    expect(mappings.success.correct).toBe('teal');
    expect(mappings.success.wrong).toContain('green');
    
    // Warning should be acid, not amber
    expect(mappings.warning.correct).toBe('acid');
    expect(mappings.warning.wrong).toContain('amber');
    
    // Danger should be coral, not red
    expect(mappings.danger.correct).toBe('coral');
    expect(mappings.danger.wrong).toContain('red');
  });
});

describe('extractClassNames', () => {
  it('should extract class names from string', () => {
    expect(extractClassNames('bg-white text-black p-4')).toEqual([
      'bg-white',
      'text-black',
      'p-4',
    ]);
  });

  it('should handle empty string', () => {
    expect(extractClassNames('')).toEqual([]);
  });

  it('should handle undefined', () => {
    expect(extractClassNames(undefined)).toEqual([]);
  });

  it('should filter out empty strings from split', () => {
    expect(extractClassNames('bg-white  text-black')).toEqual([
      'bg-white',
      'text-black',
    ]);
  });
});

describe('hasClassMatching', () => {
  it('should return true if any class matches pattern', () => {
    expect(
      hasClassMatching('bg-white text-black p-4', /bg-/)
    ).toBe(true);
    expect(
      hasClassMatching('bg-white text-black p-4', /text-/)
    ).toBe(true);
  });

  it('should return false if no class matches pattern', () => {
    expect(
      hasClassMatching('bg-white text-black p-4', /shadow-/)
    ).toBe(false);
  });

  it('should handle undefined input', () => {
    expect(
      hasClassMatching(undefined, /bg-/)
    ).toBe(false);
  });
});

describe('validateDesignSystem', () => {
  it('should detect generic color violations', () => {
    const violations = validateDesignSystem('text-slate-900 bg-indigo-100');
    
    expect(violations).toHaveLength(2);
    expect(violations[0].type).toBe('generic-color');
    expect(violations[0].className).toBe('text-slate-900');
  });

  it('should detect soft shadow violations', () => {
    const violations = validateDesignSystem('shadow-xl');
    
    expect(violations).toHaveLength(1);
    expect(violations[0].type).toBe('soft-shadow');
    expect(violations[0].className).toBe('shadow-xl');
  });

  it('should detect over-rounded violations', () => {
    const violations = validateDesignSystem('rounded-2xl');
    
    expect(violations).toHaveLength(1);
    expect(violations[0].type).toBe('over-rounded');
    expect(violations[0].className).toBe('rounded-2xl');
  });

  it('should detect multiple violations', () => {
    const violations = validateDesignSystem(
      'bg-slate-50 shadow-xl rounded-2xl text-indigo-500'
    );
    
    expect(violations.length).toBeGreaterThan(2);
    const types = violations.map(v => v.type);
    expect(types).toContain('generic-color');
    expect(types).toContain('soft-shadow');
    expect(types).toContain('over-rounded');
  });

  it('should return empty array for compliant classes', () => {
    const violations = validateDesignSystem(
      'bg-coral text-teal shadow-brutalist rounded-lg'
    );
    
    expect(violations).toHaveLength(0);
  });

  it('should return empty array for empty input', () => {
    expect(validateDesignSystem('')).toEqual([]);
    expect(validateDesignSystem(undefined)).toEqual([]);
  });

  it('should provide helpful suggestions', () => {
    const violations = validateDesignSystem('text-slate-900');
    
    expect(violations[0].suggestion).toBeDefined();
    expect(violations[0].suggestion).toContain('brand color');
  });
});

describe('brutalistShadowFor', () => {
  it('should map soft shadows to brutalist equivalents', () => {
    expect(brutalistShadowFor('shadow-sm')).toBe('shadow-brutalist-sm');
    expect(brutalistShadowFor('shadow-md')).toBe('shadow-brutalist');
    expect(brutalistShadowFor('shadow-lg')).toBe('shadow-brutalist-lg');
    expect(brutalistShadowFor('shadow-xl')).toBe('shadow-brutalist-xl');
    expect(brutalistShadowFor('shadow-2xl')).toBe('shadow-brutalist-2xl');
  });

  it('should default to shadow-brutalist for unknown shadows', () => {
    expect(brutalistShadowFor('unknown')).toBe('shadow-brutalist');
  });
});
