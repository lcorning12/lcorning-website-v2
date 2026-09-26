import { build } from './lib.mjs';

build({
  includeDrafts: process.env.INCLUDE_DRAFTS === '1',
  outDir: process.env.OUT_DIR || 'dist',
});
