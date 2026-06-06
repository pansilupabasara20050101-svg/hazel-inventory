export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { image } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `You are a GRN (Goods Received Note) data extractor for a Sri Lankan cafe. 
                Look at this invoice/bill image and extract the following data in JSON format only, no other text:
                {
                  "supplier": "supplier name if visible",
                  "invoiceNo": "invoice or receipt number",
                  "invoiceAmount": total amount as number only,
                  "items": [
                    {
                      "name": "item name exactly as on bill including size e.g. Milk Powder 1kg",
                      "qty": quantity as number,
                      "price": price per unit as number,
                      "unit": "unit if visible e.g. kg, L, Nos"
                    }
                  ]
                }
                If you cannot read a field clearly, omit it. Return ONLY valid JSON, no markdown.`
              },
              { inline_data: { mime_type: 'image/jpeg', data: image } }
            ]
          }],
          generationConfig: { temperature: 0.1 }
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
    
    // Clean and parse JSON
    const clean = text.replace(/```json|```/g, '').trim();
    let parsed = {};
    try { parsed = JSON.parse(clean); } catch { parsed = {}; }
    
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
