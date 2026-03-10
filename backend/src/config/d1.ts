/**
 * Cloudflare D1 HTTP Client
 *
 * Token resolution order:
 *   1. CF_API_TOKEN env var (if set and non-empty)
 *   2. Wrangler OAuth token from the wrangler config TOML
 *      → automatically refreshed via Cloudflare OAuth2 when a 401/403 occurs
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface D1Row {
  [column: string]: unknown;
}

interface D1QueryResult {
  results: D1Row[];
  success: boolean;
  meta: {
    changed_db: boolean;
    changes: number;
    last_row_id: number;
    rows_read: number;
    rows_written: number;
  };
}

interface D1ApiResponse {
  result: D1QueryResult[];
  success: boolean;
  errors: { code: number; message: string }[];
  messages: string[];
}

// ─── Wrangler config helpers ───────────────────────────────────────────────

function getWranglerConfigPath(): string {
  if (process.platform === "win32") {
    const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
    return path.join(appData, "xdg.config", ".wrangler", "config", "default.toml");
  }
  const xdgConfig = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
  return path.join(xdgConfig, ".wrangler", "config", "default.toml");
}

function readWranglerConfig(): { oauth_token?: string; refresh_token?: string; expiration_time?: string } {
  try {
    const content = fs.readFileSync(getWranglerConfigPath(), "utf-8");
    const get = (key: string) => content.match(new RegExp(`${key}\\s*=\\s*"([^"]+)"`))?.[1];
    return { oauth_token: get("oauth_token"), refresh_token: get("refresh_token"), expiration_time: get("expiration_time") };
  } catch { return {}; }
}

function writeWranglerToken(oauth_token: string, expiration_time: string, refresh_token: string): void {
  try {
    const configPath = getWranglerConfigPath();
    let content = fs.readFileSync(configPath, "utf-8");
    content = content.replace(/oauth_token\s*=\s*"[^"]+"/, `oauth_token = "${oauth_token}"`);
    content = content.replace(/expiration_time\s*=\s*"[^"]+"/, `expiration_time = "${expiration_time}"`);
    content = content.replace(/refresh_token\s*=\s*"[^"]+"/, `refresh_token = "${refresh_token}"`);
    fs.writeFileSync(configPath, content, "utf-8");
  } catch { /* best effort */ }
}

async function refreshOAuthToken(): Promise<string | null> {
  const { refresh_token } = readWranglerConfig();
  if (!refresh_token) {
    console.error("[D1] No refresh_token in wrangler config — run `npx wrangler login`");
    return null;
  }
  try {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token,
      client_id: "54d11594-84e4-41aa-b438-e81b8fa78ee7",
    });
    const resp = await fetch("https://dash.cloudflare.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!resp.ok) {
      console.error(`[D1] OAuth refresh failed (HTTP ${resp.status})`);
      return null;
    }
    const json = await resp.json() as { access_token?: string; expires_in?: number; refresh_token?: string };
    if (json.access_token) {
      const expiresAt = new Date(Date.now() + (json.expires_in ?? 3600) * 1000).toISOString();
      writeWranglerToken(json.access_token, expiresAt, json.refresh_token ?? refresh_token);
      console.log(`[D1] OAuth token refreshed, expires ${expiresAt}`);
      return json.access_token;
    }
    console.error("[D1] OAuth refresh returned no access_token");
    return null;
  } catch (err) {
    console.error("[D1] OAuth refresh error:", err);
    return null;
  }
}

/**
 * Resolve the best available API token.
 * Always re-reads the TOML to pick up freshly refreshed tokens.
 */
function resolveApiToken(): string {
  // 1. Check .env token (skip if it was previously rejected)
  const envToken = process.env.CF_API_TOKEN?.trim();
  if (envToken && !envToken.startsWith("your_") && !_envTokenInvalid) return envToken;

  // 2. Read fresh from wrangler TOML every time
  const { oauth_token } = readWranglerConfig();
  if (oauth_token) return oauth_token;

  throw new Error("No Cloudflare API token found. Set CF_API_TOKEN in .env or run `npx wrangler login`.");
}

/** Flag set after .env token fails — forces using wrangler OAuth path */
let _envTokenInvalid = false;

// ─── Refresh mutex — ensures only one refresh runs at a time ───────────────
let _refreshPromise: Promise<string | null> | null = null;

