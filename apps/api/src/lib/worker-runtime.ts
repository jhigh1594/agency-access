export type WorkerRuntimeMode = 'all' | 'google-native-only' | 'disabled';

export function resolveWorkerRuntimeMode(input: {
  backgroundWorkersEnabled: boolean;
  googleAdsDeveloperToken?: string;
}): WorkerRuntimeMode {
  if (input.backgroundWorkersEnabled) {
    return 'all';
  }

  if (input.googleAdsDeveloperToken?.trim()) {
    return 'google-native-only';
  }

  return 'disabled';
}
