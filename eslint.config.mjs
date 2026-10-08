import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import { defineConfig, globalIgnores } from 'eslint/config'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
})

export default defineConfig([
  ...compat.config({ extends: ['next/core-web-vitals', 'next/typescript'] }),
  {
    files: [
      'app/**/*.{ts,tsx}',
      'components/**/*.{ts,tsx}',
      'hooks/**/*.{ts,tsx}',
      'lib/**/*.{ts,tsx}',
    ],
    ignores: ['app/api/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/server', '@/server/*'],
              message:
                'UI code must import contracts or call an API route, not import server-only modules.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'components/questions/QuestionImageManager.tsx',
      'components/upload/{ImageQueueList,ImageUpload,MultiImageUpload}.tsx',
      'components/worksheets/WorksheetBuilder.tsx',
    ],
    rules: {
      // These are local previews, signed URLs, or print content with dynamic sizes.
      '@next/next/no-img-element': 'off',
    },
  },
  {
    files: ['tailwind.config.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'dist/**', 'next-env.d.ts']),
])
