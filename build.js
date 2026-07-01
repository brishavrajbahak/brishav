import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outputDir = join(process.cwd(), 'public', 'assets', 'js');
mkdirSync(outputDir, { recursive: true });

const branch = getBranchName();
const version = `advanced-v1-${new Date().toISOString().slice(0, 10)}`;
const isPreview = !['main', 'master', 'unknown'].includes(branch);
const desktopBundlePath = join(outputDir, 'advanced.js');
const mobileBundlePath = join(outputDir, 'mobile-advanced.js');

const commonOptions = {
  bundle: true,
  format: 'iife',
  minify: true,
  sourcemap: false,
  target: ['es2020'],
  charset: 'utf8',
  logLevel: 'info',
};

await build({
  ...commonOptions,
  entryPoints: ['public/assets/js/modules/desktop.entry.js'],
  outfile: desktopBundlePath,
});

await build({
  ...commonOptions,
  entryPoints: ['public/assets/js/modules/mobile.entry.js'],
  outfile: mobileBundlePath,
});

const desktopBundle = readFileSync(desktopBundlePath);
const mobileBundle = readFileSync(mobileBundlePath);
const buildId = createHash('sha1')
  .update(desktopBundle)
  .update(mobileBundle)
  .digest('hex')
  .slice(0, 12);

writeFileSync(
  join(outputDir, 'build-meta.js'),
  `window.__BUILD_META__ = ${JSON.stringify({
    branch,
    version,
    isPreview,
    buildId,
    builtAt: new Date().toISOString(),
    bundles: {
      advanced: {
        file: 'advanced.js',
        bytes: statSync(desktopBundlePath).size,
        hash: hashBundle(desktopBundle),
      },
      mobileAdvanced: {
        file: 'mobile-advanced.js',
        bytes: statSync(mobileBundlePath).size,
        hash: hashBundle(mobileBundle),
      },
    },
  }, null, 2)};\n`,
  'utf8',
);

function getBranchName() {
  if (process.env.GITHUB_REF_NAME) return process.env.GITHUB_REF_NAME;
  if (process.env.CF_PAGES_BRANCH) return process.env.CF_PAGES_BRANCH;

  try {
    const gitBinary = resolveGitBinary();
    return execSync(`"${gitBinary}" rev-parse --abbrev-ref HEAD`, { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function resolveGitBinary() {
  const candidates = [
    'C:\\Program Files\\Git\\cmd\\git.exe',
    'C:\\Program Files\\Git\\bin\\git.exe',
    'git',
  ];
  return candidates.find(candidate => candidate === 'git' || existsSync(candidate)) || 'git';
}

function hashBundle(content) {
  return createHash('sha1').update(content).digest('hex').slice(0, 10);
}
