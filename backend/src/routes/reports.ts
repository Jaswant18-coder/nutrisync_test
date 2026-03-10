import { Router } from "express";
import { generateWeeklyReport, getWardSummary, generateSummaryReport } from "../services/reportService";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);

// GET /api/reports/weekly/:patientId?from=&to=
router.get("/weekly/:patientId", async (req, res) => {
  const { from, to } = req.query as { from?: string; to?: string };
  const toDate = to ? new Date(to) : new Date();
  const fromDate = from
    ? new Date(from)
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const report = await generateWeeklyReport(req.params.patientId, fromDate, toDate);
  if (!report) { res.status(404).json({ error: "Patient not found" }); return; }
  res.json(report);
});

// GET /api/reports/ward-summary?ward=xxx
router.get("/ward-summary", async (req, res) => {
  const ward = req.query.ward as string | undefined;
  const summary = await getWardSummary(ward);
  res.json(summary);
});

// GET /api/reports/summary?days=14
router.get("/summary", async (req, res) => {
  const days = parseInt((req.query.days as string) || "14");
  const summaries = await generateSummaryReport(isNaN(days) ? 14 : days);
  res.json(summaries);
});

export default router;
