/**
 * ComparisonTable Component Tests
 *
 * Tests for the marketing comparison table components
 * with grouped sections and feature rows
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComparisonTable } from '../comparison-table';

describe('ComparisonTable', () => {
  it('should render children', () => {
    render(
      <ComparisonTable>
        <div>Test Content</div>
      </ComparisonTable>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
