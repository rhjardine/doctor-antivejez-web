import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Extensión .mts (no .ts) de forma deliberada:
// package.json no declara "type": "module", así que un vitest.config.ts se carga
// por la vía CommonJS y resuelve vitest/config → dist/config.cjs, que hace
// require('vite'). Vite 7 es ESM puro, de modo que ese require solo funciona en
// Node >= 20.19 / 22.12 y revienta con ERR_REQUIRE_ESM en versiones anteriores
// (fallo de build en Render). Con .mts se carga por la vía ESM y se resuelve
// dist/config.js, evitando el require(ESM) en cualquier versión de Node.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
