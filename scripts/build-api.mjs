import { build } from 'esbuild';
import { resolve } from 'path';

await build({
  entryPoints: ['api/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: 'dist/api/index.js',
  external: ['pg-native'],
  tsconfig: './tsconfig.json',
});
console.log('API bundle built successfully');
