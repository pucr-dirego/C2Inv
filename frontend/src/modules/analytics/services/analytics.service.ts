import type {
  AnalyticsCountryCode,
  AnalyticsGeographyData,
} from "../types/analytics.types";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3002";

export class AnalyticsApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string | undefined;

  constructor(
    message: string,
    statusCode: number,
    code?: string,
  ) {
    super(message);

    this.name = "AnalyticsApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export async function getAnalyticsGeography(
  country: AnalyticsCountryCode,
  signal?: AbortSignal,
): Promise<AnalyticsGeographyData> {
  const params = new URLSearchParams({
    country,
  });

  const response = await fetch(
    `${API_BASE}/api/analytics/geography?${params.toString()}`,
    {
      credentials: "include",
      signal,
    },
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new AnalyticsApiError(
      payload?.message ??
        "No fue posible consultar la analítica geográfica.",
      response.status,
      payload?.code,
    );
  }

  return payload.data as AnalyticsGeographyData;
}
