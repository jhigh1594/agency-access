/**
 * ComparisonTable Component Tests
 *
 * Tests for the marketing comparison table components
 * with grouped sections and feature rows
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComparisonTable, ComparisonHeader, ComparisonSection, ComparisonRow } from '../comparison-table';

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

describe('ComparisonHeader', () => {
  it('should render three columns', () => {
    render(
      <ComparisonTable>
        <ComparisonHeader />
      </ComparisonTable>
    );

    expect(screen.getByText('Feature')).toBeInTheDocument();
    expect(screen.getByText('Leadsie')).toBeInTheDocument();
    expect(screen.getByText('AuthHub')).toBeInTheDocument();
  });
});

describe('ComparisonSection', () => {
  it('should render title', () => {
    render(
      <ComparisonTable>
        <tbody>
          <ComparisonSection title="Platform Support">
            <tr><td>Content</td></tr>
          </ComparisonSection>
        </tbody>
      </ComparisonTable>
    );

    expect(screen.getByText('Platform Support')).toBeInTheDocument();
  });
});

describe('ComparisonRow', () => {
  it('should render feature name', () => {
    render(
      <ComparisonTable>
        <tbody>
          <ComparisonSection title="Test Section">
            <ComparisonRow feature="Meta Ads" leadsie={true} authhub={true} />
          </ComparisonSection>
        </tbody>
      </ComparisonTable>
    );

    expect(screen.getByText('Meta Ads')).toBeInTheDocument();
  });
});
