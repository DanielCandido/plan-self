# @plan-self/utils

Utilities package for the monorepo.

Build

From repo root (npm workspaces enabled):

- npm --workspace=@plan-self/utils install
- npm --workspace=@plan-self/utils run build

Or from package folder:

- cd packages/utils
- npm install
- npm run build

This will emit compiled CommonJS files under dist/ (dist/index.js, dist/class-validator.js) and type declarations under dist/*.d.ts.

Usage

In other packages/projects within the monorepo, import from the package by path (depending on your tsconfig paths) or by the workspace name after your build generates dist:

- const { IsCuid } = require('@plan-self/utils');
- import { IsCuid } from '@plan-self/utils';

Notes

- Keep source under src/ and export from src/index.ts. The build script compiles src -> dist. Ensure other packages load the package via its package.json "main" pointing to dist/index.js.
