import fs from 'node:fs/promises';

const required = ['D1_DATABASE_ID', 'KV_NAMESPACE_ID'];
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length > 0) {
  throw new Error(`Missing GitHub Actions variables: ${missing.join(', ')}`);
}

const d1DatabaseId = process.env.D1_DATABASE_ID.trim();
const kvNamespaceId = process.env.KV_NAMESPACE_ID.trim();

if (!/^[0-9a-f-]{36}$/i.test(d1DatabaseId)) {
  throw new Error('D1_DATABASE_ID does not look like a D1 database UUID.');
}
if (!/^[0-9a-f]{32}$/i.test(kvNamespaceId)) {
  throw new Error('KV_NAMESPACE_ID must be a 32-character hexadecimal namespace id.');
}

const source = JSON.parse(await fs.readFile('wrangler.jsonc', 'utf8'));
source.name = process.env.CLOUDFLARE_WORKER_NAME?.trim() || source.name;
source.vars = { ...source.vars, ENVIRONMENT: 'production' };
source.d1_databases[0].database_id = d1DatabaseId;
source.d1_databases[0].database_name =
  process.env.D1_DATABASE_NAME?.trim() || source.d1_databases[0].database_name;
source.kv_namespaces[0].id = kvNamespaceId;

await fs.writeFile('wrangler.deploy.jsonc', `${JSON.stringify(source, null, 2)}\n`);
console.log('Rendered wrangler.deploy.jsonc for deployment.');
