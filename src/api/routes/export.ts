import { Router } from "express";
import { z } from "zod";
import { AnalyticsService } from "../../services/analytics-service.js";
import {
  validateMetrics,
  sanitizeFilename,
  buildCsv,
} from "../../services/export-service.js";

const router = Router();
const analyticsService = new AnalyticsService();

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const exportSchema = z.object({
  startDate: z.string().regex(ISO_DATE_RE, "startDate must be YYYY-MM-DD"),
  endDate: z.string().regex(ISO_DATE_RE, "endDate must be YYYY-MM-DD"),
  metrics: z.array(z.string()).min(1, "At least one metric is required"),
  workspaceId: z.string().min(1),
});

router.post("/export", async (req, res) => {
  const parsed = exportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }

  const { startDate, endDate, metrics, workspaceId } = parsed.data;

  const invalidMetrics = validateMetrics(metrics);
  if (invalidMetrics.length > 0) {
    return res.status(400).json({
      error: `Invalid metrics: ${invalidMetrics.join(", ")}. Allowed: activeUsers, events, sessions, pageViews, apiCalls, errorRate.`,
    });
  }

  const result = await analyticsService.query({
    dateRange: {
      start: new Date(startDate),
      end: new Date(endDate),
    },
    metrics,
    workspaceId,
  });

  const csv = buildCsv(result, metrics);
  const filename = sanitizeFilename(startDate, endDate);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
});

export default router;
