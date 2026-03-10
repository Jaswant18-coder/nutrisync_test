import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import UserRepo from "../db/repositories/userRepo";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  const { name, email, password, role, patientId } = req.body;
  const existing = await UserRepo.findOne({ email });
  if (existing) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }
  const user = await UserRepo.create({ name, email, password, role: role ?? "doctor", patientId });
  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name, patientId: user.patientId },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "7d" }
  );
  res.status(201).json({ token, user: { id: user.id, name, email, role: user.role, patientId: user.patientId } });
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await UserRepo.findOne({ email });
  if (!user || !(await UserRepo.comparePassword(user, password))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name, patientId: user.patientId },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "7d" }
  );
  res.json({ token, user: { id: user.id, name: user.name, email, role: user.role, patientId: user.patientId } });
});

export default router;
