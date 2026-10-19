export type AnalyticsCountryCode = "MX" | "CO";

export interface AnalyticsBreakdownItem {
  label: string;
  value: number;
}

export interface AnalyticsBranch {
  id: string;
  code: string;
  country: AnalyticsCountryCode;
  name: string;
  city: string;
  region: string;
  coordinates: [number, number];
  equipment: number;
  active: number;
  operational: number;
  attention: number;
  offline: number;
  lastSyncLabel: string;
  typeDistribution: AnalyticsBreakdownItem[];
  conditionDistribution: AnalyticsBreakdownItem[];
  trend: number[];
}

export interface AnalyticsGeographyData {
  country: AnalyticsCountryCode;
  branches: AnalyticsBranch[];
}
