/**
 * NutriSync — AI Dietary Chat Service
 *
 * Uses Grok (xAI) to answer patient dietary questions with yes/no + rationale.
 * When the answer is "no", suggests replacements based on patient restrictions.
 */

import { v4 as uuidv4 } from "uuid";
import { getDB } from "../config/d1";
import type { IPatient } from "../db/repositories/patientRepo";

// xAI Grok (used when GROK_API_KEY has credits)
const GROK_API_URL = "https://api.x.ai/v1/chat/completions";
const GROK_MODEL = "grok-2-1212";

export interface ChatMessage {
  id: string;
  patientId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

// ── Store messages in DB ─────────────────────────────────────────────────────
async function saveMessage(msg: ChatMessage): Promise<void> {
  const db = getDB();
  await db.execute(
    `INSERT INTO chat_messages (id, patient_id, role, content, created_at) VALUES (?,?,?,?,?)`,
    [msg.id, msg.patientId, msg.role, msg.content, msg.createdAt]
  );
}

export async function getChatHistory(patientId: string, limit = 20): Promise<ChatMessage[]> {
  const db = getDB();
  const rows = await db.query(
    `SELECT * FROM chat_messages WHERE patient_id = ? ORDER BY created_at DESC LIMIT ?`,
    [patientId, limit]
  );
  return rows.reverse().map((r) => ({
    id: r.id as string,
    patientId: r.patient_id as string,
    role: r.role as "user" | "assistant",
    content: r.content as string,
    createdAt: r.created_at as string,
  }));
}

// ── Build context prompt from patient data ───────────────────────────────────
function buildSystemPrompt(patient: IPatient): string {
  return `You are a friendly and knowledgeable clinical dietary assistant for a hospital. You are chatting directly with a patient or their doctor. Respond in a warm, conversational tone — like a helpful human dietitian would, not like a rule engine.

PATIENT PROFILE:
- Name: ${patient.name}
- Age: ${patient.age}, Gender: ${patient.gender}
- Diagnosis: ${patient.diagnosis.join(", ") || "none"}
- Allergies: ${patient.allergies.join(", ") || "none"}
- Dietary Restrictions: ${patient.dietaryRestrictions.join(", ") || "none"}
- Diet Type: ${patient.currentDietType}
- Nutrition Targets: ${patient.nutritionTargets.calories} kcal/day, Protein ${patient.nutritionTargets.protein}g, Carbs ${patient.nutritionTargets.carbs}g, Fat ${patient.nutritionTargets.fat}g
- Sodium limit: ${patient.nutritionTargets.sodium}mg, Potassium limit: ${patient.nutritionTargets.potassium}mg

GUIDELINES:
- Respond naturally and conversationally, like a caring dietitian
- For food questions, clearly say whether it's safe or not and explain why in simple terms
- If something isn't safe, suggest 1-2 tasty alternatives the patient can enjoy
- Factor in ALL allergies, restrictions, diagnosis, and diet type
- For diabetic patients, mention blood sugar impact when relevant
- For cardiac/renal patients, mention sodium/potassium concerns when relevant
- Keep answers concise — 2-4 sentences, friendly and clear
- If the question isn't food-related, gently steer back to dietary topics
- Never use clinical jargon; speak plainly as if talking to the patient directly`;
}

// ── Fallback deterministic response ──────────────────────────────────────────
function buildFallbackResponse(question: string, patient: IPatient): string {
  const q = question.toLowerCase();
  const allergies = patient.allergies.map((a) => a.toLowerCase());
  const restrictions = patient.dietaryRestrictions.map((r) => r.toLowerCase());
  const dietType = patient.currentDietType.toLowerCase();

  // Check if asking about a specific food
  const foodKeywords = q.match(/can i (?:eat|have|drink|consume)\s+(.+?)(?:\?|$)/i);
  const food = foodKeywords?.[1]?.trim().toLowerCase() ?? "";

  if (food) {
    // Check allergies
    for (const allergy of allergies) {
      if (food.includes(allergy) || allergy.includes(food)) {
        return `**NO** — ${food} is not safe for you because you have a ${allergy} allergy. Try replacing it with a safe alternative like rice cakes, oatmeal, or fresh fruits that are not in your allergy list.`;
      }
    }

    // Check restrictions
    for (const restriction of restrictions) {
      const clean = restriction.replace("no_", "").replace("low_", "");
      if (food.includes(clean) || clean.includes(food)) {
        return `**NO** — ${food} conflicts with your dietary restriction (${restriction}). Consider alternatives like steamed vegetables, lean protein, or whole grains.`;
      }
    }

    // Diet type checks
    const highSugarFoods = ["candy", "chocolate", "cake", "ice cream", "soda", "juice", "sugar", "cookie", "pastry", "donut"];
    const highSodiumFoods = ["chips", "fries", "bacon", "sausage", "pickle", "canned", "instant noodle", "pizza"];
    const highPotassiumFoods = ["banana", "potato", "tomato", "orange", "avocado", "spinach"];

    if (dietType === "diabetic" && highSugarFoods.some((f) => food.includes(f))) {
      return `**NO** — ${food} is high in sugar and not recommended for your diabetic diet. Instead, try sugar-free alternatives, fresh berries, or a small portion of dark chocolate (70%+ cocoa).`;
    }
    if ((dietType === "cardiac" || dietType === "low_sodium") && highSodiumFoods.some((f) => food.includes(f))) {
      return `**NO** — ${food} is high in sodium, which is restricted on your ${dietType} diet. Try unsalted nuts, fresh vegetables, or herbs-seasoned lean protein instead.`;
    }
    if ((dietType === "renal" || dietType === "low_potassium") && highPotassiumFoods.some((f) => food.includes(f))) {
      return `**NO** — ${food} is high in potassium, which needs to be limited for your ${dietType} diet. Consider apples, berries, or white rice as safer options.`;
    }

    return `**YES** — Based on your current dietary profile (${dietType} diet), ${food} appears to be safe for you. Enjoy it in moderate portions that fit within your daily calorie target of ${patient.nutritionTargets.calories} kcal.`;
  }

  return `I can help you with dietary questions! Try asking something like "Can I eat bananas?" or "Can I have chocolate?" and I'll check it against your medical profile and dietary restrictions.`;
}

// ── Main chat function ───────────────────────────────────────────────────────
export async function processChat(
  patient: IPatient,
  userMessage: string
): Promise<{ reply: string; source: "ai" | "fallback" }> {
  const now = new Date().toISOString();

  // Save user message
  const userMsg: ChatMessage = {
    id: uuidv4(),
    patientId: patient._id,
    role: "user",
    content: userMessage,
    createdAt: now,
  };
  await saveMessage(userMsg);

  let reply: string;
  let source: "ai" | "fallback";

  const systemPrompt = buildSystemPrompt(patient);

  // Get recent history for context (last 10 messages)
  const history = await getChatHistory(patient._id, 10);

  // Grok for chatbot
  if (process.env.GROK_API_KEY) {
    try {
      const historyMessages = history.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      }));

      const response = await fetch(GROK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROK_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROK_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            ...historyMessages,
            { role: "user", content: userMessage },
          ],
          max_tokens: 512,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
      }

      const json = await response.json() as { choices: Array<{ message: { content: string } }> };
      reply = json.choices[0]?.message?.content?.trim() ?? buildFallbackResponse(userMessage, patient);
      source = "ai";
    } catch (grokErr) {
      console.warn("⚠️ Grok chat failed, using fallback:", (grokErr as Error).message);
      reply = buildFallbackResponse(userMessage, patient);
      source = "fallback";
    }
  } else {
    reply = buildFallbackResponse(userMessage, patient);
    source = "fallback";
  }

  // Save assistant message
  const assistantMsg: ChatMessage = {
    id: uuidv4(),
    patientId: patient._id,
    role: "assistant",
    content: reply,
    createdAt: new Date().toISOString(),
  };
  await saveMessage(assistantMsg);

  return { reply, source };
}
