import { sql } from "@vercel/postgres";
import { verifyToken } from "@clerk/backend";

export const maxDuration = 30;

const FREE_LIMIT = 3;

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let userId;
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Please sign in to generate a recipe." });
    }
    const verified = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    userId = verified.sub;
  } catch (authErr) {
    console.error("Auth verification failed:", authErr);
    return res.status(401).json({ error: "Please sign in to generate a recipe." });
  }

  let isPremium = false;
  try {
    const subResult = await sql`
      SELECT is_premium, expires_at FROM subscriptions WHERE user_id = ${userId};
    `;
    const sub = subResult.rows[0];
    if (sub && sub.is_premium) {
      isPremium = !sub.expires_at || new Date(sub.expires_at) > new Date();
    }
  } catch (subErr) {
    console.error("Premium status check failed:", subErr);
  }

  const month = currentMonthKey();
  if (!isPremium) {
    try {
      const usageResult = await sql`
        SELECT count FROM usage WHERE user_id = ${userId} AND month = ${month};
      `;
      const currentCount = usageResult.rows[0]?.count || 0;
      if (currentCount >= FREE_LIMIT) {
        return res.status(403).json({
          error: `You've used your ${FREE_LIMIT} free recipes this month. Upgrade to Premium for unlimited access.`,
          limitReached: true
        });
      }
    } catch (dbErr) {
      console.error("Usage check failed:", dbErr);
      return res.status(500).json({ error: "Something went wrong checking your usage. Please try again." });
    }
  }
const { ingredientText, imageBase64, imageMediaType, regenerate, language, pantryItems } = req.body;

  const pantryInstruction = pantryItems && pantryItems.length > 0
    ? "\n\nThe user has the following ingredients already in their pantry: " + pantryItems.join(", ") + ". For each ingredient in your recipe, add a \"have\" field set to true if the user likely has it based on their pantry list (use fuzzy matching — e.g. 'butter' matches 'unsalted butter'), or false if they need to buy it."
    : "";

  const regenerateInstruction = regenerate
    ? "\n\nIMPORTANT: The user has already seen one recipe for these ingredients and wants a DIFFERENT version. Take a distinctly different approach — different cuisine style, different cooking technique, different form factor (e.g. if you made a smoothie, make a sorbet; if you made a cake, make muffins; if you made a pasta sauce, make a soup). Do NOT simply vary the spices or swap one ingredient — the overall dish concept must be genuinely different."
    : "";

  const languageInstruction = language && language !== "English"
    ? "\n\nIMPORTANT: Write the ENTIRE recipe response in " + language + " — this includes the title, tagline, tags, ingredient names, step instructions, tip, and variations. Every field in the JSON must be in " + language + ". Do not mix languages."
    : "";

  const promptText = `You are a creative chef and recipe developer. ${
    imageBase64
      ? "The user has uploaded a photo of a food product label or ingredients list. Read the ingredients from the image and generate a recipe to recreate it at home."
      : `A user has given you the ingredients list from a food product they love and want to recreate at home.\n\nIngredients provided: ${ingredientText}\n\nGenerate a recipe to recreate this at home.`
  }${regenerateInstruction}${languageInstruction}${pantryInstruction}

You MUST include a "nutrition" field in your response with estimated values per serving for calories (kcal), protein (g), carbs (g), fat (g), and fibre (g). These are estimates based on typical ingredient quantities — make your best calculation.
IMPORTANT - this is a HOME recipe for a real person cooking in their kitchen, not a manufacturing specification:
- Scale the recipe to a sensible, realistic home serving size (e.g. a proper cake for 8 people, a normal batch of sauce, a regular-sized smoothie) - do NOT just copy tiny per-unit amounts from a nutrition label.
- Use ingredient names a home cook would recognise and buy at a supermarket (e.g. "eggs", "plain flour", "bicarbonate of soda", "vegetable oil") - NEVER use manufacturing or food-science terminology. Translate any such terms into their everyday kitchen equivalent.
- BEFORE writing each "amount" value, check it against this exact allowed list: whole numbers (1, 2, 3...), or these exact fractions only: 0.25, 0.5, 0.75 (for teaspoons/tablespoons/pinches/whole items like eggs), or any whole multiple of 5 (for grams/ml, e.g. 5, 10, 50, 100, 150, 200, 250). If your first instinct produces any other number, you MUST round it to the nearest value from this allowed list. NEVER output a number outside this list.
- This applies to EVERY ingredient without exception.
- If an ingredient appears in a trace/minor amount on a label, either substitute it with a common household equivalent or omit it.

Respond ONLY with a JSON object (no markdown, no backticks) with this exact structure:
{
  "title": "Recipe name",
  "tagline": "One-line description",
  "tags": ["tag1", "tag2"],
  "baseServings": 2,
  "ingredients": [
    { "name": "ingredient name", "amount": "number as string", "unit": "ml/g/tsp/cups/etc", "have": true }
  ],
  "steps": ["Step 1 text", "Step 2 text"],
  "tip": "One pro tip",
  "variations": "Suggestions for variations",
  "nutrition": { "calories": 320, "protein": 8, "carbs": 45, "fat": 12, "fibre": 3 },
  "imagePrompt": "A short, vivid visual description...",
}`;

  const content = imageBase64
    ? [
        { type: "image", source: { type: "base64", media_type: imageMediaType, data: imageBase64 } },
        { type: "text", text: promptText }
      ]
    : promptText;

  let recipe;
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        messages: [{ role: "user", content }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic API error:", data);
      return res.status(500).json({ error: "Failed to generate recipe" });
    }

    const raw = data.content.map(item => item.text || "").join("");
    const clean = raw.replace(/```json|```/g, "").trim();

    try {
      recipe = JSON.parse(clean);
    } catch (parseErr) {
      console.error("Failed to parse recipe JSON. Raw text was:", raw);
      return res.status(500).json({ error: "Failed to generate recipe", debugRaw: raw.slice(0, 500) });
    }
  } catch (err) {
    console.error("Server error generating recipe:", err);
    return res.status(500).json({ error: "Something went wrong generating your recipe" });
  }

  if (!isPremium) {
    try {
      await sql`
        INSERT INTO usage (user_id, month, count)
        VALUES (${userId}, ${month}, 1)
        ON CONFLICT (user_id, month)
        DO UPDATE SET count = usage.count + 1;
      `;
    } catch (incErr) {
      console.error("Failed to increment usage count:", incErr);
    }
  }

  return res.status(200).json(recipe);
      }
