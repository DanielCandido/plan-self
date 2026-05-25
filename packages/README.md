# packages (monorepo)

How to add a new package/module to this monorepo:

1. Create directory: packages/<your-package>
2. Add package.json with name, version, main ("dist/index.js"), types ("dist/index.d.ts"), and scripts: build, dev (if needed).
3. Add src/ with your TypeScript sources, and an src/index.ts exporting public API.
4. Add a root-level tsconfig.json or extend project tsconfigs. Ensure package has its own tsconfig.json if necessary.
5. Add the package path to the workspace in the repository root package.json (workspaces array uses "packages/*").
6. Run `npm install` at repo root and use `npm run dev` or `npm run build` to compile.

Notes:
- Prefer re-exporting third-party libs from src/ (e.g. `export * from "class-validator";`) if you want to centralize versions.
- Keep package exports minimal and document public API in README.md inside the package.
