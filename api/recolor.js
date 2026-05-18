export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imageUrl, colorHex, colorName, apiKey } = req.body;

  if (!imageUrl || !colorHex || !apiKey) {
    return res.status(400).json({ error: 'Faltando parâmetros' });
  }

  const prompt = `Change only the car body paint color to ${colorName}, hex ${colorHex}. Do not change wheels, windows, background, lights or shadows. Only repaint the exterior metal body panels. Professional automotive studio photography.`;

  try {
    const response = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          prompt,
          input_image: imageUrl,
          output_format: 'jpg',
          safety_tolerance: 5,
        }
      })
    });

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
