export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Delete Account — Mimic Recipe</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, sans-serif; background: #FBF6EC; color: #1A1A16; }
  header { background: #1F4D3A; padding: 16px 24px; }
  header a { color: #fff; text-decoration: none; font-size: 13px; opacity: 0.8; }
  .content { max-width: 680px; margin: 0 auto; padding: 40px 24px 80px; }
  h1 { font-family: 'Fraunces', serif; font-size: 32px; font-weight: 700; margin: 0 0 8px; }
  h2 { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 700; margin: 32px 0 12px; color: #1F4D3A; }
  p { font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
  ul { font-size: 15px; line-height: 1.7; margin: 0 0 16px; padding-left: 20px; }
  li { margin-bottom: 6px; }
  a { color: #E8602C; }
  .box { background: #fff; border: 1px solid #E8DFCB; border-radius: 12px; padding: 24px; margin-top: 32px; }
  .box h2 { margin-top: 0; }
  .steps { counter-reset: steps; list-style: none; padding: 0; }
  .steps li { counter-increment: steps; display: flex; gap: 14px; margin-bottom: 16px; }
  .steps li::before { content: counter(steps); background: #1F4D3A; color: #fff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
</style>
</head>
<body>
<header><a href="/">← Back to Mimic Recipe</a></header>
<div class="content">
  <h1>Delete Your Account</h1>
  <p>We're sorry to see you go. You can request deletion of your Mimic Recipe account and all associated data by following the steps below.</p>

  <div class="box">
    <h2>How to request account deletion</h2>
    <ol class="steps">
      <li>Send an email to <a href="mailto:support@mimicrecipe.com">support@mimicrecipe.com</a></li>
      <li>Use the subject line: <strong>"Account Deletion Request"</strong></li>
      <li>Include the email address associated with your Mimic Recipe account</li>
      <li>We will process your request within <strong>30 days</strong></li>
    </ol>
  </div>

  <h2>What gets deleted</h2>
  <ul>
    <li>Your account and profile information</li>
    <li>All saved recipes</li>
    <li>Your pantry items</li>
    <li>Your usage history</li>
    <li>Your subscription record</li>
  </ul>

  <h2>What happens to your subscription</h2>
  <p>If you have an active Premium subscription, please cancel it first via the <strong>Manage Subscription</strong> option in the app before requesting account deletion. This ensures you are not charged after your account is deleted.</p>

  <h2>Data retention</h2>
  <p>Some data may be retained for up to 30 days after deletion for legal and fraud prevention purposes, after which it will be permanently deleted.</p>

  <p>If you have any questions, contact us at <a href="mailto:support@mimicrecipe.com">support@mimicrecipe.com</a></p>
</div>
</body>
</html>
  `);
}
