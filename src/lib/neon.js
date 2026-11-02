import 'server-only';
import { neon } from '@neondatabase/serverless';

// Lazy HTTP client: never query on import or expose the URL to browser code.
let client;

export function isNeonConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function databaseClient() {
  if (client) return client;
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error('Database is not configured');

  // Do not expose the URL (including parser/driver errors) in logs or responses.
  try {
    const url = new URL(connectionString);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) ||
        !url.hostname || !url.username || url.pathname.length < 2 ||
        !['require', 'verify-full'].includes(url.searchParams.get('sslmode'))) {
      throw new Error();
    }
    client = neon(connectionString, { fetchOptions: { cache: 'no-store' } });
    return client;
  } catch {
    throw new Error('Database configuration is invalid; check server environment');
  }
}

// Use only as a tagged template: queryDatabase`SELECT ... WHERE id = ${id}`.
// Identifiers must be hardcoded/allowlisted; values are bound by the driver.
export async function queryDatabase(strings, ...values) {
  if (!Array.isArray(strings) || !Array.isArray(strings.raw)) {
    throw new TypeError('Database queries must use a tagged template');
  }
  const sql = databaseClient();
  try {
    return await sql(strings, ...values);
  } catch {
    // Deliberately omit raw driver errors, SQL parameters and connection details.
    throw new Error('Database query failed');
  }
}
