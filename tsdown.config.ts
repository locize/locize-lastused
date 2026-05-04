import { defineConfig } from 'tsdown'

const libEntry = { index: 'lib/index.js' }
const jsExt = () => ({ js: '.js' as const })

export default defineConfig([
  // ── ESM build (consumed via `import` / `./esm` subpath) ──
  {
    entry: libEntry,
    format: ['esm'],
    outDir: 'esm',
    outExtensions: jsExt,
    dts: false,
    sourcemap: false,
    clean: true,
  },
  // ── CJS build (consumed via `require` / `./cjs` subpath) ──
  {
    entry: libEntry,
    format: ['cjs'],
    outDir: 'cjs',
    outExtensions: jsExt,
    dts: false,
    sourcemap: false,
    clean: true,
  },
  // ── IIFE bundle for direct <script> use (unminified + minified) ──
  // Default tsdown IIFE filename template is `[name].iife.js`; override to
  // keep the legacy `locizeLastUsed.js` / `locizeLastUsed.min.js` names that
  // consumers (CDNs, downloaders) already link to.
  {
    entry: { locizeLastUsed: 'lib/index.js' },
    format: ['iife'],
    globalName: 'locizeLastUsed',
    outDir: '.',
    outputOptions: { entryFileNames: '[name].js' },
    target: 'es2020',
    dts: false,
    sourcemap: false,
    clean: false,
  },
  {
    entry: { 'locizeLastUsed.min': 'lib/index.js' },
    format: ['iife'],
    globalName: 'locizeLastUsed',
    outDir: '.',
    outputOptions: { entryFileNames: '[name].js' },
    target: 'es2020',
    minify: true,
    dts: false,
    sourcemap: false,
    clean: false,
  },
])
