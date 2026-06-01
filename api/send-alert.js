export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { to1, to2, count, lines, timestamp } = req.body;
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
  if (!to1) return res.status(400).json({ error: 'No email address provided' });

  const subject = ⚠️ Hazel Inventory — ${count} item${count !== 1 ? 's' : ''} below minimum stock;
  const html = 
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #8c5c38; letter-spacing: 0.15em; font-size: 24px; margin: 0;">HAZEL</h1>
        <p style="color: #9c7b68; font-size: 12px; letter-spacing: 0.2em; margin: 4px 0 0;">CAFE &amp; CAKERY — INVENTORY ALERT</p>
      </div>
      <div style="background: #fff8f3; border: 1px solid #e2cfc0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <p style="color: #b03a30; font-weight: bold; font-size: 16px; margin: 0 0 12px;">⚠️ ${count} item${count !== 1 ? 's' : ''} below minimum stock</p>
        <pre style="font-family: monospace; font-size: 13px; color: #2e1e12; white-space: pre-wrap; margin: 0;">${lines}</pre>
      </div>
      <p style="color: #9c7b68; font-size: 12px; text-align: center; margin: 0;">Sent at ${timestamp} · Hazel Cafe &amp; Cakery Inventory System</p>
    </div>
  ;

  const recipients = [to1, to2].filter(Boolean);

  try {
    const results = await Promise.all(recipients.map(to =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': Bearer ${apiKey}, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'Hazel Inventory <onboarding@resend.dev>', to, subject, html }),
      }).then(r => r.json())
    ));
    res.status(200).json({ success: true, results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}