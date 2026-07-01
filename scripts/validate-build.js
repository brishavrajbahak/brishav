import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const outputDir = join(process.cwd(), 'public', 'assets', 'js');
const budgetBytes = 250 * 1024;
const bundles = [
  { label: 'advanced.js', path: join(outputDir, 'advanced.js') },
  { label: 'mobile-advanced.js', path: join(outputDir, 'mobile-advanced.js') },
];

const bundleResults = bundles.map(bundle => {
  const content = readFileSync(bundle.path);
  return {
    ...bundle,
    rawBytes: content.length,
    gzipBytes: gzipSync(content).length,
  };
});

const totalGzipBytes = bundleResults.reduce((total, bundle) => total + bundle.gzipBytes, 0);
const buildMeta = readBuildMeta(join(outputDir, 'build-meta.js'));

if (!buildMeta.buildId || !buildMeta.version || !buildMeta.builtAt) {
  throw new Error('build-meta.js is missing one or more required metadata fields.');
}

if (totalGzipBytes > budgetBytes) {
  throw new Error(
    `Advanced JS bundle budget exceeded: ${(totalGzipBytes / 1024).toFixed(2)}KB gzipped > ${(budgetBytes / 1024).toFixed(0)}KB.`,
  );
}

console.log(`Advanced JS gzip budget: ${(totalGzipBytes / 1024).toFixed(2)}KB / ${(budgetBytes / 1024).toFixed(0)}KB`);
bundleResults.forEach(bundle => {
  console.log(` - ${bundle.label}: ${(bundle.gzipBytes / 1024).toFixed(2)}KB gzipped (${bundle.rawBytes} bytes raw)`);
});

function readBuildMeta(path) {
  const source = readFileSync(path, 'utf8');
  const prefix = 'window.__BUILD_META__ = ';
  if (!source.startsWith(prefix)) {
    throw new Error('build-meta.js does not export window.__BUILD_META__.');
  }

  return JSON.parse(source.slice(prefix.length).trim().replace(/;$/, ''));
}
