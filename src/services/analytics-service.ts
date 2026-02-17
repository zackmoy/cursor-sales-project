export interface DateRange {
  start: Date;
  end: Date;
}

export interface AnalyticsQuery {
  dateRange: DateRange;
  metrics: string[];
  workspaceId: string;
}

export interface AnalyticsResult {
  data: Record<string, number[]>;
  labels: string[];
  totalRows: number;
}

/** Seed-based pseudo-random for deterministic demo data. */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Generate realistic-looking analytics data with trends and weekly seasonality. */
function generateMetricSeries(
  metricName: string,
  days: number,
  seed: number,
): number[] {
  const rand = seededRandom(seed);

  const baseValues: Record<string, { base: number; growth: number; noise: number }> = {
    activeUsers: { base: 1240, growth: 12, noise: 80 },
    events: { base: 48500, growth: 350, noise: 3200 },
    sessions: { base: 3800, growth: 28, noise: 260 },
    pageViews: { base: 24000, growth: 180, noise: 1800 },
    apiCalls: { base: 152000, growth: 1200, noise: 9500 },
    errorRate: { base: 2.1, growth: -0.02, noise: 0.4 },
  };

  const config = baseValues[metricName] ?? { base: 1000, growth: 10, noise: 100 };

  return Array.from({ length: days }, (_, i) => {
    const trend = config.base + config.growth * i;
    const dayOfWeek = i % 7;
    const weekendDip = dayOfWeek >= 5 ? 0.72 : 1.0;
    const noise = (rand() - 0.5) * 2 * config.noise;
    return Math.max(0, Math.round((trend + noise) * weekendDip * 100) / 100);
  });
}

function generateLabels(start: Date, days: number): string[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export class AnalyticsService {
  async query(params: AnalyticsQuery): Promise<AnalyticsResult> {
    const start = params.dateRange.start;
    const end = params.dateRange.end;
    const days = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    );

    const baseSeed = start.getTime() % 100000;
    const data: Record<string, number[]> = {};
    for (const [idx, metric] of params.metrics.entries()) {
      data[metric] = generateMetricSeries(metric, days, baseSeed + idx * 7919);
    }

    return {
      data,
      labels: generateLabels(start, days),
      totalRows: days,
    };
  }
}
