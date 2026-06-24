import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const roots = [
  'public/assets/js',
  'functions/api',
  'functions/lib',
  'scripts',
  'workers/contact-rate-limiter/src',
];

function collectJsFiles(root) {
  const entries = readdirSync(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectJsFiles(fullPath));
      continue;
    }

    if (/\.(js|mjs)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

const files = roots.flatMap(collectJsFiles);
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log(`Syntax check passed for ${files.length} JavaScript files.`);
