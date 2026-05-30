export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageUrl, colorHex, colorName, checkId, prompt } = req.body;
  const apiKey = process.env.REPLICATE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'REPLICATE_API_KEY nao configurada' });
  }

  try {
    if (checkId) {
      const r = await fetch(`https://api.replicate.com/v1/predictions/${checkId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      });

      const data = await r.json();
      return res.status(r.status).json(data);
    }

    const finalPrompt =
      prompt ||
      `Edit the uploaded image. DO NOT generate a new vehicle. DO NOT redesign the vehicle. DO NOT modify trim level, wheels, tires, headlights, grille, mirrors, windows, body shape, badges, reflections, shadows or background. Change ONLY the exterior body paint color to ${colorName} (hex ${colorHex}). Preserve the exact same vehicle and photograph. Only the paint color must change.`;

    const r = await fetch(
      'https://api.replicate.com/v1/models/openai/gpt-image-1.5/predictions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: {
            prompt: finalPrompt,
            input_images: [imageUrl],
            quality: 'medium',
            output_format: 'jpeg',
            aspect_ratio: '3:2',
            input_fidelity: 'low'
          }
        })
      }
    );

    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
