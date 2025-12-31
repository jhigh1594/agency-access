/**
 * Simple Icon Component
 * 
 * Renders Simple Icons with consistent styling
 */

import type { SimpleIcon } from 'simple-icons';

interface SimpleIconProps {
  icon: SimpleIcon;
  size?: number | string;
  color?: string;
  className?: string;
}

export function SimpleIconComponent({ 
  icon, 
  size = 24, 
  color,
  className = '' 
}: SimpleIconProps) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      style={color ? { color } : undefined}
    >
      <path d={icon.path} />
    </svg>
  );
}

