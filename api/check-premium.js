import { sql } from "@vercel/postgres";
import { verifyToken } from "@clerk/backend";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let userId;
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ isPremium: false });
    }
    const verified = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    userId = verified.sub;
  } catch (authErr) {
    return res.status(401).json({ isPremium: false });
  }

  try {
    const subResult = await sql`
      SELECT is_premium, expires_at FROM subscriptions WHERE user_id = ${userId};
    `;
    const sub = subResult.rows[0];
    let isPremium = false;
    if (sub && sub.is_premium) {
      isPremium = !sub.expires_at || new Date(sub.expires_at) > new Date();
    }
    return res.status(200).json({ isPremium });
  } catch (err) {
    console.error("Premium status check failed:", err);
    console.log("Premium check for user:", userId, "isPremium:", isPremium, "sub:", JSON.stringify(sub));
    return res.status(200).json({ isPremium });
  }
}
