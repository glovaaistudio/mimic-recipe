import { sql } from "@vercel/postgres";

// Visit this URL once in your browser after deploying to create the database table.
// e.g. https://mimic-recipe.vercel.app/api/setup-db
// You only need to run this once - after that you can ignore it.
export default async function handler(req, res) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS usage (
        user_id TEXT NOT NULL,
        month TEXT NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (user_id, month)
      );
    `;
    return res.status(200).json({ success: true, message: "Database table created successfully." });
  } catch (err) {
    console.error("Database setup error:", err);
    return res.status(500).json({ error: "Failed to set up database", details: err.message });
  }
}
