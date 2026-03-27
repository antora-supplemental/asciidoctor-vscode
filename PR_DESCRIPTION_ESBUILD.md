# Modernize Build Pipeline: Migrate from Webpack to esbuild (14x performance boost)

## Summary
This PR replaces the legacy Webpack-based build system with **esbuild**, providing a massive improvement in developer productivity, build speed, and reliability. 

## Performance Benchmarks (Local Measurements)
| Build Target | Old (Webpack) | New (esbuild) | Speedup |
| :--- | :--- | :--- | :--- |
| **Browser Extension** (`build-web`) | ~4.6s | **325ms** | **~14x** |
| **Node Extension** (`build`) | ~2.5s | **195ms** | **~12x** |
| **Webview Preview Assets** | ~1.2s | **38ms** | **~30x** |

## Key Technical Changes
### 1. Unified `esbuild.config.js`
Replaces three separate Webpack configurations and redundant `tsconfig` files with a single, high-performance configuration script. This reduces maintenance overhead and ensures consistent build settings across Node and Browser targets.

### 2. Node Extension Bundling
Switched from compiling individual files with `tsc` to a single-file bundle. This optimization reduces the I/O overhead during extension activation in VS Code, leading to faster startup times for users.

### 3. Clean Browser Compatibility
- **Custom Shimming**: Implemented an `antora-shim` plugin in `esbuild` to handle browser-specific module resolution, replacing the legacy `NormalModuleReplacementPlugin`.
- **Modern Polyfills**: Migrated to modern, light-weight shims (`path-browserify`, `os-browserify`, `util`, etc.) for the web extension environment.

### 4. Code Resilience
- Fixed an invalid ESM import for `uuid` that was previously masked by Webpack's loose resolution but correctly flagged by modern bundling standards.
- Optimized static asset copying using `shx` for cross-platform compatibility.

## Removed Legacy Baggage
- **Deleted**: `extension-browser.webpack.config.js`, `extension-preview.webpack.config.js`, and `tsconfig.browser.json`.
- **Uninstalled**: `webpack`, `webpack-cli`, `ts-loader`, and `copy-webpack-plugin`.

## Why this change?
Webpack has become a bottleneck for development cycles. By moving to `esbuild`, we achieve sub-second rebuild times that significantly enhance the "tight feedback loop" required for high-quality extension development. 
