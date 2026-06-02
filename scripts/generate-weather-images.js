#!/usr/bin/env node

/**
 * Generate AI weather visualization images using Google AI Studio
 * Uses Gemini 2.0 Flash with native image generation
 *
 * Usage: node scripts/generate-weather-images.js
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

// Weather prompts for each day - Nano Banana Pro style adapted from banana-weather
// Reference: https://github.com/ghchinoy/banana-weather/blob/main/docs/info.md
const weatherPrompts = [
  {
    filename: 'weather-sat.png',
    day: 'Saturday',
    prompt: `Using the reference images of Morgan Hill Outdoor Sports Center provided above, create a stylized 3D isometric miniature cartoon scene of this exact sports complex on a cool December Saturday morning.

Present a clear, 45° top-down view of a horizontal (16:9) isometric miniature 3D cartoon scene that accurately represents the facility layout shown in the reference images:
- The 10 natural grass soccer fields arranged in rows (as shown in the satellite view)
- The 2 synthetic turf stadium fields with covered bleachers and light poles
- The concrete promenade walkways between fields
- The concession/restroom building
- The large parking lot
- The California golden hills and mountains visible in the background

The scene features soft, refined textures with realistic PBR materials and gentle, lifelike lighting and shadow effects. Weather elements are creatively integrated into the sports complex.

Morning conditions: Partly cloudy, 52°F, light morning mist hovering over grass fields, golden sunrise light casting long shadows, spectators in jackets gathering with folding chairs and coffee.

Use a clean, unified composition with minimalistic aesthetics. The overall visual style is fresh and soothing. No text or UI elements.`
  },
  {
    filename: 'weather-sun.png',
    day: 'Sunday',
    prompt: `Using the reference images of Morgan Hill Outdoor Sports Center provided above, create a stylized 3D isometric miniature cartoon scene of this exact sports complex on a bright December Sunday afternoon - championship finals day.

Present a clear, 45° top-down view of a horizontal (16:9) isometric miniature 3D cartoon scene that accurately represents the facility layout shown in the reference images:
- The 10 natural grass soccer fields arranged in rows (as shown in the satellite view)
- The 2 synthetic turf stadium fields with covered bleachers and light poles
- The concrete promenade walkways between fields
- The concession/restroom building
- The large parking lot full of cars
- The California golden hills and mountains visible in the background

The scene features soft, refined textures with realistic PBR materials and gentle, lifelike lighting and shadow effects. Weather elements are creatively integrated into the sports complex.

Afternoon conditions: Clear sunny skies, 58°F, crisp afternoon light with defined shadows, crowds gathered around main field for finals, celebratory atmosphere with team tents and food vendors.

Use a clean, unified composition with minimalistic aesthetics. The overall visual style is vibrant and celebratory. No text or UI elements.`
  }
];

async function generateImage(prompt, filename, referenceImages) {
  console.log(`\nGenerating ${filename}...`);

  try {
    // Build parts array with reference images first, then the prompt
    const parts = [
      ...referenceImages,
      { text: prompt }
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
      console.error(`API Error for ${filename}:`, response.status, errorText);
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
          console.log(`✓ Successfully saved ${filename}`);
          return true;
        }
      }
    }

    console.error(`No image data in response for ${filename}:`, JSON.stringify(data, null, 2).substring(0, 500));
    return false;
  } catch (error) {
    console.error(`✗ Error generating ${filename}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('Tournament Weather Image Generator');
  console.log('Using Google AI Studio (Gemini 3 Pro Image)');
  console.log('With Morgan Hill OSC Reference Images');
  console.log('='.repeat(50));
  console.log(`\nOutput: ${OUTPUT_DIR}`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Load reference images
  console.log('\nLoading reference images...');
  const referenceImages = loadReferenceImages();
  if (referenceImages.length === 0) {
    console.warn('Warning: No reference images found. Images will be generated without location reference.');
  }

  let successCount = 0;

  for (const config of weatherPrompts) {
    const success = await generateImage(config.prompt, config.filename, referenceImages);
    if (success) successCount++;

    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Generation complete: ${successCount}/${weatherPrompts.length} images created`);
  console.log('='.repeat(50));

  if (successCount < weatherPrompts.length) {
    console.log('\nNote: Some images failed. You may need to check your AI Studio settings.');
  }
}

main().catch(console.error);
