/**
 * Downloads H-1B Employer Data Hub files from USCIS and builds
 * a compact JSON lookup table at src/data/h1b-sponsors.json
 *
 * Run: pnpm run update-h1b
 *
 * Data source: https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub
 * The CSV files are public domain (US government works).
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { createReadStream } from 'fs';

const OUTPUT_PATH = path.join(process.cwd(), 'src/data/h1b-sponsors.json');

// USCIS H-1B employer data hub CSV download URLs (updated periodically by USCIS)
// Format: Employer Name, Initial Approvals, Initial Denials, Continuing Approvals, Continuing Denials, NAICS, Tax ID, State, City, ZIP
const DATA_URLS = [
  'https://www.uscis.gov/sites/default/files/document/data/h1b_datahubexport-2024.csv',
  'https://www.uscis.gov/sites/default/files/document/data/h1b_datahubexport-2023.csv',
];

interface H1BEntry {
  count: number;
  lastYear: number;
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location!;
        file.close();
        fs.unlinkSync(dest);
        downloadFile(redirectUrl, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function parseCSV(filePath: string, year: number, lookup: Map<string, H1BEntry>): Promise<void> {
  return new Promise((resolve, reject) => {
    const stream = createReadStream(filePath, { encoding: 'utf8' });
    let buffer = '';
    let isFirstLine = true;

    stream.on('data', (chunk: string | Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (isFirstLine) { isFirstLine = false; continue; }
        const parts = line.split(',');
        if (parts.length < 2) continue;

        const employerRaw = parts[0].replace(/^"|"$/g, '').trim();
        const initialApprovals = parseInt(parts[1].replace(/^"|"$/g, '').trim() || '0', 10);

        if (!employerRaw || isNaN(initialApprovals) || initialApprovals === 0) continue;

        const key = normalizeKey(employerRaw);
        const existing = lookup.get(key);
        if (!existing || year > existing.lastYear) {
          lookup.set(key, { count: (existing?.count ?? 0) + initialApprovals, lastYear: year });
        }
      }
    });

    stream.on('end', () => resolve());
    stream.on('error', reject);
  });
}

function normalizeKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(inc|llc|corp|ltd|co|incorporated|limited|plc|lp|na|llp|pllc|pa)\b\.?/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const dataDir = path.join(process.cwd(), 'src/data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const lookup = new Map<string, H1BEntry>();
  let downloadedAny = false;

  for (const url of DATA_URLS) {
    const year = parseInt(url.match(/(\d{4})/)?.[1] ?? '2024', 10);
    const tmpFile = path.join(dataDir, `h1b-${year}.csv`);

    console.log(`Downloading ${url}...`);
    try {
      await downloadFile(url, tmpFile);
      console.log(`Parsing ${year} data...`);
      await parseCSV(tmpFile, year, lookup);
      fs.unlinkSync(tmpFile);
      downloadedAny = true;
    } catch (err) {
      console.warn(`Warning: Could not download ${year} data: ${(err as Error).message}`);
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  }

  if (!downloadedAny) {
    console.error('Failed to download any H1B data. Creating empty fallback file.');
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify({}, null, 2));
    process.exit(1);
  }

  console.log(`Building lookup table from ${lookup.size} unique employers...`);

  const output: Record<string, H1BEntry> = {};
  for (const [key, value] of lookup.entries()) {
    output[key] = value;
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output));
  console.log(`✓ Wrote ${Object.keys(output).length} employer records to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
