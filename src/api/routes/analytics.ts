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

export default router;