async function ensureFreshToken(): Promise<void> {
  const { expiration_time } = readWranglerConfig();
  if (expiration_time) {
    const expiresAt = new Date(expiration_time).getTime();
    const now = Date.now();
    // Proactively refresh if within 5 minutes of expiry
    if (expiresAt - now < 5 * 60 * 1000) {
      console.log("[D1] Token expires soon — proactively refreshing…");
      await safeRefresh();
    }
  }
}

async function safeRefresh(): Promise<string | null> {
  if (!_refreshPromise) {
    _refreshPromise = refreshOAuthToken().finally(() => { _refreshPromise = null; });
  }
  return _refreshPromise;
}

export class D1Client {
  private baseUrl: string;

  constructor() {
    const accountId = process.env.CF_ACCOUNT_ID;
    const databaseId = process.env.CF_D1_DATABASE_ID;
    if (!accountId || !databaseId || accountId.startsWith("your_") || databaseId.startsWith("your_")) {
      throw new Error("Missing Cloudflare D1 config. Set CF_ACCOUNT_ID and CF_D1_DATABASE_ID in .env");
    }
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
  }

  private getHeaders(): Record<string, string> {
    return { "Authorization": `Bearer ${resolveApiToken()}`, "Content-Type": "application/json" };
  }

  /**
   * POST to D1.
   * 1. Proactively refreshes if token is near expiry (< 5 min).
   * 2. On 401/403 retries once after a mutex-guarded OAuth refresh.
   */
  private async request(body: object): Promise<D1ApiResponse> {
    // Proactive refresh before making the request
    await ensureFreshToken();

    const send = async (retrying = false): Promise<D1ApiResponse> => {
      const resp = await fetch(this.baseUrl, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      if ((resp.status === 401 || resp.status === 403) && !retrying) {
        console.log(`[D1] Token rejected (${resp.status}) – refreshing OAuth token…`);
        _envTokenInvalid = true;
        const newToken = await safeRefresh();
        if (newToken) return send(true);
        throw new Error(
          `D1 auth failed (${resp.status}) and token refresh was unsuccessful. ` +
          `Run \`npx wrangler login\` to re-authenticate.`
        );
      }

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`D1 HTTP error ${resp.status}: ${text}`);
      }
      const data = (await resp.json()) as D1ApiResponse;
      if (!data.success || data.errors?.length) {
        throw new Error(`D1 error: ${JSON.stringify(data.errors)}`);
      }
      return data;
    };
    return send();
  }

  async query<T = D1Row>(sql: string, params: unknown[] = []): Promise<T[]> {
    const data = await this.request({ sql, params });
    return (data.result[0]?.results ?? []) as T[];
  }

  async queryOne<T = D1Row>(sql: string, params: unknown[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] ?? null;
  }

  async execute(sql: string, params: unknown[] = []): Promise<{ changes: number; lastRowId: number }> {
    const data = await this.request({ sql, params });
    const meta = data.result[0]?.meta;
    return { changes: meta?.changes ?? 0, lastRowId: meta?.last_row_id ?? 0 };
  }

  /**
   * Execute multiple write statements in a SINGLE Cloudflare D1 HTTP request.
   * Previously this was a sequential for-loop (N round-trips); now it's one.
   */
  async batch(statements: Array<{ sql: string; params?: unknown[] }>): Promise<void> {
    if (statements.length === 0) return;
    if (statements.length === 1) {
      await this.execute(statements[0].sql, statements[0].params ?? []);
      return;
    }
    // D1 accepts an array body → all statements processed in one HTTP call
    await this.request(statements.map((s) => ({ sql: s.sql, params: s.params ?? [] })));
  }

  /**
   * Run multiple SELECT statements in a SINGLE HTTP round-trip.
   * Returns one result array per statement (same order as input).
   *
   * Replaces patterns like:
   *   const [a, b] = await Promise.all([db.query(...), db.query(...)])
   * with a single remote call instead of two parallel ones.
   */
  async batchQuery<T = D1Row>(statements: Array<{ sql: string; params?: unknown[] }>): Promise<T[][]> {
    if (statements.length === 0) return [];
    if (statements.length === 1) {
      return [await this.query<T>(statements[0].sql, statements[0].params ?? [])];
    }
    const data = await this.request(statements.map((s) => ({ sql: s.sql, params: s.params ?? [] })));
    return data.result.map((r) => (r.results ?? []) as T[]);
  }
}

// Singleton instance
let _client: D1Client | null = null;

export function getDB(): D1Client {
  if (!_client) _client = new D1Client();
  return _client;
}
