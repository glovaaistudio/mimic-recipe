import Stripe from "stripe";
import { verifyToken } from "@clerk/backend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  monthly: "price_1TpQqhFjNq5xfrbjZwkDCHsU",
  yearly: "price_1TpQqgFjNq5xfrbj4a2J25kc"
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let userId;
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Please sign in to upgrade." });
    }
    const verified = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    userId = verified.sub;
  } catch (authErr) {
    console.error("Auth verification failed:", authErr);
    return res.status(401).json({ error: "Please sign in to upgrade." });
  }

  const { plan } = req.body;
  const priceId = PRICE_IDS[plan];

  if (!priceId) {
    return res.status(400).json({ error: "Invalid plan selected." });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `https://mimicrecipe.com/?upgraded=true`,
      cancel_url: `https://mimicrecipe.com/`,
      client_reference_id: userId,
      metadata: { clerk_user_id: userId },
      subscription_data: {
        metadata: { clerk_user_id: userId }
      }
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout session creation failed:", err);
    return res.status(500).json({ error: "Something went wrong starting checkout. Please try again." });
  }
}
