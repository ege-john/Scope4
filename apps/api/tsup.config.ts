import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  clean: true,
  noExternal: ['@scope4/db', '@scope4/types'],
});
