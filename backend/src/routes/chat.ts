/**
 * AI Chat Route — patient dietary Q&A powered by Gemini
 */
import { Router, Response } from "express";
import PatientRepo from "../db/repositories/patientRepo";
import { processChat, getChatHistory } from "../services/aiChatService";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);

// POST /api/chat — send a message and get AI reply
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

  const { reply, source } = await processChat(patient, message);
  res.json({ reply, source });
});

// GET /api/chat/history/:patientId — fetch chat history
router.get("/history/:patientId", async (req: AuthRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const history = await getChatHistory(req.params.patientId, limit);
  res.json(history);
});

export default router;
