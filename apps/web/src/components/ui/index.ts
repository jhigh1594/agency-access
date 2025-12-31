/**
 * UI Components Index
 *
 * Central exports for shared UI components.
 */

// Button Component
export { Button } from './button';
export type { ButtonProps } from './button';

// Card Component
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card';

export { StatusBadge } from './status-badge';
export type { StatusType } from './status-badge';

export { PlatformIcon, PLATFORM_CONFIG } from './platform-icon';
export type { Platform } from '@agency-platform/shared';

export { StatCard } from './stat-card';

export { EmptyState } from './empty-state';

export { HealthBadge, ExpirationCountdown } from './health-badge';
export type { HealthStatus } from './health-badge';

export { formatRelativeTime, formatCountdown } from './format-relative-time';

export { SearchInput } from './search-input';

export { FilterDropdown } from './filter-dropdown';
export type { FilterOption } from './filter-dropdown';

// Multi-Select Combobox
export { MultiSelectCombobox } from './multi-select-combobox';
export type { MultiSelectOption } from './multi-select-combobox';
