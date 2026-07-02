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

  // GET - fetch all pantry items for this user
  if (req.method === "GET") {
    try {
      const result = await sql`
        SELECT id, item_name, added_at FROM pantry_items
        WHERE user_id = ${userId}
        ORDER BY item_name ASC;
      `;
      return res.status(200).json({ items: result.rows });
    } catch (err) {
      console.error("Failed to fetch pantry items:", err);
      return res.status(500).json({ error: "Something went wrong fetching your pantry." });
    }
  }

  // POST - add a new pantry item
  if (req.method === "POST") {
    const { item_name } = req.body;
    if (!item_name || !item_name.trim()) {
      return res.status(400).json({ error: "No item name provided." });
    }
    try {
      const result = await sql`
        INSERT INTO pantry_items (user_id, item_name)
        VALUES (${userId}, ${item_name.trim().toLowerCase()})
        ON CONFLICT DO NOTHING
        RETURNING id, item_name;
      `;
      return res.status(200).json({ success: true, item: result.rows[0] });
    } catch (err) {
      console.error("Failed to add pantry item:", err);
      return res.status(500).json({ error: "Something went wrong adding that item." });
    }
  }

  // DELETE - remove a pantry item
  if (req.method === "DELETE") {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "No item id provided." });
    }
    try {
      await sql`
        DELETE FROM pantry_items WHERE id = ${id} AND user_id = ${userId};
      `;
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("Failed to delete pantry item:", err);
      return res.status(500).json({ error: "Something went wrong removing that item." });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
