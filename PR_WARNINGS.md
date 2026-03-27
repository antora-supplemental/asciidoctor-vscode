This PR addresses development-time warnings, deprecations, and modernizes the build scripts for cross-platform stability.

### **Changes:**
1.  **Webpack Warnings Fix**: Added `exprContextCritical: false` to both Webpack configurations. This suppresses the "Critical dependency" warnings related to dynamic `require` calls in the Asciidoctor-Opal runtime, which are intentional and safe in this context.
2.  **`@vscode/vsce` Upgrade**: Updated `vsce` to `3.7.1` (from `2.27.0`) to resolve deprecation warnings during the packaging process and improve compatibility with modern Node.js environments.
3.  **Cross-Platform Modernization**: Implemented `npm-run-all` and `shx` for all filesystem operations. This ensures that the build (and specifically the directory creation/copying) works consistently across Windows and Ubuntu CI environments.
4.  **Clean Build Output**: The build log is now free of "Critical dependency" noise and directory-related shell errors.

Note: This PR helps stabilize the CI for other pending changes.
