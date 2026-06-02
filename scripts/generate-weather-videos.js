#!/usr/bin/env node

/**
 * Generate animated weather videos using Google Veo 3.1
 * Animates existing weather images with soccer players and parallax movement
 *
 * Usage: node scripts/generate-weather-videos.js
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

const INPUT_DIR = path.join(__dirname, '../public/tournament');
const OUTPUT_DIR = path.join(__dirname, '../public/tournament');

// Veo 3.1 endpoint
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const VEO_ENDPOINT = `${BASE_URL}/models/veo-3.1-generate-preview:predictLongRunning`;

// Video configs with prompts - banana-weather style + soccer action
const videoConfigs = [
  {
    inputImage: 'weather-sat.png',
    outputVideo: 'weather-sat.mp4',
    day: 'Saturday',
    prompt: `The camera moves in parallax as the elements in the image move naturally.

Animate this youth soccer tournament on a cool December Saturday morning:
- Soccer players in colorful jerseys actively playing matches on multiple fields
- Kids dribbling, passing, and shooting at goals
- Goalkeepers making saves
- Small crowds of parents in jackets watching from sidelines with folding chairs
- Coaches directing players from the touchline
- Morning mist gently swirling across the grass fields
- Wind softly moving the trees
- Clouds slowly drifting in the sky
- Steam rising from coffee cups held by spectators

Keep the scene lively with typical youth tournament energy - active but not chaotic.`
  },
  {
    inputImage: 'weather-sun.png',
    outputVideo: 'weather-sun.mp4',
    day: 'Sunday',
    prompt: `The camera moves in parallax as the elements in the image move naturally.

Animate this championship Sunday at a youth soccer tournament:
- Exciting soccer action on the main field - a championship match in progress
- Players sprinting, dribbling past defenders, taking shots on goal
- Goalkeepers diving for saves
- Large crowds of parents and families cheering enthusiastically
- Teams celebrating goals with arms raised
- Food vendor tents with people walking between them
- Colorful team flags and banners waving in the breeze
- Perfect sunny California afternoon atmosphere
- Festive championship day energy

The scene should feel celebratory and exciting - finals day atmosphere.`
  }
];

async function generateVideo(config) {
  console.log(`\nGenerating ${config.outputVideo} (${config.day})...`);

  const imagePath = path.join(INPUT_DIR, config.inputImage);

  if (!fs.existsSync(imagePath)) {
    console.error(`Input image not found: ${imagePath}`);
    return false;
  }

  // Load image as base64
  const imageData = fs.readFileSync(imagePath).toString('base64');
  const mimeType = 'image/png';

  console.log('  Submitting to Veo 3.1...');

  try {
    // Submit video generation request
    const response = await fetch(VEO_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY
      },
      body: JSON.stringify({
        instances: [{
          prompt: config.prompt,
          image: {
            bytesBase64Encoded: imageData,
            mimeType: mimeType
          }
        }],
        parameters: {
          aspectRatio: '16:9',
          negativePrompt: 'blurry, low quality, distorted, cartoon style'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  API Error: ${response.status}`, errorText);
      return false;
    }

    const operation = await response.json();
    console.log('  Operation started:', operation.name);

    // Poll for completion
    const videoUrl = await pollOperation(operation.name);

    if (!videoUrl) {
      console.error('  Failed to get video URL');
      return false;
    }

    // Download video with API key header and follow redirects
    console.log('  Downloading video...');
    const videoResponse = await fetch(videoUrl, {
      headers: {
        'x-goog-api-key': API_KEY
      },
      redirect: 'follow'
    });

    if (!videoResponse.ok) {
      console.error('  Failed to download video:', videoResponse.status);
      return false;
    }

    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    const outputPath = path.join(OUTPUT_DIR, config.outputVideo);
    fs.writeFileSync(outputPath, videoBuffer);

    console.log(`  ✓ Saved ${config.outputVideo}`);
    return true;

  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
    return false;
  }
}

async function pollOperation(operationName, maxAttempts = 60, intervalMs = 10000) {
  console.log('  Polling for completion (this may take a few minutes)...');

  const pollUrl = `${BASE_URL}/${operationName}`;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(pollUrl, {
        headers: {
          'x-goog-api-key': API_KEY
        }
      });

      if (!response.ok) {
        console.error(`  Poll error: ${response.status}`);
        continue;
      }

      const result = await response.json();

      if (result.done) {
        if (result.error) {
          console.error('  Operation failed:', result.error);
          return null;
        }

        // Extract video URL from response - correct path from curl example
        const videoUri = result.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
        if (videoUri) {
          console.log('\n  ✓ Video generation complete!');
          return videoUri;
        }

        console.error('  No video URL in response:', JSON.stringify(result, null, 2));
        return null;
      }

      // Still processing
      const progress = result.metadata?.progress || 'unknown';
      process.stdout.write(`\r  Processing... attempt ${attempt}/${maxAttempts} (progress: ${progress}%)   `);

      await new Promise(resolve => setTimeout(resolve, intervalMs));

    } catch (error) {
      console.error(`  Poll error: ${error.message}`);
    }
  }

  console.error('\n  Timeout waiting for video generation');
  return null;
}

async function main() {
  console.log('='.repeat(50));
  console.log('Tournament Weather Video Generator');
  console.log('Using Google Veo 3.1');
  console.log('='.repeat(50));
  console.log(`\nInput: ${INPUT_DIR}`);
  console.log(`Output: ${OUTPUT_DIR}`);

  let successCount = 0;

  for (const config of videoConfigs) {
    const success = await generateVideo(config);
    if (success) successCount++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Generation complete: ${successCount}/${videoConfigs.length} videos created`);
  console.log('='.repeat(50));

  if (successCount > 0) {
    console.log('\nNext: Update TournamentHero.jsx to use video backgrounds');
  }
}

main().catch(console.error);
