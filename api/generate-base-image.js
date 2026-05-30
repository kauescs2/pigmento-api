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

  try {
    const {
      marca,
      modelo,
      geracao,
      ano_referencia
    } = req.body;

    const prompt = `
Create a professional automotive studio photograph.

VEHICLE:
${marca} ${modelo}
Generation: ${geracao}
Model year: ${ano_referencia}

STRICT REQUIREMENTS:
- Exact factory OEM appearance
- 100% stock vehicle
- Correct body style for this generation
- Correct headlights
- Correct grille
- Correct mirrors
- Correct wheels
- Correct proportions
- No modifications
- No tuning
- No aftermarket parts
- No stickers

BACKGROUND:
- Pure white seamless studio background
- Automotive catalog photography
- No scenery
- No road
- No buildings
- No people

CAMERA:
- Front 3/4 angle
- Entire vehicle visible
- Centered composition

LIGHTING:
- Professional studio lighting
- Clean reflections
- Manufacturer catalog style

QUALITY:
- Ultra realistic
- OEM marketing photography
- High resolution
`;

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
            output_format: 'jpeg'
          }
        })
      }
    );

    const data = await response.json();

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
