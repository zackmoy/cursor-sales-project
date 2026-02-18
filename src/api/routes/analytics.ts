import { Router } from "express";
import { z } from "zod";
import { AnalyticsService } from "../../services/analytics-service.js";
import {
  buildCsvFromResult,
  buildExportFilename,
  isAllowedMetric,
} from "../../services/export-service.js";

const router = Router();
const analyticsService = new AnalyticsService();

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

const querySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  metrics: z.array(z.string()),
  workspaceId: z.string(),
});

const exportSchema = z
  .object({
    startDate: z.string().regex(isoDateRegex, "startDate must be ISO date YYYY-MM-DD"),
    endDate: z.string().regex(isoDateRegex, "endDate must be ISO date YYYY-MM-DD"),
    metrics: z.array(z.string()).min(1, "metrics must have at least one item"),
    workspaceId: z.string().min(1, "workspaceId is required"),
  })
  .refine((d) => d.startDate <= d.endDate, {
    message: "startDate must be before or equal to endDate",
    path: ["startDate"],
  })
  .refine((d) => d.metrics.every((m) => isAllowedMetric(m)), {
    message: "metrics must only contain allowed metric names",
    path: ["metrics"],
  });

router.post("/query", async (req, res) => {
  const parsed = querySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }
  const result = await analyticsService.query({
    dateRange: {
      start: new Date(parsed.data.startDate),
      end: new Date(parsed.data.endDate),
    },
    metrics: parsed.data.metrics,
    workspaceId: parsed.data.workspaceId,
  });
  res.json(result);
});

router.post("/export", async (req, res) => {
  const parsed = exportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }
  const { startDate, endDate, metrics, workspaceId } = parsed.data;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const result = await analyticsService.query({
    dateRange: { start, end },
    metrics,
    workspaceId,
  });
  const csv = buildCsvFromResult(result, metrics);
  const filename = buildExportFilename(start, end);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
});

export default router;
