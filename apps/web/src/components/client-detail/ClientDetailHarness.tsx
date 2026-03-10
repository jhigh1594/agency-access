import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Platform } from '@agency-platform/shared';
import { ClientDetailHeader } from './ClientDetailHeader';
import { ClientStats } from './ClientStats';
import { ClientTabs } from './ClientTabs';
import {
  CLIENT_DETAIL_HARNESS_PRESET_NAMES,
  type ClientDetailHarnessPresetName,
  getClientDetailHarnessFixture,
} from './__fixtures__/client-detail-fixtures';

interface ClientDetailHarnessProps {
  searchParams?: {
    preset?: string;
    expand?: string;
  };
}

function parsePresetName(rawPreset?: string): ClientDetailHarnessPresetName {
  if (
    rawPreset &&
    CLIENT_DETAIL_HARNESS_PRESET_NAMES.includes(rawPreset as ClientDetailHarnessPresetName)
  ) {
    return rawPreset as ClientDetailHarnessPresetName;
  }

  return 'mixed-google';
}

function parseExpandedPlatform(
  rawExpand: string | undefined,
  availablePlatformGroups: Platform[]
): Platform | undefined {
  if (!rawExpand) {
    return undefined;
  }

  const platform = rawExpand as Platform;

  if (!availablePlatformGroups.includes(platform)) {
    return undefined;
  }

  return platform;
}

export function ClientDetailHarness({ searchParams }: ClientDetailHarnessProps) {
  const presetName = parsePresetName(searchParams?.preset);
  const data = getClientDetailHarnessFixture(presetName);
  const initialExpandedPlatformGroup = parseExpandedPlatform(
    searchParams?.expand,
    data.platformGroups.map((group) => group.platformGroup)
  );

  return (
    <div className="min-h-screen bg-paper p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-3">
          <Link
            href="/clients"
            className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            All clients
          </Link>
          <div className="rounded-lg border border-dashed border-border/80 bg-card px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Dev Harness
            </p>
            <p className="mt-1 text-sm text-foreground">
              Preset: <span className="font-mono">{presetName}</span>
            </p>
          </div>
        </div>

        <ClientDetailHeader client={data.client} />
        <ClientStats stats={data.stats} />
        <ClientTabs
          platformGroups={data.platformGroups}
          accessRequests={data.accessRequests}
          activity={data.activity}
          initialExpandedPlatformGroup={initialExpandedPlatformGroup}
        />
      </div>
    </div>
  );
}
