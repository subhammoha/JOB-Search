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

export interface EnrichmentResult {
  h1b: H1BResult;
  consultancy: ConsultancyResult | null;
}

export type EnrichmentMap = Record<string, EnrichmentResult>;
