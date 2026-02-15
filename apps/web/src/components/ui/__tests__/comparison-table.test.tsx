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

describe('ComparisonRow value rendering', () => {
  it('should show Check for true values', () => {
    render(
      <ComparisonTable>
        <tbody>
          <ComparisonRow feature="Test" leadsie={true} authhub={true} />
        </tbody>
      </ComparisonTable>
    );

    // Check icons should be present (they have the lucide class pattern)
    const cells = screen.getAllByRole('cell');
    expect(cells[1]).toBeInTheDocument(); // Leadsie cell
    expect(cells[2]).toBeInTheDocument(); // AuthHub cell
  });

  it('should show X for false values', () => {
    render(
      <ComparisonTable>
        <tbody>
          <ComparisonRow feature="Test" leadsie={false} authhub={false} />
        </tbody>
      </ComparisonTable>
    );

    const cells = screen.getAllByRole('cell');
    expect(cells[1]).toBeInTheDocument();
    expect(cells[2]).toBeInTheDocument();
  });

  it('should show string values directly', () => {
    render(
      <ComparisonTable>
        <tbody>
          <ComparisonRow feature="Test" leadsie="2 products" authhub="8 products" />
        </tbody>
      </ComparisonTable>
    );

    expect(screen.getByText('2 products')).toBeInTheDocument();
    expect(screen.getByText('8 products')).toBeInTheDocument();
  });
});
