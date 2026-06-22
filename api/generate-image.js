export const maxDuration = 30;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imagePrompt, title } = req.body;

  try {
    const imgResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: `Editorial food photography style illustration, warm natural light, shallow depth of field: ${imagePrompt || title}. No text or watermarks in the image.`,
        n: 1,
        size: "1024x1024"
      })
    });

    if (imgResponse.ok) {
      const imgData = await imgResponse.json();
      const imageUrl = imgData.data?.[0]?.url || null;
      return res.status(200).json({ imageUrl });
    } else {
      const errBody = await imgResponse.text();
      console.error("Image generation failed. Status:", imgResponse.status, "Body:", errBody);
      return res.status(200).json({ imageUrl: null });
    }
  } catch (imgErr) {
    console.error("Image generation request threw:", imgErr);
    return res.status(200).json({ imageUrl: null });
  }
}
