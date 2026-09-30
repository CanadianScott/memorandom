import { client } from './client';
import { ArtGenerationRequest, ArtStyle } from '../../types/interview';

const stylePresets: Record<ArtStyle, string> = {
  kodachrome: 'Vintage 1960s authentic Kodachrome photograph, warm saturated golden colors, gentle film grain, nostalgic family memory atmosphere',
  watercolor: 'Delicate evocative watercolor painting on textured rag paper, soft atmospheric color washes, wet-on-wet technique, impressionistic memory',
  oil_painting: 'Classical fine art oil painting, rich impasto brushwork, warm golden hour lighting, timeless museum-quality portrait of life',
  storybook: 'Warm whimsical storybook illustration, cozy gentle hand-drawn linework, nostalgic pastel palette, heartfelt keepsake chronicle'
};

export interface GenerateArtworkResponse {
  imageBase64: string;
  mimeType: string;
  imageUrl: string;
  promptUsed?: string;
  model: string;
}

export async function generateArtwork(
  request: Partial<ArtGenerationRequest> & { prompt?: string }
): Promise<GenerateArtworkResponse> {
  const isKeyAvailable =
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== "placeholder-key" &&
    process.env.GEMINI_API_KEY !== "your_gemini_api_key_here";

  const selectedStyle: ArtStyle = request.style || "kodachrome";
  const stylePrompt = stylePresets[selectedStyle] || stylePresets.kodachrome;
  const description = (request.prompt || request.storySummary || "A cherished family life story").trim();
  const fullPrompt = `${stylePrompt}: ${description}. ${request.additionalContext || ""}`.trim();

  if (isKeyAvailable) {
    try {
      // Use Google Nano Banana 2 (gemini-3.1-flash-image) for high-speed high-quality image generation
      const interaction = await client.interactions.create({
        model: "gemini-3.1-flash-image",
        input: fullPrompt,
      });

      const image = interaction.output_image;
      if (image?.data) {
        const mimeType = image.mime_type ?? "image/png";
        return {
          imageBase64: image.data,
          mimeType,
          imageUrl: `data:${mimeType};base64,${image.data}`,
          promptUsed: fullPrompt,
          model: "gemini-3.1-flash-image (Nano Banana 2)",
        };
      }
    } catch (err) {
      console.warn("Nano Banana art generation error, falling back to keepsake illustration:", err);
    }
  }

  // Graceful fallback stylized vector illustration
  const styleTitle = selectedStyle.replace("_", " ").toUpperCase();
  const summarySnippet = description.slice(0, 55);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fdfbf7"/>
        <stop offset="100%" stop-color="#f2e8dc"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#bg)"/>
    <rect x="25" y="25" width="750" height="550" rx="16" fill="none" stroke="#d4af37" stroke-width="2" stroke-dasharray="6 4" opacity="0.6"/>
    <circle cx="400" cy="220" r="90" fill="#e8d5bf" opacity="0.7"/>
    <path d="M 360 250 Q 400 170 440 250" fill="none" stroke="#8c6d46" stroke-width="4" stroke-linecap="round"/>
    <circle cx="400" cy="180" r="14" fill="#c49a6c"/>
    <text x="400" y="370" font-family="Georgia, serif" font-size="26" fill="#4a3728" text-anchor="middle" font-weight="bold">${styleTitle} ILLUSTRATION</text>
    <text x="400" y="415" font-family="Georgia, serif" font-size="18" fill="#6d533f" text-anchor="middle" font-style="italic">"${summarySnippet}..."</text>
    <text x="400" y="470" font-family="sans-serif" font-size="14" fill="#a4886e" text-anchor="middle">Memorandom Digital Keepsake Archive</text>
  </svg>`;

  const base64Svg = Buffer.from(svg).toString("base64");
  return {
    imageBase64: base64Svg,
    mimeType: "image/svg+xml",
    imageUrl: `data:image/svg+xml;base64,${base64Svg}`,
    promptUsed: fullPrompt,
    model: "Stylized Keepsake Vector",
  };
}
