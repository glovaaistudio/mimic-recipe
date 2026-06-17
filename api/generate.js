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
    const recipe = JSON.parse(clean);

    // Generate an illustration of the dish using the image prompt.
    // If this fails for any reason, we still return the recipe without an image
    // rather than failing the whole request.
    try {
      const imgResponse = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: `Editorial food photography style illustration, warm natural light, shallow depth of field: ${recipe.imagePrompt || recipe.title}. No text or watermarks in the image.`,
          n: 1,
          size: "1024x1024"
        })
      });

      if (imgResponse.ok) {
        const imgData = await imgResponse.json();
        recipe.imageUrl = imgData.data?.[0]?.url || null;
      }
    } catch (imgErr) {
      console.error("Image generation failed:", imgErr);
    }

    return res.status(200).json(recipe);
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Something went wrong generating your recipe" });
  }
}
