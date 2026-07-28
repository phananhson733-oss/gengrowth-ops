import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('launchd installer waits for the health endpoint after kickstart', async () => {
  const installer = await readFile(new URL('../install-launchd.sh', import.meta.url), 'utf8');

  assert.match(installer, /for attempt in \{1\.\.10\}; do/);
  assert.match(installer, /curl -fsS http:\/\/127\.0\.0\.1:\$\{PORT\}\/api\/health/);
  assert.match(installer, /sleep 1/);
});

test('launchd installer unloads a prior plist through the documented domain-and-path form', async () => {
  const installer = await readFile(new URL('../install-launchd.sh', import.meta.url), 'utf8');

  assert.match(installer, /launchctl bootout "\$DOMAIN" "\$PLIST_PATH"/);
});
