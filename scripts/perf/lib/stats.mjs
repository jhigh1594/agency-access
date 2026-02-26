export function summarize(values) {
  if (values.length === 0) {
    return {
      count: 0,
      minMs: 0,
      maxMs: 0,
      meanMs: 0,
      p50Ms: 0,
      p95Ms: 0,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, current) => acc + current, 0);

  const percentile = (p) => {
    const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
    return sorted[index];
  };

  return {
    count: sorted.length,
    minMs: round(sorted[0]),
    maxMs: round(sorted[sorted.length - 1]),
    meanMs: round(sum / sorted.length),
    p50Ms: round(percentile(50)),
    p95Ms: round(percentile(95)),
  };
}

export function round(value) {
  return Number(value.toFixed(2));
}
