interface FitbitTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: string;
}

interface FitbitFoodLogInput {
  foodName: string;
  calories: number;
  mealTypeId: number; // 1=Breakfast, 2=Morning Snack, 3=Lunch, 4=Afternoon Snack, 5=Dinner, 7=Anytime
  date: string; // yyyy-MM-dd
  unitId?: number;
  amount?: number;
}

interface FitbitProfile {
  user: {
    encodedId: string;
    displayName: string;
    avatar: string;
  };
}

export class FitbitService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'nutrition profile',
      state,
    });

    return `https://www.fitbit.com/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<FitbitTokens> {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Fitbit token exchange failed: ${error}`);
    }

    return response.json() as Promise<FitbitTokens>;
  }

  async refreshTokens(refreshToken: string): Promise<FitbitTokens> {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Fitbit token refresh failed: ${error}`);
    }

    return response.json() as Promise<FitbitTokens>;
  }

  async getProfile(accessToken: string): Promise<FitbitProfile> {
    const response = await fetch('https://api.fitbit.com/1/user/-/profile.json', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to get Fitbit profile');
    }

    return response.json() as Promise<FitbitProfile>;
  }

  async logFood(accessToken: string, input: FitbitFoodLogInput): Promise<void> {
    const params = new URLSearchParams({
      foodName: input.foodName,
      mealTypeId: String(input.mealTypeId),
      unitId: String(input.unitId ?? 304), // 304 = calories
      amount: String(input.amount ?? input.calories),
      date: input.date,
    });

    const response = await fetch(
      `https://api.fitbit.com/1/user/-/foods/log.json?${params.toString()}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Fitbit food log failed: ${error}`);
    }
  }

  static mealTypeToFitbitId(mealType: string): number {
    switch (mealType) {
      case 'breakfast':
        return 1;
      case 'lunch':
        return 3;
      case 'dinner':
        return 5;
      case 'snack':
        return 7;
      default:
        return 7;
    }
  }
}
