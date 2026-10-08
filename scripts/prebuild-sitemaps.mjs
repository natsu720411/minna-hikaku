import { spawnSync } from 'node:child_process';

const run = (file, target, extra = []) => {
  const result = spawnSync(process.execPath, [file, `--target=${target}`, ...extra], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
};

run('scripts/generate-category-details.mjs', 'public');
run('scripts/generate-legacy-product-details.mjs', 'public');
run('scripts/expand-category-comparisons.mjs', 'public');
run('scripts/expand-legacy-comparisons.mjs', 'public');
run('scripts/generate-expansion-categories.mjs', 'public', ['--root']);
run('scripts/normalize-sitemaps.mjs', 'public');
run('scripts/enhance-price-transparency.mjs', 'public');
run('scripts/enhance-product-seo.mjs', 'public');
