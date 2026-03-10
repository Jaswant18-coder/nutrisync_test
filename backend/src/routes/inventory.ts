import { Router, Response } from "express";
import IngredientRepo from "../db/repositories/ingredientRepo";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/", async (_req, res) => {
  const items = await IngredientRepo.find();
  res.json(items);
});

router.get("/low-stock", async (_req, res) => {
  const items = await IngredientRepo.findLowStock();
  res.json(items);
});

router.get("/:id", async (req, res) => {
  const item = await IngredientRepo.findById(req.params.id);
  if (!item) { res.status(404).json({ error: "Ingredient not found" }); return; }
  res.json(item);
});

router.post("/", async (req: AuthRequest, res: Response) => {
  const item = await IngredientRepo.create(req.body);
  res.status(201).json(item);
});

router.put("/:id", async (req, res) => {
  const item = await IngredientRepo.update(req.params.id, req.body);
  if (!item) { res.status(404).json({ error: "Ingredient not found" }); return; }
  res.json(item);
});

// PATCH /api/inventory/:id/stock — update stock quantity
router.patch("/:id/stock", async (req, res) => {
  const { adjustment, stockQty } = req.body;
  let newQty: number;
  if (stockQty !== undefined) {
    newQty = stockQty;
  } else if (adjustment !== undefined) {
    const ing = await IngredientRepo.findById(req.params.id);
    if (!ing) { res.status(404).json({ error: "Not found" }); return; }
    newQty = Math.max(0, ing.stockQty + adjustment);
  } else {
    res.status(400).json({ error: "Provide stockQty or adjustment" }); return;
  }
  const item = await IngredientRepo.update(req.params.id, {
    stockQty: newQty,
    isAvailable: newQty > 0,
  });
  res.json(item);
});

router.delete("/:id", async (req, res) => {
  await IngredientRepo.deleteById(req.params.id);
  res.json({ message: "Deleted" });
});

export default router;
