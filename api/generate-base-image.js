export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.REPLICATE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'REPLICATE_API_KEY não configurada'
    });
  }

  const {
    marca,
    modelo,
    geracao,
    ano_referencia
  } = req.body;

  if (!marca || !modelo || !ano_referencia) {
    return res.status(400).json({
      error: 'marca, modelo e ano_referencia são obrigatórios'
    });
  }

  const prompt = `
Create a professional OEM automotive studio photograph.

VEHICLE:
${marca} ${modelo}
Generation: ${geracao || 'Factory Generation'}
Reference Year: ${ano_referencia}

STRICT REQUIREMENTS:

- Exact factory appearance
- 100% stock vehicle
- Correct body style for this generation
- Correct headlights
- Correct grille
- Correct mirrors
- Correct wheels
- Correct proportions
- OEM manufacturer appearance

CAMERA:
- Front 3/4 angle
- Vehicle facing slightly left
- Entire vehicle visible
- Automotive catalog style

BACKGROUND:
- Pure white seamless studio background
- No scenery
- No road
- No buildings
- No people

LIGHTING:
- Professional studio lighting
- Soft reflections
- Neutral lighting
- Commercial photography style

IMPORTANT:
- No text
- No watermark
- No logo
- No color labels
- No paint codes
- No license plate text
- No banners
- No annotations

QUALITY:
- Ultra realistic
- OEM catalog photography
- Manufacturer marketing photo
- High resolution
- Clean paint finish
`;

  try {
    const response = await fetch(
      'https://api.replicate.com/v1/models/openai/gpt-image-1.5/predictions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: {
            prompt,
            aspect_ratio: '3:2',
            output_format: 'jpg',
            quality: 'medium'
          }
        })
      }
    );

    const prediction = await response.json();

    return res.status(200).json(prediction);

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
