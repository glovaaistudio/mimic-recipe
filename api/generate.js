export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
        max_tokens: 1000,
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

    let recipe;
    try {
      recipe = JSON.parse(clean);
    } catch (parseErr) {
      console.error("Failed to parse recipe JSON. Raw text was:", raw);
      return res.status(500).json({ error: "Failed to generate recipe", debugRaw: raw.slice(0, 500) });
    }
    data.imageUrl
        ? e("img", { src: data.imageUrl, alt: data.title, style: styles.resultImg })
        : e("div", { style: { width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px", textAlign: "center" } },
            e("div", { style: { fontSize: "44px", marginBottom: "10px" } }, "\uD83C\uDF7D\uFE0F"),
            data.imageDebug ? e("div", { style: { fontSize: "11px", color: "#A4391A", fontFamily: "monospace", wordBreak: "break-word" } }, data.imageDebug) : null
          )
