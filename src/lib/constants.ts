// Applicant count thresholds
export const HIGH_APPLICANT_THRESHOLD = 200;
export const MODERATE_APPLICANT_THRESHOLD = 100;

// Known staffing / consultancy firms (normalized lowercase)
export const KNOWN_STAFFING_FIRMS = new Set([
  // Indian IT giants
  'infosys', 'infosys limited', 'infosys bpo',
  'wipro', 'wipro limited', 'wipro technologies',
  'tcs', 'tata consultancy services', 'tata consultancy',
  'hcl', 'hcl technologies', 'hcl tech',
  'tech mahindra', 'tech mahindra limited',
  'mphasis', 'hexaware', 'hexaware technologies',
  'mindtree', 'lt infotech', 'larsen toubro infotech',
  'niit technologies', 'niit tech',
  'cognizant', 'cognizant technology solutions',
  'syntel',
  'igate', 'igate corporation',
  'mastech', 'mastech holdings', 'mastech digital',
  'collabera',
  'cyient',
  'unison', 'unison consulting',
  'zensar', 'zensar technologies',
  'persistent systems',
  'mphasis limited',
  'sonata software',
  // Global consulting / body-shops
  'accenture', 'accenture plc',
  'capgemini',
  'cgi', 'cgi group',
  'epam', 'epam systems',
  'globant',
  'softserve',
  'luxoft',
  'sapient', 'sapient corporation',
  // Global staffing agencies
  'robert half', 'robert half international',
  'kforce', 'kforce inc',
  'modis', 'modis inc',
  'apex systems',
  'teksystems',
  'randstad', 'randstad usa', 'randstad north america',
  'adecco', 'adecco group',
  'manpowergroup', 'manpower',
  'experis',
  'volt', 'volt information sciences',
  'staffmark',
  'spherion',
  'kelly services',
  'insight global',
  'aerotek',
  'cybercoders',
  'creative circle',
  'match it',
  'strategic staffing solutions',
  'genesis10',
  'softpath system',
  'hcl global systems',
  'datamatics', 'datamatics global services',
  'diverse lynx',
  'tek leaders',
  'idexcel',
  'cyient',
  'inforeliance',
  'itg communications',
  'resource informatics group',
  'info way solutions',
  'coda global',
  'ispace inc',
  'beacon hill staffing',
  'the judge group',
  'staffing solutions enterprises',
  'net2source',
  'rishav infotech',
  'siri infotech',
  'innovative it solution',
  'ustech solutions',
  'triton consulting',
  'smart it frame',
]);

// Heuristic regex patterns for consultancy name detection
export const STAFFING_NAME_PATTERNS: RegExp[] = [
  /\bstaffing\b/i,
  /\brecruiting\b/i,
  /\brecruitment\b/i,
  /\btalent\s+(group|solutions|partners|bridge|pool)\b/i,
  /\b(it|tech|technology)\s+(consulting|consultancy|services|solutions)\b/i,
  /\boutsourc/i,
  /\bmanaged\s+services\b/i,
  /\bstaff\s+aug/i,
  /\bprofessional\s+services\b/i,
  /\bworkforce\s+solutions\b/i,
  /\bsystems?\s+integrat/i,
  /\bconsulting\s+(group|firm|services|solutions|inc|llc)\b/i,
  /\b(global|tech|it)\s+(staffing|workforce)\b/i,
];

// Heuristic phrases in job descriptions that suggest a placement/body-shop role
export const STAFFING_DESCRIPTION_PHRASES = [
  'our client is looking',
  'our client has an opening',
  'our client requires',
  'placed at client site',
  'client site',
  'w2 or c2c',
  'w2/c2c',
  'corp to corp',
  'corp-to-corp',
  'c2c only',
  '100% remote consultant',
  'our client, a fortune',
  'working at a client',
  'for our client',
];

// Enabled sources via env (comma-separated), default to all if not set
export function getEnabledSources(): string[] {
  const env = process.env.ENABLED_SOURCES;
  if (!env) return ['arbeitnow', 'remotive', 'adzuna', 'themuse', 'jsearch'];
  return env.split(',').map(s => s.trim().toLowerCase());
}
