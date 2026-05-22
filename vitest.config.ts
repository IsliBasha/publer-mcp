import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: { lines: 80 },
      include: ['packages/*/src/**', 'apps/*/src/**'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/seed.ts'],
    },
  },
})
