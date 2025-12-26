import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
    test: {
        globals: true,
        environment: 'happy-dom',
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        exclude: ['node_modules', 'out', 'dist'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['src/**/*.ts', 'src/**/*.tsx'],
            exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/**/index.ts']
        }
    },
    resolve: {
        alias: {
            '@shared': resolve(__dirname, 'src/shared')
        }
    }
})
