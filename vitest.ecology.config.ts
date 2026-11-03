import { defineConfig } from 'vitest/config'
import path from 'path'

// Long-running, multi-seed checks of the model's ecological behaviour
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.ecology.test.ts'],
    testTimeout: 300_000,
    hookTimeout: 300_000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
