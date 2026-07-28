const REQUIRED_VARIABLES = [
  'BACKLINK_ACCESS_TOKEN',
  'BACKLINK_SESSION_SECRET',
  'SEARXNG_BASE_URL',
  'SEARXNG_SECRET',
  'GOOGLE_SHEET_WEBAPP_URL',
  'GOOGLE_SHEET_SHARED_SECRET',
];

export function inspectDeploymentConfig({ env = process.env } = {}) {
  const missing = REQUIRED_VARIABLES.filter((name) => !String(env[name] ?? '').trim());
  return { ok: missing.length === 0, missing };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const result = inspectDeploymentConfig();
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exitCode = result.ok ? 0 : 1;
}
