// ARCHIVED: original server.ts (AI Studio / Gemini image + video endpoints used only by the removed "Creative Studio").
// Replaced by server/index.ts. Kept for reference only; not part of the build.
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API: High-Quality Poster & Marketing Image Generation
// Supports gemini-3-pro-image-preview with 1K, 2K, and 4K resolutions
app.post('/api/generate-image', async (req: Request, res: Response) => {
  try {
    const { prompt, imageSize = '1K', aspectRatio = '1:1' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in server environment. Please set it in Settings > Secrets.',
      });
    }

    // Try gemini-3-pro-image-preview first, then fallback to gemini-nano-banana-2.1 or gemini-3.1-flash-lite-image if needed
    let imageDataUrl: string | null = null;
    let modelUsed = 'gemini-3-pro-image-preview';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || '1:1',
            imageSize: imageSize || '1K',
          },
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          imageDataUrl = `data:${mime};base64,${part.inlineData.data}`;
          break;
        }
      }
    } catch (primaryErr: any) {
      console.warn('Primary model gemini-3-pro-image-preview failed, attempting fallback...', primaryErr?.message);
      // Fallback attempt with gemini-nano-banana-2.1
      try {
        modelUsed = 'gemini-nano-banana-2.1';
        const fallbackRes = await ai.models.generateContent({
          model: 'gemini-nano-banana-2.1',
          contents: {
            parts: [{ text: prompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio || '1:1',
              imageSize: imageSize || '1K',
            },
          },
        });

        for (const part of fallbackRes.candidates?.[0]?.content?.parts ?? []) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType || 'image/png';
            imageDataUrl = `data:${mime};base64,${part.inlineData.data}`;
            break;
          }
        }
      } catch (secErr: any) {
        throw new Error(primaryErr?.message || secErr?.message || 'Failed to generate image');
      }
    }

    if (!imageDataUrl) {
      return res.status(500).json({ error: 'No image data returned from Gemini model.' });
    }

    return res.json({
      success: true,
      imageUrl: imageDataUrl,
      model: modelUsed,
      resolution: imageSize,
      aspectRatio,
    });
  } catch (err: any) {
    console.error('Image generation error:', err);
    return res.status(500).json({
      error: err?.message || 'Internal server error generating image',
    });
  }
});

// API: Animate Image into Video using gemini-omni-1.2-flash via Interactions API
// Supports 16:9 and 9:16 aspect ratios
app.post('/api/animate-video', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/png', motionPrompt, aspectRatio = '16:9' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Base64 image data is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in server environment. Please set it in Settings > Secrets.',
      });
    }

    // Strip data URL header if present
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const validAspectRatio = aspectRatio === '9:16' ? '9:16' : '16:9';

    const interaction = await ai.interactions.create(
      {
        model: 'gemini-omni-1.2-flash',
        input: [
          {
            type: 'image',
            mime_type: mimeType,
            data: cleanBase64,
          },
          {
            type: 'text',
            text:
              motionPrompt ||
              'Animate this print graphic with smooth subtle cinematic movement, atmospheric lighting accents, and elegant motion suitable for digital signage and poster displays.',
          },
        ],
        background: false,
        store: false,
        stream: false,
        response_format: {
          type: 'video',
          aspect_ratio: validAspectRatio,
          duration: '5s',
          resolution: '720p',
        },
      },
      { timeout: 300000 }
    );

    const videoPart = interaction.output_video;
    if (videoPart && videoPart.data) {
      const mime = videoPart.mime_type || 'video/mp4';
      return res.json({
        success: true,
        videoUrl: `data:${mime};base64,${videoPart.data}`,
        aspectRatio: validAspectRatio,
      });
    } else if (videoPart && (videoPart as any).uri) {
      return res.json({
        success: true,
        videoUrl: (videoPart as any).uri,
        aspectRatio: validAspectRatio,
      });
    }

    return res.status(500).json({ error: 'No video output returned from Gemini Omni model.' });
  } catch (err: any) {
    console.error('Video animation error:', err);
    return res.status(500).json({
      error: err?.message || 'Internal server error animating video',
    });
  }
});

// Setup dev server with Vite middleware or static files in production
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PrintFlow QR SaaS Server running on http://0.0.0.0:${PORT} (env: ${process.env.NODE_ENV || 'dev'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
