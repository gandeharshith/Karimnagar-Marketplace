/**
 * Local development server for the /api/businesses serverless function.
 * Mimics the Vercel serverless environment so you don't need `vercel dev`.
 *
 * Usage: node api/server.js   (runs on port 3000)
 */

import http from 'http';
import { URL } from 'url';
import handler from './businesses.js';

// Load .env manually (Node 20.6+ supports --env-file, but we do it manually for compatibility)
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
  console.log('✅ Loaded .env');
} catch {
  console.warn('⚠️  No .env file found, using existing environment variables');
}

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  // Only handle /api/* routes
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);

  // CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse query params
  const query = {};
  parsedUrl.searchParams.forEach((v, k) => { query[k] = v; });

  // Parse body
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    let parsedBody = {};
    try { parsedBody = body ? JSON.parse(body) : {}; } catch { parsedBody = {}; }

    // Build a mock req/res compatible with the Vercel handler
    const mockReq = {
      method: req.method,
      url: req.url,
      query,
      body: parsedBody,
      headers: req.headers,
    };

    const mockRes = {
      _status: 200,
      _headers: {},
      status(code) { this._status = code; return this; },
      setHeader(k, v) { this._headers[k] = v; res.setHeader(k, v); return this; },
      end() { res.writeHead(this._status, this._headers); res.end(); },
      json(data) {
        res.writeHead(this._status, { ...this._headers, 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      },
    };

    try {
      await handler(mockReq, mockRes);
    } catch (err) {
      console.error('Handler error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Local API server running at http://localhost:${PORT}`);
  console.log(`   Handles: /api/businesses?action=list|add|update|delete|restore|bulkAdd`);
});
