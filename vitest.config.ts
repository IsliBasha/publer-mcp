import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['apps/dashboard/src/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: { lines: 80 },
      include: ['packages/publer-client/src/**', 'apps/mcp-server/src/tools/**'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/mock/**',
        '**/index.ts',
        '**/auth/**',
        '**/ai-tools.ts',
      ],
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'apps/dashboard/src') },
  },
})
