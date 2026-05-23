import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: { lines: 80 },
      include: [
        'src/lib/**',
        'src/app/api/**',
        'src/components/**',
      ],
      exclude: [
        '**/node_modules/**',
        '**/*.test.*',
        '**/test/**',
        'src/lib/api.ts',
        'src/lib/seed-data.ts',
        'src/components/dashboard/EngagementChart.tsx',
        'src/components/dashboard/Sidebar.tsx',
      ],
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
