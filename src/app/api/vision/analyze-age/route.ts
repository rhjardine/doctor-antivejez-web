import { NextResponse } from 'next/server';
import { RekognitionClient, DetectFacesCommand } from '@aws-sdk/client-rekognition';

// Initialize the Rekognition client
// The SDK automatically picks up AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION
// from the environment variables.
const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided in the request body.' },
        { status: 400 }
      );
    }

    // Determine the format of the image (Base64 string)
    // Extract base64 content if it comes with data:image/...;base64, prefix
    let base64Data = image;
    if (image.startsWith('data:image')) {
      base64Data = image.split(',')[1];
    }

    const imageBytes = Buffer.from(base64Data, 'base64');

    const command = new DetectFacesCommand({
      Image: {
        Bytes: imageBytes,
      },
      Attributes: ['ALL'],
    });

    const response = await rekognition.send(command);

    if (!response.FaceDetails || response.FaceDetails.length === 0) {
      return NextResponse.json(
        { error: 'No se detectó ningún rostro en la imagen' },
        { status: 400 }
      );
    }

    const firstFace = response.FaceDetails[0];
    const ageRange = firstFace.AgeRange;
    const confidence = firstFace.Confidence;

    if (!ageRange || ageRange.Low === undefined || ageRange.High === undefined) {
      return NextResponse.json(
        { error: 'No se pudo estimar la edad del rostro detectado' },
        { status: 400 }
      );
    }

    // Promedio aritmético para obtener un número entero final
    const estimatedAge = Math.round((ageRange.Low + ageRange.High) / 2);

    return NextResponse.json({
      success: true,
      estimatedAge,
      confidence,
    });
  } catch (error: any) {
    console.error('[Vision API] Error processing image:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar la imagen.', details: error.message },
      { status: 500 }
    );
  }
}
