#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
cd "$ROOT"

echo "[1/3] Patching package.json"
node <<'NODE'
const fs = require('fs');
const path = 'package.json';
if (!fs.existsSync(path)) {
  console.error('package.json not found');
  process.exit(1);
}
const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
pkg.devDependencies = pkg.devDependencies || {};
if (!pkg.devDependencies['@vercel/node']) {
  pkg.devDependencies['@vercel/node'] = '^5.3.22';
  console.log('Added @vercel/node to devDependencies');
} else {
  console.log('@vercel/node already present');
}
fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
NODE

echo "[2/3] Patching api imports"
node <<'NODE'
const fs = require('fs');
const path = require('path');

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && full.endsWith('.ts')) out.push(full);
  }
  return out;
}

const files = walk('api');
let changed = 0;
for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  let after = before
    .replace(/from\s+['"](\.\.\/)+_lib\/serverSupabase['"]/g, (m, p1) => `from '${p1}_lib/serverSupabase.js'`)
    .replace(/from\s+['"](\.\.\/)+_lib\/deliveryPricing['"]/g, (m, p1) => `from '${p1}_lib/deliveryPricing.js'`);
  if (after !== before) {
    fs.writeFileSync(file, after);
    console.log('Patched', file);
    changed += 1;
  }
}
console.log(`Updated ${changed} API file(s)`);
NODE

echo "[3/3] Patching tsconfig.node.json when present"
node <<'NODE'
const fs = require('fs');
const path = 'tsconfig.node.json';
if (!fs.existsSync(path)) {
  console.log('tsconfig.node.json not found, skipping');
  process.exit(0);
}
const cfg = JSON.parse(fs.readFileSync(path, 'utf8'));
cfg.compilerOptions = cfg.compilerOptions || {};
const types = new Set(cfg.compilerOptions.types || []);
types.add('node');
types.add('@vercel/node');
cfg.compilerOptions.types = Array.from(types);
fs.writeFileSync(path, JSON.stringify(cfg, null, 2) + '\n');
console.log('Updated tsconfig.node.json types');
NODE

echo "Done. Run npm install and redeploy."
