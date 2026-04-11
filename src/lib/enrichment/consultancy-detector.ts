import { ConsultancyResult } from '@/types/enrich';
import { KNOWN_STAFFING_FIRMS, STAFFING_NAME_PATTERNS, STAFFING_DESCRIPTION_PHRASES } from '@/lib/constants';

function normalizeForLookup(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(inc|llc|corp|ltd|co|incorporated|limited|plc|lp|na|llp)\b\.?/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function detectConsultancy(company: string, description?: string): ConsultancyResult | null {
  const normalized = normalizeForLookup(company);

  // Signal 1: Known firm blocklist
  if (KNOWN_STAFFING_FIRMS.has(normalized) || KNOWN_STAFFING_FIRMS.has(company.toLowerCase().trim())) {
    return {
      isConsultancy: true,
      confidence: 'high',
      reason: 'Known staffing/consulting firm',
    };
  }

  // Signal 2: Company name heuristics
  for (const pattern of STAFFING_NAME_PATTERNS) {
    if (pattern.test(company)) {
      return {
        isConsultancy: true,
        confidence: 'medium',
        reason: 'Company name suggests staffing or consulting',
      };
    }
  }

  // Signal 3: Job description phrases
  if (description) {
    const descLower = description.toLowerCase();
    for (const phrase of STAFFING_DESCRIPTION_PHRASES) {
      if (descLower.includes(phrase)) {
        return {
          isConsultancy: true,
          confidence: 'low',
          reason: 'Job description suggests placement role',
        };
      }
    }
  }

  return null;
}
