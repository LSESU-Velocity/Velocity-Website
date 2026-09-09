import { readFileSync } from 'node:fs';
import { preview } from 'vite';

// Exercise the production bundle under the deployed CSP, not Vite's permissive
// development server. Keep the header source shared with Vercel.
const deployment = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const headers = Object.fromEntries(
  deployment.headers.find((rule: { source: string }) => rule.source === '/(.*)').headers
    .map(({ key, value }: { key: string; value: string }) => [key, value]),
);
const server = await preview({ preview: { host: '127.0.0.1', port: 4173, strictPort: true, headers } });
server.printUrls();
