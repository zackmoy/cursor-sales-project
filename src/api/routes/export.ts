import { Router } from "express";
import { z } from "zod";
import { AnalyticsService } from "../../services/analytics-service.js";
import {
  buildCsv,
  getAllowedMetrics,
  sanitizeExportFilename,
} from "../../services/export-service.js";

const router = Router();
const analyticsService = new AnalyticsService();

const exportSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId is required"),
  from: z.string().min(1, "from date is required"),
  to: z.string().min(1, "to date is required"),
  metrics: z.array(z.string()).min(1, "at least one metric is required"),
});

router.post("/export", async (req, res) => {
  const parsed = exportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: parsed.error.flatten(),
    });
  }

  const { workspaceId, from, to, metrics } = parsed.data;

  const allowed = new Set(getAllowedMetrics());
  const invalidMetrics = metrics.filter((m) => !allowed.has(m));
  if (invalidMetrics.length > 0) {
    return res.status(400).json({
      error: "Invalid or disallowed metrics",
      invalidMetrics,
      allowed: getAllowedMetrics(),
    });
  }

  let filename: string;
  try {
    filename = sanitizeExportFilename(workspaceId, from, to);
  } catch (e) {
    return res.status(400).json({
      error: e instanceof Error ? e.message : "Invalid date range for filename",
    });
  }

  const start = new Date(from);
  const end = new Date(to);
  if (start.getTime() > end.getTime()) {
    return res.status(400).json({
      error: "from date must be before or equal to to date",
    });
  }

  try {
    const result = await analyticsService.query({
      workspaceId,
      dateRange: { start, end },
      metrics,
    });
    const csv = buildCsv(result, metrics);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (e) {
    console.error("Export failed:", e);
    res.status(500).json({
      error: e instanceof Error ? e.message : "Export failed",
    });
  }
});

export default router;
