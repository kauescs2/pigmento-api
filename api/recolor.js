export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imageUrl, colorHex, colorName, apiKey, checkId } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'API key obrigatoria' });

  try {
    if (checkId) {
      const r = await fetch(`https://api.replicate.com/v1/predictions/${checkId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const d = await r.json();
      return res.status(200).json(d);
    }

    const prompt = `Repaint this car body with ${colorName} color (${colorHex}). Keep wheels, windows, background, lights unchanged. Only repaint exterior metal panels.`;
    const r = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: { prompt, input_image: imageUrl, output_format: 'jpg', safety_tolerance: 5 } })
    });
    const d = await r.json();
    return res.status(200).json(d);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
