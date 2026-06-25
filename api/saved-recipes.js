import { sql } from "@vercel/postgres";
import { verifyToken } from "@clerk/backend";

async function getUserId(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;
  try {
    const verified = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    return verified.sub;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const userId = await getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Please sign in." });
  }

  if (req.method === "GET") {
    try {
      const result = await sql`
        SELECT id, recipe_data, saved_at FROM saved_recipes
        WHERE user_id = ${userId}
        ORDER BY saved_at DESC;
      `;
      return res.status(200).json({ recipes: result.rows });
    } catch (err) {
      console.error("Failed to fetch saved recipes:", err);
      return res.status(500).json({ error: "Something went wrong fetching your saved recipes." });
    }
  }

  if (req.method === "POST") {
    const { recipe } = req.body;
    if (!recipe) {
      return res.status(400).json({ error: "No recipe data provided." });
    }
    try {
      const result = await sql`
        INSERT INTO saved_recipes (user_id, recipe_data)
        VALUES (${userId}, ${JSON.stringify(recipe)})
        RETURNING id;
      `;
      return res.status(200).json({ success: true, id: result.rows[0].id });
    } catch (err) {
      console.error("Failed to save recipe:", err);
      return res.status(500).json({ error: "Something went wrong saving this recipe." });
    }
  }

  if (req.method === "DELETE") {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "No recipe id provided." });
    }
    try {
      await sql`
        DELETE FROM saved_recipes WHERE id = ${id} AND user_id = ${userId};
      `;
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("Failed to delete saved recipe:", err);
      return res.status(500).json({ error: "Something went wrong removing this recipe." });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
      }
