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
    const { marca, modelo, geracao, ano_referencia } = req.body;

    if (!marca || !modelo || !ano_referencia) {
      return res.status(400).json({
        error: 'marca, modelo e ano_referencia são obrigatórios'
      });
    }

    const prompt = `
Create a professional automotive studio photograph.

VEHICLE:
${marca} ${modelo}
Generation: ${geracao || 'factory generation'}
Model year: ${ano_referencia}

STRICT REQUIREMENTS:
- Exact factory OEM appearance
- 100% stock vehicle
- Correct body style for this generation and model year
- Correct headlights
- Correct grille
- Correct mirrors
- Correct factory wheels
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
- Vehicle facing slightly left
- Entire vehicle visible
- Centered composition

LIGHTING:
- Professional studio lighting
- Clean reflections
- Manufacturer catalog style

IMPORTANT:
- Do not add text
- Do not add labels
- Do not add watermarks
- Do not add color names
- Do not add OEM codes
- Do not add license plate text

QUALITY:
- Ultra realistic
- OEM marketing photography
- High resolution
`;

    const createResponse = await fetch(
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

    let prediction = await createResponse.json();

    if (!createResponse.ok) {
      return res.status(createResponse.status).json(prediction);
    }

    let attempts = 0;
    const maxAttempts = 45;

    while (
      prediction.status !== 'succeeded' &&
      prediction.status !== 'failed' &&
      prediction.status !== 'canceled' &&
      attempts < maxAttempts
    ) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const pollResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${apiKey}`
          }
        }
      );

      prediction = await pollResponse.json();
      attempts++;
    }

    if (prediction.status !== 'succeeded') {
      return res.status(500).json({
        error: 'Falha ou timeout ao gerar imagem base',
        status: prediction.status,
        prediction_id: prediction.id,
        detail: prediction.error || null
      });
    }

    const output = Array.isArray(prediction.output)
      ? prediction.output[0]
      : prediction.output;

    if (!output) {
      return res.status(500).json({
        error: 'Imagem gerada sem URL de saída',
        prediction_id: prediction.id,
        raw_output: prediction.output
      });
    }

    return res.status(200).json({
      status: 'succeeded',
      foto_url: output,
      prediction_id: prediction.id
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
