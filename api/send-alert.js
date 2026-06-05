export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { to1, to2, count, lines, timestamp, items } = req.body;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
  if (!to1) return res.status(400).json({ error: 'No email address provided' });

  const subject = `⚠️ Hazel Inventory — ${count} item${count !== 1 ? 's' : ''} below minimum stock`;

  // Build table rows from items array
  const itemRows = (items || []).map(item => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f0ebe5;font-family:'Georgia',serif;font-size:14px;color:#3d2b1f;font-weight:600;">${item.name || '—'}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f0ebe5;font-family:monospace;font-size:13px;color:#8c6e5a;text-align:center;">${item.qtySize || item.unit || '—'}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f0ebe5;font-family:monospace;font-size:15px;font-weight:800;color:#c0392b;text-align:center;">${item.stock ?? '—'}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f0ebe5;font-family:monospace;font-size:13px;color:#8c6e5a;text-align:center;">${item.minQty ?? '—'}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f0ebe5;font-family:'Georgia',serif;font-size:13px;color:#5a4a3a;">${item.supplier || '—'}</td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f7f3ef;font-family:'Georgia',serif;">
  <div style="max-width:620px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background:#5c3d2e;padding:28px 32px;text-align:center;">
      <div style="font-size:11px;letter-spacing:0.25em;color:#d4a97a;text-transform:uppercase;margin-bottom:6px;">Hazel Cafe &amp; Cakery</div>
      <div style="font-size:22px;font-weight:600;color:#ffffff;letter-spacing:0.05em;">Inventory Alert</div>
    </div>

    <!-- Alert banner -->
    <div style="background:#fff3cd;border-bottom:2px solid #f0c040;padding:14px 32px;text-align:center;">
      <span style="font-size:13px;font-weight:700;color:#856404;font-family:monospace;letter-spacing:0.04em;">
        ⚠️ &nbsp;${count} ITEM${count !== 1 ? 'S' : ''} BELOW MINIMUM STOCK
      </span>
    </div>

    <!-- Table -->
    <div style="padding:24px 32px 8px;">
      <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #f0ebe5;">
        <!-- Table header -->
        <thead>
          <tr style="background:#fdf6f0;">
            <th style="padding:10px 16px;text-align:left;font-size:9px;font-weight:700;color:#8c6e5a;letter-spacing:0.12em;text-transform:uppercase;font-family:monospace;border-bottom:2px solid #e8ddd5;">ITEM NAME</th>
            <th style="padding:10px 16px;text-align:center;font-size:9px;font-weight:700;color:#8c6e5a;letter-spacing:0.12em;text-transform:uppercase;font-family:monospace;border-bottom:2px solid #e8ddd5;">SIZE</th>
            <th style="padding:10px 16px;text-align:center;font-size:9px;font-weight:700;color:#c0392b;letter-spacing:0.12em;text-transform:uppercase;font-family:monospace;border-bottom:2px solid #e8ddd5;">CURRENT</th>
            <th style="padding:10px 16px;text-align:center;font-size:9px;font-weight:700;color:#8c6e5a;letter-spacing:0.12em;text-transform:uppercase;font-family:monospace;border-bottom:2px solid #e8ddd5;">MINIMUM</th>
            <th style="padding:10px 16px;text-align:left;font-size:9px;font-weight:700;color:#8c6e5a;letter-spacing:0.12em;text-transform:uppercase;font-family:monospace;border-bottom:2px solid #e8ddd5;">SUPPLIER</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px 28px;text-align:center;border-top:1px solid #f0ebe5;margin-top:16px;">
      <div style="font-size:11px;color:#b0a090;font-family:monospace;">Sent at ${timestamp}</div>
      <div style="font-size:10px;color:#c8b8a8;font-family:monospace;margin-top:4px;letter-spacing:0.08em;">HAZEL CAFE &amp; CAKERY — INVENTORY SYSTEM</div>
    </div>
  </div>
</body>
</html>`;

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