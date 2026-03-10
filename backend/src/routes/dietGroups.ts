import { Router } from "express";
import DietGroupRepo from "../db/repositories/dietGroupRepo";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  const filter: { isActive?: boolean; ward?: string } = { isActive: true };
  if (req.query.ward) filter.ward = req.query.ward as string;
  const groups = await DietGroupRepo.find(filter);
  res.json(groups);
});

router.get("/:id", async (req, res) => {
  const group = await DietGroupRepo.findById(req.params.id);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }
  res.json(group);
});

router.post("/", async (req, res) => {
  const group = await DietGroupRepo.create(req.body);
  res.status(201).json(group);
});

router.put("/:id", async (req, res) => {
  const group = await DietGroupRepo.update(req.params.id, req.body);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }
  res.json(group);
});

router.delete("/:id", async (req, res) => {
  await DietGroupRepo.deactivate(req.params.id);
  res.json({ message: "Group deactivated" });
});

export default router;
