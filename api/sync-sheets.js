module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SHEETS_URL = process.env.GOOGLE_SHEETS_URL;
  if (!SHEETS_URL) return res.status(500).json({ error: 'GOOGLE_SHEETS_URL not configured' });

  try {
    const response = await fetch(SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    res.status(200).json({ success: true, result: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}