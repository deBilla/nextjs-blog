---
title: "Import-Aware CI/CD for Firebase Cloud Functions: Deploy Only What Changed"
date: "2026-04-11"
readTime: "10 min"
preview: "If you have a monorepo with many Cloud Functions, setting up CI/CD can feel like something to avoid. Here's a better approach: selective deployment using static import analysis."
---

If you have a monorepo with many Cloud Functions, deploying all of them on every change is slow, risky, and wasteful. In this guide I'll show a better approach: **selective deployment using static import analysis**, without any complex monorepo tooling like Bazel or Nx.

## The Problem

A typical Firebase Cloud Functions monorepo might have 30+ functions. A full `firebase deploy --only functions` takes 5–10 minutes and redeploys everything — even functions that weren't touched.

The standard solutions are heavy: Nx, Bazel, or custom shell scripts that require you to manually list which functions each file affects.

## The Idea: Static Import Analysis

Instead of manually tracking dependencies, we can parse the import graph automatically. Given a changed file, we walk the import tree to find all functions that *could* be affected.

The algorithm:
1. Get the list of changed files from git.
2. For each changed file, find all importers (files that import it, directly or transitively).
3. If any importer is a Cloud Function entry point, mark that function for deployment.
4. Deploy only the marked functions.

## Implementation

```typescript
import * as ts from "typescript";
import * as path from "path";
import * as fs from "fs";

function getImports(filePath: string): string[] {
  const source = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true
  );

  const imports: string[] = [];
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier as ts.StringLiteral;
      imports.push(moduleSpecifier.text);
    }
  });
  return imports;
}
```

## Building the Reverse Import Graph

```typescript
function buildReverseGraph(
  rootDir: string
): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();
  const files = glob.sync("**/*.ts", { cwd: rootDir });

  for (const file of files) {
    const absFile = path.join(rootDir, file);
    const imports = getImports(absFile);

    for (const imp of imports) {
      const resolved = resolveImport(absFile, imp);
      if (!resolved) continue;
      if (!graph.has(resolved)) graph.set(resolved, new Set());
      graph.get(resolved)!.add(absFile);
    }
  }
  return graph;
}
```

## The GitHub Actions Workflow

```yaml
name: Deploy Changed Functions

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 2

      - name: Get changed files
        id: changed
        run: |
          echo "files=$(git diff --name-only HEAD~1 HEAD | tr '\n' ',')" >> $GITHUB_OUTPUT

      - name: Analyze and deploy
        run: |
          node scripts/deploy-changed.js "${{ steps.changed.outputs.files }}"
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

## Results

Before: every push triggered a full 8-minute deploy of all 34 functions.
After: most pushes deploy 1–3 functions in under 90 seconds.

The analysis script adds about 3 seconds of overhead — well worth the time saved.

## Caveats

- Dynamic imports (`require(variable)`) are not caught by static analysis.
- Changes to `package.json` or shared config should trigger a full deploy.
- The reverse graph needs to be rebuilt if you restructure imports significantly.

This approach works well for projects where functions are cleanly separated with minimal cross-cutting dependencies. If your codebase is deeply entangled, you may need a heavier tool.

---

*The full implementation is available in the [Qalbox Cloud Functions repository](https://github.com/deBilla).*
