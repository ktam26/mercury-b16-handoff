#!/usr/bin/env node

/**
 * Generate AI 3D location visualization using Google AI Studio
 * Uses Gemini 3 Pro Image (Nano Banana Pro) with reference images
 *
 * Usage: node scripts/generate-location-image.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.GOOGLE_AI_KEY;

if (!API_KEY) {
  console.error('Error: GOOGLE_AI_KEY environment variable is required');
  console.error('Please set it in your .env.local file');
  process.exit(1);
}

const OUTPUT_DIR = path.join(__dirname, '../public/tournament');
const REFERENCE_DIR = path.join(__dirname, 'reference');

// AI Studio Gemini 3 Pro Image endpoint (Nano Banana Pro)
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${API_KEY}`;

// Load reference images as base64
function loadReferenceImages() {
  const images = [];
  const satelliteImg = path.join(REFERENCE_DIR, 'mhosc-satellite-full.png');
  const streetViewImg = path.join(REFERENCE_DIR, 'mhosc-street-view.png');

  if (fs.existsSync(satelliteImg)) {
    images.push({
      inlineData: {
        mimeType: 'image/png',
        data: fs.readFileSync(satelliteImg).toString('base64')
      }
    });
    console.log('✓ Loaded satellite view reference image');
  }

  if (fs.existsSync(streetViewImg)) {
    images.push({
      inlineData: {
        mimeType: 'image/png',
        data: fs.readFileSync(streetViewImg).toString('base64')
      }
    });
    console.log('✓ Loaded street view reference image');
  }

  return images;
}

// Nano Banana Pro style prompt adapted from banana-weather
// Reference: https://github.com/ghchinoy/banana-weather/blob/main/docs/info.md
// Location: Morgan Hill Outdoor Sports Center - 16500 Condit Road, Morgan Hill, CA
const locationPrompt = `Using the reference images of Morgan Hill Outdoor Sports Center provided above, create a stylized 3D isometric miniature cartoon scene of this exact sports complex.

Present a clear, 45° top-down view of a horizontal (16:9) isometric miniature 3D cartoon scene that accurately represents the facility layout shown in the reference images:
- The 10 natural grass soccer fields arranged in rows (as shown in the satellite view)
- The 2 synthetic turf stadium fields with covered bleacher seating and light poles
- The main concession and restroom building
- The large concrete promenade walkways between fields
- The paved parking lot with LED lighting poles
- The facility surrounded by California golden rolling hills (as shown in the aerial photo)
- Scattered oak trees around the perimeter
- Distant Santa Cruz Mountains on the horizon

The scene features soft, refined textures with realistic PBR materials and gentle, lifelike lighting and shadow effects. The architectural elements showcase the modern sports facility design with clean lines and functional layout.

Use a clean, unified composition with minimalistic aesthetics and a soft, solid-colored sky background that highlights the main content. The overall visual style is fresh, soothing, and welcoming. No text or UI elements.`;

async function generateImage(referenceImages) {
  console.log('='.repeat(50));
  console.log('Tournament Location Image Generator');
  console.log('Using Google AI Studio (Gemini 3 Pro Image)');
  console.log('With Morgan Hill OSC Reference Images');
  console.log('='.repeat(50));
  console.log(`\nOutput: ${OUTPUT_DIR}`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const filename = 'location-3d.png';
  console.log(`\nGenerating ${filename}...`);

  try {
    // Build parts array with reference images first, then the prompt
    const parts = [
      ...referenceImages,
      { text: locationPrompt }
    ];

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: parts
        }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio: '16:9',
            imageSize: '2K'
          }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      return false;
    }

    const data = await response.json();

    // Look for inline image data in response
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const parts = data.candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
          const outputPath = path.join(OUTPUT_DIR, filename);
          fs.writeFileSync(outputPath, imageBuffer);
          console.log(`\n✓ Successfully saved ${filename}`);
          return true;
        }
      }
    }

    console.error('No image data in response:', JSON.stringify(data, null, 2).substring(0, 500));
    return false;
  } catch (error) {
    console.error('✗ Error generating image:', error.message);
    return false;
  }
}

async function main() {
  // Load reference images
  console.log('\nLoading reference images...');
  const referenceImages = loadReferenceImages();
  if (referenceImages.length === 0) {
    console.warn('Warning: No reference images found. Images will be generated without location reference.');
  }

  const success = await generateImage(referenceImages);

  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('Location image generation complete!');
  } else {
    console.log('Image generation failed. Check your AI Studio settings.');
  }
  console.log('='.repeat(50));
}

main().catch(console.error);
