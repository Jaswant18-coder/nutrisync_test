/**
 * Suggestions Route — patient→kitchen suggestion system
 */
import { Router, Response } from "express";
import SuggestionRepo from "../db/repositories/suggestionRepo";
import PatientRepo from "../db/repositories/patientRepo";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);

// GET /api/suggestions — all suggestions (kitchen staff) or patient's own
router.get("/", async (req: AuthRequest, res: Response) => {
  const role = req.user!.role;
  const patientId = req.query.patientId as string | undefined;
  const status = req.query.status as string | undefined;

  if (role === "patient") {
    // Patients can only see their own suggestions.
    // req.user!.patientId is the patient record ID (from the patients table),
    // NOT req.user!.id which is the user account ID.
    const patId = req.user!.patientId;
    if (!patId) { res.json([]); return; }
    const suggestions = await SuggestionRepo.find({ patientId: patId, status });
    res.json(suggestions);
    return;
  }

  // Kitchen staff and doctors see all (optionally filtered)
  const suggestions = await SuggestionRepo.find({ patientId, status });
  res.json(suggestions);
});

// GET /api/suggestions/count — count of new suggestions (for kitchen badge)
router.get("/count", async (_req: AuthRequest, res: Response) => {
  const count = await SuggestionRepo.countByStatus("new");
  res.json({ count });
});

// POST /api/suggestions — patient submits a suggestion
router.post("/", async (req: AuthRequest, res: Response) => {
  const { patientId, message } = req.body;

  if (!patientId || !message) {
    res.status(400).json({ error: "patientId and message are required" });
    return;
  }

  const patient = await PatientRepo.findById(patientId);
  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  const suggestion = await SuggestionRepo.create({
    patientId: patient._id,
    patientName: patient.name,
    message,
  });

  res.status(201).json(suggestion);
});

// PATCH /api/suggestions/:id — kitchen staff updates status/responds
router.patch("/:id", async (req: AuthRequest, res: Response) => {
  const { status, response } = req.body;

  const suggestion = await SuggestionRepo.updateStatus(
    req.params.id,
    status,
    response,
    req.user!.id
  );

  if (!suggestion) {
    res.status(404).json({ error: "Suggestion not found" });
    return;
  }

  res.json(suggestion);
});

export default router;
