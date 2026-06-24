import Stripe from "stripe";
import { sql } from "@vercel/postgres";
import { buffer } from "micro";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.client_reference_id || session.metadata?.clerk_user_id;

      if (userId) {
        await sql`
          INSERT INTO subscriptions (user_id, is_premium, payment_source, updated_at)
          VALUES (${userId}, TRUE, 'stripe', NOW())
          ON CONFLICT (user_id)
          DO UPDATE SET is_premium = TRUE, payment_source = 'stripe', updated_at = NOW();
        `;
        console.log("Premium activated for user:", userId);
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const userId = subscription.metadata?.clerk_user_id;

      if (userId) {
        await sql`
          UPDATE subscriptions SET is_premium = FALSE, updated_at = NOW()
          WHERE user_id = ${userId};
        `;
        console.log("Premium removed for user:", userId);
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
        }
