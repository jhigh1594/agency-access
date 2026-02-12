'use client';

import { Platform, PLATFORM_NAMES } from '@agency-platform/shared';
import { cn } from '@/lib/utils';
import { PlatformIcon } from '@/components/ui/platform-icon';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import type { StatusType } from '@/components/ui/status-badge';
import { Loader2, Unlink, Edit } from 'lucide-react';

interface PlatformCardProps {
  platform: Platform;
  connected: boolean;
  connectedEmail?: string;
  status?: string;
  isConnecting?: boolean;
  isDisconnecting?: boolean;
  variant?: 'default' | 'featured';
  onConnect: (platform: Platform) => void;
  onDisconnect?: (platform: Platform) => void;
  onManageAssets?: (platform: Platform) => void;
  onEditEmail?: (platform: Platform, currentEmail: string) => void;
}

function mapStatusToBadge(status: string): StatusType {
  const s = status?.toLowerCase();
  if (s === 'expired' || s === 'invalid' || s === 'revoked') return s as StatusType;
  if (s === 'expiring') return 'expiring';
  return 'unknown';
}

export function PlatformCard({
  platform,
  connected,
  connectedEmail,
  status,
  isConnecting = false,
  isDisconnecting = false,
  variant = 'default',
  onConnect,
  onDisconnect,
  onManageAssets,
  onEditEmail,
}: PlatformCardProps) {
  const platformName = PLATFORM_NAMES[platform];
  const manualPlatforms = ['kit', 'mailchimp', 'beehiiv', 'klaviyo', 'pinterest', 'zapier'];
  const isManualPlatform = manualPlatforms.includes(platform);

  const isFeatured = variant === 'featured';
  const paddingClass = 'px-4 pt-4 pb-1'; // Minimal bottom padding under button
  const iconSize = isFeatured ? 'lg' : 'md';
  const textClass = isFeatured ? 'text-lg' : 'text-base'; // Larger platform name for prominence

  const cardBaseClasses = isFeatured
    ? 'brutalist-card bg-card'
    : 'clean-card bg-card rounded-lg';

  return (
    <div className={`${cardBaseClasses} ${paddingClass}`}>
      {/* Platform Icon and Name - tight grouping (8px gap) */}
      <div className={cn('flex flex-col items-center gap-2', 'mb-3')}>
        <PlatformIcon platform={platform} size={iconSize as 'sm' | 'md' | 'lg' | 'xl'} />
        <h3 className={`${textClass} font-semibold text-ink text-center`}>
          {platformName}
        </h3>
      </div>

      {/* Connection Status or Action - 12px below identity (mb-3), 8px between elements (gap-2) */}
      <div className="flex flex-col items-center gap-2">
        {connected ? (
          <>
            {/* Connected state - show email */}
            <div className="text-center w-full">
              <p className="text-sm text-muted-foreground truncate px-2" title={connectedEmail}>
                {connectedEmail || 'Connected'}
              </p>
              {status && status !== 'active' && (
                <div className="mt-2">
                  <StatusBadge status={mapStatusToBadge(status)} size="sm" />
                </div>
              )}
            </div>

            {/* Action buttons - use Button for design system alignment and touch targets */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2 w-full">
              {onManageAssets && (platform === 'meta' || platform === 'google') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onManageAssets(platform)}
                  className="text-coral hover:text-coral/90 hover:bg-coral/5"
                >
                  Manage Assets
                </Button>
              )}

              {onEditEmail && isManualPlatform && connectedEmail && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditEmail(platform, connectedEmail)}
                  leftIcon={<Edit className="h-3.5 w-3.5" />}
                >
                  Edit Email
                </Button>
              )}

              {onDisconnect && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDisconnect(platform)}
                  disabled={isDisconnecting}
                  leftIcon={
                    isDisconnecting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Unlink className="h-3.5 w-3.5" />
                    )
                  }
                >
                  {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Not connected - show Connect button */}
            <Button
              variant="primary"
              size="sm"
              isLoading={isConnecting}
              onClick={() => onConnect(platform)}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
