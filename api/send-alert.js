export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { to1, to2, count, lines, timestamp } = req.body;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'No API key' });
  if (!to1) return res.status(400).json({ error: 'No email' });
  const subject = 'Hazel Inventory - ' + count + ' items below minimum stock';
  const html = '<p>' + count + ' items below minimum stock</p><pre>' + lines + '</pre><p>Sent at ' + timestamp + '</p>';
  const recipients = [to1, to2].filter(Boolean);
  try {
    const results = await Promise.all(recipients.map(to =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'Hazel Inventory <onboarding@resend.dev>', to, subject, html }),
      }).then(r => r.json())
    ));
    res.status(200).json({ success: true, results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}