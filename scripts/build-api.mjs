import { build } from 'esbuild';

await build({
  entryPoints: ['api/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: 'api/bundle.js',
  external: ['pg-native'],
  tsconfig: './tsconfig.json',
});
console.log('API bundle built: api/bundle.js');
