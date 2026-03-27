const esbuild = require('esbuild')
const path = require('path')
const fs = require('fs')

const isProd = process.argv.includes('--production')
const watch = process.argv.includes('--watch')

/**
 * @type {import('esbuild').BuildOptions}
 */
const baseConfig = {
  bundle: true,
  minify: isProd,
  sourcemap: !isProd,
  logLevel: 'info',
  format: 'cjs',
}

// 1. Node Extension Build
const nodeConfig = {
  ...baseConfig,
  entryPoints: ['./src/extension.ts'],
  outfile: './dist/src/extension.js',
  platform: 'node',
  target: 'node20',
  external: ['vscode'],
}

// 2. Browser Extension Build
const browserConfig = {
  ...baseConfig,
  entryPoints: ['./src/extension.ts'],
  outfile: './dist/browser/extension.js',
  platform: 'browser',
  target: 'es2020',
  external: ['vscode'],
  alias: {
    'path': require.resolve('path-browserify'),
    'os': require.resolve('os-browserify/browser'),
    'util': require.resolve('util'),
    'querystring': require.resolve('querystring'),
    'tty': require.resolve('tty-browserify'),
    'fs': path.resolve(__dirname, 'tasks/empty.js'),
    'child_process': path.resolve(__dirname, 'tasks/empty.js'),
    'crypto': path.resolve(__dirname, 'tasks/empty.js'),
    'url': path.resolve(__dirname, 'tasks/empty.js'),
    'http': path.resolve(__dirname, 'tasks/empty.js'),
    'https': path.resolve(__dirname, 'tasks/empty.js'),
    'zlib': path.resolve(__dirname, 'tasks/empty.js'),
    'assert': path.resolve(__dirname, 'tasks/empty.js'),
    'worker_threads': require.resolve('worker-thread'),
  },
  plugins: [
    {
      name: 'antora-shim',
      setup(build) {
        build.onResolve({ filter: /antoraDocument$/ }, (args) => {
          return { path: path.resolve(__dirname, 'src/features/antora/antoraDocumentBrowserShim.ts') }
        })
      },
    },
  ],
  define: {
    'process.env.NODE_ENV': isProd ? '"production"' : '"development"',
    'global': 'window',
  },
  inject: ['./tasks/process-shim.js'], // Provide 'process' global
}

// 3. Preview Scripts Build
const previewConfig = {
  ...baseConfig,
  entryPoints: ['./preview-src/index.ts', './preview-src/pre.ts'],
  outdir: './dist',
  platform: 'browser',
  target: 'es2020',
}

async function run() {
  // Create shim for process if missing
  if (!fs.existsSync('./tasks/process-shim.js')) {
    if (!fs.existsSync('./tasks')) fs.mkdirSync('./tasks')
    fs.writeFileSync('./tasks/process-shim.js', 'export let process = require("process/browser");')
  }

  try {
    // Copy assets (JSON files etc.)
    const { execSync } = require('child_process')
    if (!fs.existsSync('./dist/browser/features')) fs.mkdirSync('./dist/browser/features', { recursive: true })
    if (!fs.existsSync('./dist/src/features')) fs.mkdirSync('./dist/src/features', { recursive: true })
    
    // Copy all JSON files to dist preserving structure
    execSync('npx shx cp src/features/*.json dist/browser/features/')
    execSync('npx shx cp src/features/*.json dist/src/features/')
    console.log('Static assets copied.')

    if (watch) {
      const ctx1 = await esbuild.context(nodeConfig)
      const ctx2 = await esbuild.context(browserConfig)
      const ctx3 = await esbuild.context(previewConfig)
      await Promise.all([ctx1.watch(), ctx2.watch(), ctx3.watch()])
    } else {
      await Promise.all([
        esbuild.build(nodeConfig),
        esbuild.build(browserConfig),
        esbuild.build(previewConfig),
      ])
    }
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

run()
