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

const foodPhotoItemSchema = z.object({
  food_name: z.string(),
  estimated_portion: z.string(),
  confidence: z.enum(['low', 'medium', 'high']),
  calories: z.number(),
  protein_g: z.number(),
  carbs_g: z.number(),
  fat_g: z.number(),
  fiber_g: z.number().nullable(),
  sugar_g: z.number().nullable(),
  sodium_mg: z.number().nullable(),
});

const foodPhotoResultSchema = z.object({
  items: z.array(foodPhotoItemSchema),
});

export type FoodPhotoItem = z.infer<typeof foodPhotoItemSchema>;
export type FoodPhotoResult = z.infer<typeof foodPhotoResultSchema>;

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    const withoutStart = trimmed.replace(/^```(?:json)?\s*\n?/, '');
    return withoutStart.replace(/\n?```\s*$/, '');
  }
  return trimmed;
}

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

    const parsed: unknown = JSON.parse(stripMarkdownFences(text));
    return labelResultSchema.parse(parsed);
  }

  async analyzeFoodPhoto(base64Image: string, mediaType: string = 'image/jpeg'): Promise<FoodPhotoResult> {
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
          text: `Identify all food items visible in this photo. For each item, estimate the portion size and nutritional content.

Return ONLY valid JSON (no markdown, no backticks, no explanation):
{
  "items": [
    {
      "food_name": "string - name of the food item",
      "estimated_portion": "string - estimated portion size (e.g. '1 cup', '200g', '1 medium slice')",
      "confidence": "low" | "medium" | "high",
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number,
      "fiber_g": number or null,
      "sugar_g": number or null,
      "sodium_mg": number or null
    }
  ]
}

Guidelines:
- List EVERY distinct food item you can see (e.g. rice, chicken, salad separately)
- Estimate portions based on visual cues (plate size, utensils, known food proportions)
- Set confidence to "high" for clearly identifiable foods with standard portions, "medium" for foods you can identify but portions are uncertain, "low" for foods you're guessing at
- All nutritional values should be for the estimated portion size
- Use null for fiber, sugar, sodium only if you truly cannot estimate them
- If you cannot identify any food items, return {"items": []}`,
        },
      ],
    });

    const text = response.text;
    if (!text) {
      throw new Error('No text response from Gemini');
    }

    const parsed: unknown = JSON.parse(stripMarkdownFences(text));
    return foodPhotoResultSchema.parse(parsed);
  }
}
