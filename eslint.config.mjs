import neostandard from 'neostandard'
import globals from 'globals'

export default [
  {
    ignores: [
      'cjs',
      'esm',
      'node_modules',
      'example',
      'locizeLastUsed.js',
      'locizeLastUsed.min.js',
      '**/*.d.ts',
      '**/*.d.mts',
    ],
  },
  ...neostandard(),
  {
    files: ['test/**/*.js', 'test/**/*.cjs'],
    languageOptions: {
      globals: { ...globals.mocha },
    },
  },
]
