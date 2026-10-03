import { spawnSync } from 'node:child_process';

const run = (file, target) => {
  const result = spawnSync(process.execPath, [file, `--target=${target}`], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
};

run('scripts/generate-category-details.mjs', 'public');
run('scripts/expand-category-comparisons.mjs', 'public');
run('scripts/normalize-sitemaps.mjs', 'public');
