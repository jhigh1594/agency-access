/**
 * Migration Test Helper
 * 
 * Template test structure for component migration to brutalist design system.
 * Provides reusable test patterns for validating design system compliance.
 */

import { render, RenderOptions } from '@testing-library/react';
import {screen, within} from '@testing-library/react';
import { 
  validateDesignSystem, 
  extractClassNames,
  hasSoftShadow,
  usesGenericColor,
  hasOverRoundedRadius
} from './design-system';

/**
 * Migration test case configuration
 */
export interface MigrationTestCase {
  description: string;
  component: () => JSX.Element;
  options?: RenderOptions;
}

/**
 * Migration expectations to validate against
 */
export interface MigrationExpectations {
  noGenericColors?: string[]; // Specific generic colors to check (e.g., ['slate', 'indigo'])
  noSoftShadows?: boolean; // Check for any soft shadows
  noOverRounded?: boolean; // Check for over-rounded borders
  requireBrutalistShadows?: boolean; // Require brutalist shadows
  customChecks?: (container: HTMLElement) => void; // Custom validation logic
}

/**
 * Create a design system compliance test
 * 
 * @param componentName - Name of component being tested
 * @param renderComponent - Function that renders the component
 * @param expectations - What to validate
 */
export function testDesignSystemCompliance(
  componentName: string,
  renderComponent: () => JSX.Element,
  expectations: MigrationExpectations
): void {
  describe(`${componentName} - Design System Compliance`, () => {
    it('should not use generic colors', () => {
      const { container } = render(renderComponent());
      
      // Get all elements with class names
      const elements = container.querySelectorAll('[class]');
      
      for (const el of Array.from(elements)) {
        const className = el.className.toString();
        const violations = validateDesignSystem(className);
        
        // Filter to only generic color violations
        const colorViolations = violations.filter(v => v.type === 'generic-color');
        
        expect(
          colorViolations.length,
          `Element with class "${el.className}" contains generic color: ${colorViolations.map(v => v.className).join(', ')}`
        ).toBe(0);
      }
    });

    if (expectations.noSoftShadows || expectations.requireBrutalistShadows) {
      it('should not use soft shadows', () => {
        const { container } = render(renderComponent());
        
        const elements = container.querySelectorAll('[class]');
        
        for (const el of Array.from(elements)) {
          const className = el.className.toString();
          
          expect(
            hasSoftShadow(className),
            `Element with class "${className}" uses soft shadow`
          ).toBe(false);
        }
      });
    }

    if (expectations.requireBrutalistShadows) {
      it('should use brutalist shadows for depth', () => {
        const { container } = render(renderComponent());
        
        // At least one element should have a brutalist shadow
        const elements = container.querySelectorAll('[class]');
        const hasBrutalist = Array.from(elements).some(el => 
          /shadow-brutalist/.test(el.className.toString())
        );
        
        expect(
          hasBrutalist,
          'No brutalist shadows found in component'
        ).toBe(true);
      });
    }

    if (expectations.noOverRounded) {
      it('should not use over-rounded border radius', () => {
        const { container } = render(renderComponent());
        
        const elements = container.querySelectorAll('[class]');
        
        for (const el of Array.from(elements)) {
          const className = el.className.toString();
          
          expect(
            hasOverRoundedRadius(className),
            `Element with class "${className}" uses over-rounded border radius`
          ).toBe(false);
        }
      });
    }

    if (expectations.customChecks) {
      it('should pass custom design system checks', () => {
        const { container } = render(renderComponent());
        expectations.customChecks!(container);
      });
    }
  });
}

/**
 * Test semantic color usage
 * Success -> teal, Warning -> acid, Danger -> coral
 */
export function testSemanticColors(
  componentName: string,
  renderComponent: () => JSX.Element,
  semanticSelectors: {
    success?: string; // Selector for success states
    warning?: string; // Selector for warning states
    danger?: string; // Selector for danger states
  }
): void {
  describe(`${componentName} - Semantic Color Usage`, () => {
    if (semanticSelectors.success) {
      it('should use teal for success states (not green)', () => {
        render(renderComponent());
        const successElements = screen.getAllByRole(
          semanticSelectors.success as any // Type assertion for getByRole
        );
        
        for (const el of Array.from(successElements)) {
          const className = (el as HTMLElement).className.toString();
          
          // Should have teal, not green
          expect(className).toMatch(/teal/i);
          expect(className).not.toMatch(/green|emerald/i);
        }
      });
    }

    if (semanticSelectors.warning) {
      it('should use acid for warning states (not amber)', () => {
        render(renderComponent());
        const warningElements = screen.getAllByRole(
          semanticSelectors.warning as any
        );
        
        for (const el of Array.from(warningElements)) {
          const className = (el as HTMLElement).className.toString();
          
          expect(className).toMatch(/acid/i);
          expect(className).not.toMatch(/amber|yellow/i);
        }
      });
    }

    if (semanticSelectors.danger) {
      it('should use coral for danger states (not red)', () => {
        render(renderComponent());
        const dangerElements = screen.getAllByRole(
          semanticSelectors.danger as any
        );
        
        for (const el of Array.from(dangerElements)) {
          const className = (el as HTMLElement).className.toString();
          
          expect(className).toMatch(/coral/i);
          expect(className).not.toMatch(/red|rose/i);
        }
      });
    }
  });
}

/**
 * Test border usage
 * Borders should be hard (border-black) not soft (border-slate-*)
 */
export function testBorderUsage(
  componentName: string,
  renderComponent: () => JSX.Element,
  requireHardBorders: boolean = true
): void {
  describe(`${componentName} - Border Usage`, () => {
    if (requireHardBorders) {
      it('should use hard borders (border-black or border-2)', () => {
        const { container } = render(renderComponent());
        const elements = container.querySelectorAll('[class]');
        
        // Check for soft borders (border-slate-*, border-gray-*)
        const softBorders = Array.from(elements).filter(el => {
          const className = el.className.toString();
          return /border-(slate|gray|indigo)-/.test(className);
        });
        
        expect(
          softBorders.length,
          'Found soft borders that should be border-black or border-2'
        ).toBe(0);
      });
    }
  });
}

/**
 * Quick helper to check a single class string for violations
 */
export function expectNoViolations(className: string): void {
  const violations = validateDesignSystem(className);
  
  if (violations.length > 0) {
    const message = violations
      .map(v => `${v.type}: "${v.className}" -> ${v.suggestion}`)
      .join('\n');
    throw new Error(`Design system violations found:\n${message}`);
  }
}

/**
 * Expect specific classes to be present
 */
export function expectClasses(className: string, expectedPatterns: RegExp[]): void {
  for (const pattern of expectedPatterns) {
    expect(className).toMatch(pattern);
  }
}

/**
 * Expect specific classes to NOT be present
 */
export function expectNoClasses(className: string, forbiddenPatterns: RegExp[]): void {
  for (const pattern of forbiddenPatterns) {
    expect(className).not.toMatch(pattern);
  }
}
