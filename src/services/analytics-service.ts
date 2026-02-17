// Existing analytics service — the agent should integrate with this
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

export class AnalyticsService {
  async query(params: AnalyticsQuery): Promise<AnalyticsResult> {
    // In production this hits the database
    // For demo purposes, returns mock data
    return {
      data: Object.fromEntries(
        params.metrics.map((m) => [
          m,
          Array(30)
            .fill(0)
            .map(() => Math.random() * 100),
        ])
      ),
      labels: Array(30)
        .fill(0)
        .map((_, i) => `Day ${i + 1}`),
      totalRows: 30,
    };
  }
}
