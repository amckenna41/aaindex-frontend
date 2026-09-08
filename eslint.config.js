// @ts-check
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  // ── Ignored paths ──────────────────────────────────────────────────────────
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'pySAR/**',
      'coverage/**',
      'playwright-report/**',
      '*.py',
    ],
  },

  // ── Base JS rules ──────────────────────────────────────────────────────────
  js.configs.recommended,

  // ── TypeScript source (src/ and api/) ──────────────────────────────────────
  {
    files: ['src/**/*.{ts,tsx}', 'api/**/*.ts'],
    extends: [
      ...tseslint.configs.recommended,
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Allow ternary and short-circuit expressions used for side effects (e.g. React event handlers)
      '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
    },
  },

  // ── API handlers (Node.js environment) ─────────────────────────────────────
  {
    files: ['api/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // ── Test files ─────────────────────────────────────────────────────────────
  {
    files: ['tests/**/*.{ts,tsx}'],
    extends: [
      ...tseslint.configs.recommended,
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Vitest mock factories use require() — cannot use ESM imports inside vi.mock()
      '@typescript-eslint/no-require-imports': 'off',
      // Test files commonly import helpers that are used selectively across suites
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // ── Config files and build scripts (Node.js environment) ──────────────────
  {
    files: ['*.config.{js,ts,mjs,cjs}', 'postcss.config.js', 'tailwind.config.js', 'scripts/**/*.{js,mjs}'],
    extends: [
      ...tseslint.configs.recommended,
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
)
