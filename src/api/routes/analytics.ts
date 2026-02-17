import { Router } from "express";
import { z } from "zod";
import { AnalyticsService } from "../../services/analytics-service.js";

const router = Router();
const analyticsService = new AnalyticsService();

const querySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  metrics: z.array(z.string()),
  workspaceId: z.string(),
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
  const parsed = querySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    const csv = await analyticsService.exportToCsv({
      dateRange: {
        start: new Date(parsed.data.startDate),
        end: new Date(parsed.data.endDate),
      },
      metrics: parsed.data.metrics,
      workspaceId: parsed.data.workspaceId,
    });

    const filename = `analytics-export-${parsed.data.endDate}.csv`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error("Export failed:", error);
    res.status(500).json({ error: "Failed to generate export" });
  }
});

export default router;
