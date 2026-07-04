import Stripe from "stripe";
import { sql } from "@vercel/postgres";
import { verifyToken } from "@clerk/backend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let userId;
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Please sign in." });
    }
    const verified = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    userId = verified.sub;
  } catch (authErr) {
    console.error("Auth verification failed:", authErr);
    return res.status(401).json({ error: "Please sign in." });
  }

  try {
    const subResult = await sql`
      SELECT stripe_customer_id FROM subscriptions WHERE user_id = ${userId};
    `;
    const customerId = subResult.rows[0]?.stripe_customer_id;

    if (!customerId) {
      return res.status(400).json({ error: "No active subscription found for this account." });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: "https://mimicrecipe.com/"
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Failed to create billing portal session:", err);
    return res.status(500).json({ error: "Something went wrong opening your subscription settings." });
  }
}
