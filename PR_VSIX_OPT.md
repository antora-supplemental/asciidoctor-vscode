This PR significantly reduces the VSIX package size (by ~13MB, or 33%) and modernizes the build scripts for better cross-platform compatibility and maintainability.

### **VSIX Optimization: Reducing the 39MB Bloat**
Current builds contain thousands of unnecessary files, largely due to:
1.  **Duplicate Assets**: Thousands of files (MathJax, Mermaid, etc.) were being included twice — once in the `media/` folder (where they are used) and again in the `node_modules/` folder.
2.  **Explicit `node_modules` Inclusion**: The `.vscodeignore` was explicitly un-ignoring the entire `node_modules/` directory.
3.  **Selective Asset Copying**: Standardized the build to only copy the required runtime assets (minified JS, required jax/plugins) instead of the entire source packages for MathJax and Mermaid.

**Changes:**
- Updated `.vscodeignore` to exclude development baggage (src, preview-src, tests, github, scripts).
- Refined `copy-assets` to be selective and perform clean copies (`rm -rf` first).
- Moved asset packages (fonts, mathjax, mermaid, highlightjs) to `devDependencies` to avoid redundant packaging.
- Result: **VSIX size reduced from 39MB to 26MB**, and file count reduced from **6,340 to 3,161**.

### **Modernization: Portable Scripts**
Replaced shell-specific `&&` and env-dependent variable expansion in `package.json` with **`npm-run-all`** (`run-s`) and **`shx`**.
- Fixes build failures on Windows (PowerShell/CMD) where `mkdir -p` and `cp` are often missing or work differently.
- Resolves "Unknown env config" warnings during packaged builds.
- Ensured a synchronized `package-lock.json` for CI stability.

### **Testing**
Verified local builds with `npm install && npm run package` on Windows. The extension successfully packages and runs with a smaller footprint.
