import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

const labelResultSchema = z.object({
  food_name: z.string(),
  serving_size: z.string(),
  calories: z.number(),
  protein_g: z.number(),
  carbs_g: z.number(),
  fat_g: z.number(),
  fiber_g: z.number().nullable(),
  sugar_g: z.number().nullable(),
  sodium_mg: z.number().nullable(),
});

export type LabelScanResult = z.infer<typeof labelResultSchema>;

export class GeminiService {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-2.5-flash') {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async scanNutritionLabel(base64Image: string, mediaType: string = 'image/jpeg'): Promise<LabelScanResult> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: [
        {
          inlineData: {
            mimeType: mediaType,
            data: base64Image,
          },
        },
        {
          text: `Extract all nutrition information from this food label image.
Return ONLY valid JSON (no markdown, no backticks, no explanation):
{
  "food_name": "string - the product name if visible, otherwise describe the food",
  "serving_size": "string - the serving size as written on the label",
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "fiber_g": number or null if not visible,
  "sugar_g": number or null if not visible,
  "sodium_mg": number or null if not visible
}
If a value is not visible on the label, use null.
All numeric values should be per single serving.`,
        },
      ],
    });

    const text = response.text;
    if (!text) {
      throw new Error('No text response from Gemini');
    }

    const parsed: unknown = JSON.parse(text);
    return labelResultSchema.parse(parsed);
  }
}
