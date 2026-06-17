// FIX: converted from CommonJS (module.exports) to ESM (export default)
// FIX: now reads 'instructions' field from request for enhanced AI matching
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { image, items, instructions } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'No API key' });
  if (!image) return res.status(400).json({ error: 'No image provided' });

  // Build prompt — use custom instructions if provided, otherwise use default
  const prompt = instructions
    ? `You are an inventory item identifier for a Sri Lankan cafe.\n${instructions}\n\nItem list:\n${items}\n\nReply with ONLY the item code (e.g. F101). If nothing matches, reply NONE.`
    : `Look at this image and identify which inventory item it matches from this list:\n${items}\n\nAnalyse the brand name, product name, and packaging size/weight (e.g. 1kg, 400g, 1L).\nReply with ONLY the item code (e.g. F101). If nothing matches, reply NONE.`;

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: 'image/jpeg', data: image } }
            ]
          }],
          generationConfig: { temperature: 0.1 }
        })
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'Gemini API error: ' + err });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'NONE';
    res.status(200).json({ result: text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}