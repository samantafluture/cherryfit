import { z } from 'zod';

const barcodeResultSchema = z.object({
  barcode: z.string(),
  food_name: z.string(),
  brand: z.string().nullable(),
  serving_size: z.string(),
  calories: z.number(),
  protein_g: z.number(),
  carbs_g: z.number(),
  fat_g: z.number(),
  fiber_g: z.number().nullable(),
  sugar_g: z.number().nullable(),
  sodium_mg: z.number().nullable(),
  image_url: z.string().nullable(),
});

export type BarcodeProduct = z.infer<typeof barcodeResultSchema>;

const nutrimentSchema = z.object({
  'energy-kcal_100g': z.number().optional(),
  'energy-kcal_serving': z.number().optional(),
  proteins_100g: z.number().optional(),
  proteins_serving: z.number().optional(),
  carbohydrates_100g: z.number().optional(),
  carbohydrates_serving: z.number().optional(),
  fat_100g: z.number().optional(),
  fat_serving: z.number().optional(),
  fiber_100g: z.number().optional(),
  fiber_serving: z.number().optional(),
  sugars_100g: z.number().optional(),
  sugars_serving: z.number().optional(),
  sodium_100g: z.number().optional(),
  sodium_serving: z.number().optional(),
  salt_100g: z.number().optional(),
  salt_serving: z.number().optional(),
});

export class OpenFoodFactsService {
  private baseUrl = 'https://world.openfoodfacts.org/api/v2';

  async lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
    const url = `${this.baseUrl}/product/${encodeURIComponent(barcode)}.json`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CherryFit/1.0 (health tracking app)',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as { status: number; product?: Record<string, unknown> };

    if (data.status !== 1 || !data.product) {
      return null;
    }

    const product = data.product;
    const nutriments = nutrimentSchema.partial().parse(product['nutriments'] ?? {});

    const servingSize = (product['serving_size'] as string | undefined) ?? '100g';
    const hasServingData = nutriments['energy-kcal_serving'] != null;

    const calories = hasServingData
      ? (nutriments['energy-kcal_serving'] ?? 0)
      : (nutriments['energy-kcal_100g'] ?? 0);

    const protein = hasServingData
      ? (nutriments.proteins_serving ?? 0)
      : (nutriments.proteins_100g ?? 0);

    const carbs = hasServingData
      ? (nutriments.carbohydrates_serving ?? 0)
      : (nutriments.carbohydrates_100g ?? 0);

    const fat = hasServingData
      ? (nutriments.fat_serving ?? 0)
      : (nutriments.fat_100g ?? 0);

    const fiber = hasServingData
      ? (nutriments.fiber_serving ?? null)
      : (nutriments.fiber_100g ?? null);

    const sugars = hasServingData
      ? (nutriments.sugars_serving ?? null)
      : (nutriments.sugars_100g ?? null);

    // Convert sodium from g to mg, or from salt (salt_g * 400 ≈ sodium_mg)
    let sodiumMg: number | null = null;
    const sodiumG = hasServingData ? nutriments.sodium_serving : nutriments.sodium_100g;
    const saltG = hasServingData ? nutriments.salt_serving : nutriments.salt_100g;

    if (sodiumG != null) {
      sodiumMg = Math.round(sodiumG * 1000);
    } else if (saltG != null) {
      sodiumMg = Math.round(saltG * 400);
    }

    const foodName = (product['product_name'] as string | undefined) ?? 'Unknown Product';
    const brand = (product['brands'] as string | undefined) ?? null;
    const imageUrl = (product['image_front_small_url'] as string | undefined) ?? null;

    const result: BarcodeProduct = {
      barcode,
      food_name: brand ? `${foodName} (${brand})` : foodName,
      brand,
      serving_size: hasServingData ? servingSize : '100g',
      calories: Math.round(calories),
      protein_g: Math.round(protein * 10) / 10,
      carbs_g: Math.round(carbs * 10) / 10,
      fat_g: Math.round(fat * 10) / 10,
      fiber_g: fiber != null ? Math.round(fiber * 10) / 10 : null,
      sugar_g: sugars != null ? Math.round(sugars * 10) / 10 : null,
      sodium_mg: sodiumMg,
      image_url: imageUrl,
    };

    return barcodeResultSchema.parse(result);
  }
}
