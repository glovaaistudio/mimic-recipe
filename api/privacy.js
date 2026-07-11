import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Privacy Policy — Mimic Recipe</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, sans-serif; background: #FBF6EC; color: #1A1A16; }
  header { background: #1F4D3A; padding: 16px 24px; }
  header a { color: #fff; text-decoration: none; font-size: 13px; opacity: 0.8; }
  .content { max-width: 680px; margin: 0 auto; padding: 40px 24px 80px; }
  h1 { font-family: 'Fraunces', serif; font-size: 32px; font-weight: 700; margin: 0 0 8px; }
  .updated { font-size: 13px; color: #6B6358; margin-bottom: 32px; }
  h2 { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 700; margin: 32px 0 12px; color: #1F4D3A; }
  p { font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
  ul { font-size: 15px; line-height: 1.7; margin: 0 0 16px; padding-left: 20px; }
  li { margin-bottom: 6px; }
  a { color: #E8602C; }
  .contact-box { background: #fff; border: 1px solid #E8DFCB; border-radius: 12px; padding: 20px 24px; margin-top: 32px; }
  .contact-box p { margin: 0; }
</style>
</head>
<body>
<header><a href="/">← Back to Mimic Recipe</a></header>
<div class="content">
  <h1>Privacy Policy</h1>
  <p class="updated">Last updated: July 2026</p>
  <p>Mimic Recipe ("we", "us", or "our") is operated by Glova Studio. This privacy policy explains how we collect, use, and protect your personal information when you use our app and website at mimicrecipe.com.</p>
  <h2>Information we collect</h2>
  <ul>
    <li><strong>Account information</strong> — your name and email address when you sign up</li>
    <li><strong>Usage data</strong> — the number of recipe decodes you perform each month</li>
    <li><strong>Saved recipes</strong> — recipes you choose to save to your account</li>
    <li><strong>Pantry items</strong> — ingredients you add to your My Pantry list</li>
    <li><strong>Payment information</strong> — handled entirely by Stripe. We do not store your card details.</li>
  </ul>
  <h2>How we use your information</h2>
  <ul>
    <li>To provide and improve the Mimic Recipe service</li>
    <li>To manage your account and subscription</li>
    <li>To enforce free tier usage limits</li>
    <li>To save your recipes and pantry items for future access</li>
  </ul>
  <h2>Third party services</h2>
  <ul>
    <li><strong>Clerk</strong> — authentication (<a href="https://clerk.com/privacy">clerk.com/privacy</a>)</li>
    <li><strong>Stripe</strong> — payment processing (<a href="https://stripe.com/privacy">stripe.com/privacy</a>)</li>
    <li><strong>Anthropic</strong> — AI recipe generation (<a href="https://anthropic.com/privacy">anthropic.com/privacy</a>)</li>
    <li><strong>OpenAI</strong> — AI dish images (<a href="https://openai.com/privacy">openai.com/privacy</a>)</li>
    <li><strong>Vercel</strong> — hosting (<a href="https://vercel.com/legal/privacy-policy">vercel.com/legal/privacy-policy</a>)</li>
    <li><strong>Neon</strong> — database (<a href="https://neon.tech/privacy-policy">neon.tech/privacy-policy</a>)</li>
  </ul>
  <h2>Data retention</h2>
  <p>We retain your account data for as long as your account is active. If you delete your account, your personal data will be removed within 30 days.</p>
  <h2>Your rights</h2>
  <ul>
    <li>Access the personal data we hold about you</li>
    <li>Request correction of inaccurate data</li>
    <li>Request deletion of your data</li>
    <li>Cancel your subscription at any time via the Manage Subscription option in the app</li>
  </ul>
  <h2>Cookies</h2>
  <p>Mimic Recipe uses essential cookies and local storage to keep you signed in. We do not use advertising or tracking cookies.</p>
  <h2>Children's privacy</h2>
  <p>Mimic Recipe is not directed at children under the age of 13.</p>
  <h2>Changes to this policy</h2>
  <p>We may update this privacy policy from time to time and will notify you of significant changes.</p>
  <div class="contact-box">
    <p><strong>Contact us</strong><br>Questions? Email us at <a href="mailto:support@mimicrecipe.com">support@mimicrecipe.com</a></p>
  </div>
</div>
</body>
</html>
  `);
}
