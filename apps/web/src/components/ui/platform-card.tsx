'use client';

import { Platform, PLATFORM_NAMES } from '@agency-platform/shared';
import { PlatformIcon } from '@/components/ui/platform-icon';
import { Loader2 } from 'lucide-react';

interface PlatformCardProps {
  platform: Platform;
  connected: boolean;
  connectedEmail?: string;
  status?: string;
  isConnecting?: boolean;
  variant?: 'default' | 'featured';
  onConnect: (platform: Platform) => void;
  onDisconnect?: (platform: Platform) => void;
}

export function PlatformCard({
  platform,
  connected,
  connectedEmail,
  status,
  isConnecting = false,
  variant = 'default',
  onConnect,
  onDisconnect,
}: PlatformCardProps) {
  const platformName = PLATFORM_NAMES[platform];

  // Featured variant has larger padding and icon size
  const isFeatured = variant === 'featured';
  const paddingClass = isFeatured ? 'p-8' : 'p-6';
  const iconSize = isFeatured ? 'xl' : 'lg';
  const textClass = isFeatured ? 'text-lg' : 'text-base';

  return (
    <div className={`bg-white border border-slate-200 rounded-lg ${paddingClass} hover:shadow-md transition-shadow ${isFeatured ? 'shadow-sm' : ''}`}>
      {/* Platform Icon and Name */}
      <div className={`flex flex-col items-center gap-4 mb-${isFeatured ? '6' : '4'}`}>
        <PlatformIcon platform={platform} size={iconSize as any} variant="gradient" />
        <h3 className={`${textClass} font-semibold text-slate-900 text-center`}>
          {platformName}
        </h3>
      </div>

      {/* Connection Status or Action */}
      <div className="flex flex-col items-center gap-2">
        {connected ? (
          <>
            {/* Connected state - show email */}
            <div className="text-center w-full">
              <p className="text-sm text-slate-600 truncate px-2" title={connectedEmail}>
                {connectedEmail || 'Connected'}
              </p>
              {status && status !== 'active' && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-2 ${
                    status === 'expired'
                      ? 'bg-red-100 text-red-800'
                      : status === 'invalid'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {status}
                </span>
              )}
            </div>

            {/* Optional disconnect button */}
            {onDisconnect && (
              <button
                onClick={() => onDisconnect(platform)}
                className="text-xs text-slate-500 hover:text-red-600 transition-colors mt-2"
              >
                Disconnect
              </button>
            )}
          </>
        ) : (
          <>
            {/* Not connected - show Connect button */}
            <button
              onClick={() => onConnect(platform)}
              disabled={isConnecting}
              className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
