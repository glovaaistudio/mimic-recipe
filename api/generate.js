import { sql } from "@vercel/postgres";
import { verifyToken } from "@clerk/backend";

export const maxDuration = 60;
const FREE_LIMIT = 3;

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // --- 1. Verify the user is signed in ---
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

  // --- 2. Check usage limit (free tier = 3 per month) ---
  const month = currentMonthKey();
  try {
    const usageResult = await sql`
      SELECT count FROM usage WHERE user_id = ${userId} AND month = ${month};
    `;
    const currentCount = usageResult.rows[0]?.count || 0;

    // NOTE: premium-tier bypass will be added once Stripe is wired up.
    // For now everyone is on the free tier limit.
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

  // --- 3. Generate the recipe (same as before) ---
  const { ingredientText, imageBase64, imageMediaType } = req.body;

  const promptText = `You are a creative chef and recipe developer. ${
    imageBase64
      ? "The user has uploaded a photo of a food product label or ingredients list. Read the ingredients from the image and generate a recipe to recreate it at home."
      : `A user has given you the ingredients list from a food product they love and want to recreate at home.\n\nIngredients provided: ${ingredientText}\n\nGenerate a recipe to recreate this at home.`
  } Respond ONLY with a JSON object (no markdown, no backticks) with this exact structure:
{
  "title": "Recipe name",
  "tagline": "One-line description",
  "tags": ["tag1", "tag2"],
  "baseServings": 2,
  "ingredients": [
    { "name": "ingredient name", "amount": "number as string", "unit": "ml/g/tsp/cups/etc" }
  ],
  "steps": ["Step 1 text", "Step 2 text"],
  "tip": "One pro tip",
  "variations": "Suggestions for variations",
  "imagePrompt": "A short, vivid visual description of the finished dish for an illustrator, focused on appearance, colours, plating/glassware, and lighting. No text in the image."
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

  // --- 4. Generate the dish image (same as before) ---
  try {
    const imgResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: `Editorial food photography style illustration, warm natural light, shallow depth of field: ${recipe.imagePrompt || recipe.title}. No text or watermarks in the image.`,
        n: 1,
        size: "1024x1024"
      })
    });

    if (imgResponse.ok) {
      const imgData = await imgResponse.json();
      recipe.imageUrl = imgData.data?.[0]?.url || null;
    } else {
      const errBody = await imgResponse.text();
      console.error("Image generation failed. Status:", imgResponse.status, "Body:", errBody);
    }
  } catch (imgErr) {
    console.error("Image generation request threw:", imgErr);
  }

  // --- 5. Increment usage count now that generation succeeded ---
  try {
    await sql`
      INSERT INTO usage (user_id, month, count)
      VALUES (${userId}, ${month}, 1)
      ON CONFLICT (user_id, month)
      DO UPDATE SET count = usage.count + 1;
    `;
  } catch (incErr) {
    // Don't fail the whole request if this fails - the user already has their recipe.
    console.error("Failed to increment usage count:", incErr);
  }

  return res.status(200).json(recipe);
}
