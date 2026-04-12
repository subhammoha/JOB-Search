export interface H1BResult {
  sponsors: boolean | null; // null = unknown
  filingCount?: number;
  lastYear?: number;
}

export interface ConsultancyResult {
  isConsultancy: boolean;
  confidence: 'high' | 'medium' | 'low';
  reason?: string;
}

export interface LevelsResult {
  rating: number;       // e.g. 4.2 out of 5
  reviewCount?: number;
  avgComp?: string;     // e.g. "$245k"
  url: string;          // link to Levels.fyi page
}

export interface EnrichmentResult {
  h1b: H1BResult;
  consultancy: ConsultancyResult | null;
  levels: LevelsResult | null;
}

export type EnrichmentMap = Record<string, EnrichmentResult>;
