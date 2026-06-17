export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { image } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  if (!image) return res.status(400).json({ error: 'No image provided' });

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
                // FIX: improved prompt — explicitly handles size/weight in item names,
                // does NOT require supplier (may not be on bill), clearer JSON schema
                text: `You are a GRN (Goods Received Note) data extractor for a Sri Lankan cafe.
Analyse this invoice or bill image carefully.

IMPORTANT RULES:
- Include the size/weight/volume in the item name exactly as printed (e.g. "Milk Powder 1kg", "Milo 400g", "Ambewela Milk 1L")
- Supplier name may NOT appear on the bill — if not visible, omit it entirely
- Convert sizes: if you see 1kg treat as 1000g, if 1L treat as 1000ml
- Price should be per unit (price ÷ quantity)
- Return ONLY valid JSON, no markdown, no explanation text

Return this exact JSON structure:
{
  "supplier": "supplier name only if clearly visible on bill, otherwise omit",
  "invoiceNo": "invoice or receipt number as string",
  "invoiceAmount": total_amount_as_number,
  "items": [
    {
      "name": "full item name including size e.g. Milo 400g, Milk Powder 1kg",
      "qty": quantity_as_number,
      "price": price_per_unit_as_number,
      "unit": "unit if visible e.g. kg, L, Nos, g, ml"
    }
  ]
}

If a field is not clearly visible, omit it from the JSON entirely.`
              },
              { inline_data: { mime_type: 'image/jpeg', data: image } }
            ]
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: 'Gemini API error: ' + errText });
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // FIX: robust JSON extraction — handles markdown fences, extra text, nested code blocks
    let parsed = {};
    try {
      // Try 1: direct parse (Gemini sometimes returns clean JSON)
      parsed = JSON.parse(rawText.trim());
    } catch {
      try {
        // Try 2: extract from markdown code fence (```json ... ``` or ``` ... ```)
        const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (fenceMatch) {
          parsed = JSON.parse(fenceMatch[1].trim());
        } else {
          // Try 3: find first { ... } block in the text
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (innerErr) {
        // All parse attempts failed — return empty so frontend falls back gracefully
        console.error('scan-grn: JSON parse failed:', innerErr.message, '| raw:', rawText.slice(0, 200));
        return res.status(200).json({});
      }
    }

    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}