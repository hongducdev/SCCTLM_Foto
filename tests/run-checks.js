// Run: node tests/run-checks.js   (or: npm test)
// Runs every tests/check-*.js in its own Node process and fails if any of them fails.
// check-live-reload.js prints SKIP unless SCCTLM_FOTO_LIVE=1 (needs Photoshop with the panel open).
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const dir = __dirname;
const checks = fs.readdirSync(dir).filter((name) => /^check-.+\.js$/.test(name)).sort();
const failed = [];
for (const name of checks) {
    const result = spawnSync(process.execPath, [path.join(dir, name)], { encoding: 'utf8' });
    const output = (result.stdout + result.stderr).trim();
    const ok = result.status === 0;
    console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : '\n' + output));
    if (!ok) failed.push(name);
}
console.log('\n' + (checks.length - failed.length) + '/' + checks.length + ' checks passed');
if (failed.length) process.exit(1);
