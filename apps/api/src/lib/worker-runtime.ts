export type GoogleNativeGrantDispatchMode = 'queued' | 'inline';

const FALSE_VALUES = new Set(['false', '0', 'no', 'off']);

export function resolveGoogleNativeGrantDispatchMode(
  backgroundWorkersEnabled: string | undefined
): GoogleNativeGrantDispatchMode {
  const normalized = backgroundWorkersEnabled?.trim().toLowerCase();

  return normalized && FALSE_VALUES.has(normalized) ? 'inline' : 'queued';
}
