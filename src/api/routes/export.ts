import { Router } from "express";
import { z } from "zod";
import {
  ExportService,
  ExportValidationError,
} from "../../services/export-service.js";

const router = Router();
const exportService = new ExportService();

const exportSchema = z.object({
  startDate: z.string().min(1, "startDate is required"),
  endDate: z.string().min(1, "endDate is required"),
  metrics: z.array(z.string()).min(1, "At least one metric is required"),
  workspaceId: z.string().min(1, "workspaceId is required"),
});

router.post("/export", async (req, res) => {
  const parsed = exportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Invalid request body", details: parsed.error.issues },
    });
  }

  try {
    const csv = await exportService.generateCsv(parsed.data);

    // Sanitize user-supplied dates in filename (Gate 4: input-driven output safety)
    const safeName = (s: string) => s.replace(/[^a-zA-Z0-9._-]/g, "");
    const filename = `analytics-export-${safeName(parsed.data.startDate)}-to-${safeName(parsed.data.endDate)}.csv`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    if (err instanceof ExportValidationError) {
      return res.status(400).json({
        error: { code: err.code, message: err.message },
      });
    }
    console.error("Export failed:", err);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Export failed unexpectedly." },
    });
  }
});

export default router;
