import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
    // Base JS recommended rules
    js.configs.recommended,

    // TypeScript recommended rules
    ...tseslint.configs.recommended,

    // Prettier config (disables conflicting rules)
    prettierConfig,

    // Global ignores
    {
        ignores: ['dist/**', 'out/**', 'node_modules/**', '*.js', '*.cjs', '*.mjs']
    },

    // Main configuration for TypeScript files
    {
        files: ['src/**/*.{ts,tsx}'],
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooksPlugin
        },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                }
            }
        },
        settings: {
            react: {
                version: 'detect'
            }
        },
        rules: {
            // TypeScript specific
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-non-null-assertion': 'warn',

            // React specific
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react-hooks/rules-of-hooks': 'warn',
            'react-hooks/exhaustive-deps': 'warn',

            // General
            'prefer-const': 'warn',
            'no-unused-expressions': 'warn'
        }
    }
)
