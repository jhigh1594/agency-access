/**
 * Suppresses hydration warnings caused by browser extensions (e.g., Bitdefender, AVG).
 * Extensions inject attributes like `bis_skin_checked="1"` which cause React hydration mismatches.
 *
 * This must be imported before React renders to intercept hydration errors.
 */

if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;

  console.error = (...args) => {
    const firstArg = args[0];

    // Filter out browser extension hydration warnings
    if (typeof firstArg === 'string') {
      // Check for Bitdefender/AVG extension attributes
      if (firstArg.includes('bis_skin_checked')) {
        return;
      }
      // Check for general hydration mismatch with extension attributes
      if (firstArg.includes('A tree hydrated but some attributes') && args.some(arg => typeof arg === 'string' && arg.includes('bis_skin_checked'))) {
        return;
      }
      // Check for hydration failed messages with extension attributes
      if (firstArg.includes('Hydration failed') && args.some(arg => typeof arg === 'string' && arg.includes('bis_skin_checked'))) {
        return;
      }
    }

    // Log all other errors normally
    originalConsoleError.apply(console, args);
  };
}
