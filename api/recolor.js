export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imageUrl, colorHex, colorName, checkId, prompt } = req.body;
  const apiKey = process.env.REPLICATE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key nao configurada' });

  try {
    if (checkId) {
      const r = await fetch(`https://api.replicate.com/v1/predictions/${checkId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      return res.status(200).json(await r.json());
    }

    // Usa prompt customizado se enviado, senão usa padrão
    const finalPrompt = prompt || `Change only the car body paint color to ${colorName} (hex ${colorHex}). Keep wheels, windows, background and lights unchanged.`;

    const r = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: { prompt: finalPrompt, input_image: imageUrl, output_format: 'jpg', safety_tolerance: 5 } })
    });
    return res.status(200).json(await r.json());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
