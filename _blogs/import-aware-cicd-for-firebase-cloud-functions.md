---
title: "Import-Aware CI/CD for Firebase Cloud Functions: Deploy Only What Changed"
date: "2026-04-11"
readTime: "10 min"
preview: "If you have a monorepo with many Cloud Functions, setting up CI/CD can feel like something to avoid. In this guide I'll show a better approach: selective deployment using static import analysis, without any complex monorepo tooling like Bazel or Nx."
---

If you have a monorepo with many Cloud Functions, setting up CI/CD can feel like something to avoid — one wrong change and you're redeploying everything.

In this guide I'll show a better approach: selective deployment using static import analysis, without any complex monorepo tooling like Bazel or Nx.

---

## The Problem

If you have a Firebase project with 40+ Cloud Functions, a naive CI/CD pipeline deploys all of them on every push. A 30-second code change to one function kicks off a 15-minute deployment of everything. It's slow, risky, and wastes money on unnecessary Cloud Build minutes.

We needed a pipeline that could answer one question: *which functions are actually affected by this change?*

---

## The Goal

- On a **pull request**: post a comment showing exactly which functions will deploy
- On **merge**: deploy only those functions
- If a shared utility changes: correctly identify every function that depends on it, transitively

---

## The Approach: Static Import Graph Analysis

The key insight is that Firebase Cloud Functions are just Node.js modules. Each function exports a handler from a route file, and those route files import shared utilities, repositories, and config. If you change a shared file, every function that transitively imports it is affected.

We used [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) to build a static import graph from all route files and traverse it in reverse — from a changed file back to every function that depends on it.

---

## Step 1: The Function Map

Create `.github/function-map.json` — a mapping from route file path to Firebase function name:

```json
{
  "functions/src/modules/media/routes/get-content.route.ts": "app-get-content",
  "functions/src/modules/media/routes/search.route.ts": "app-search",
  "functions/src/modules/admin/routes/content-management.route.ts": "app-admin-content",
  "functions/src/modules/admin/routes/live-event.route.ts": "app-admin-live-event"
}
```

Every entry is a leaf — a file that exports a Cloud Function. This is the source of truth for the pipeline.

---

## Step 2: The Detection Script

`.github/scripts/get-changed-functions.js` takes a list of changed files via `CHANGED_FILES` env var and returns the Firebase deploy targets:

```js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../..');
const functionMap = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../function-map.json'), 'utf8')
);

const changedFiles = (process.env.CHANGED_FILES || '')
  .split('\n').map(f => f.trim()).filter(Boolean);

if (changedFiles.length === 0) {
  console.log('NONE');
  process.exit(0);
}

const routeFiles = Object.keys(functionMap);

// Build full import graph with dependency-cruiser
const depcruiseBin = path.join(REPO_ROOT, 'functions/node_modules/.bin/depcruise');
const output = execSync(
  `"${depcruiseBin}" --no-config --include-only "^functions/src" --output-type json ${routeFiles.join(' ')}`,
  { cwd: REPO_ROOT, maxBuffer: 10 * 1024 * 1024 }
).toString();

const allModules = JSON.parse(output).modules;

// Build adjacency list: source → direct dependencies
const directDeps = {};
for (const module of allModules) {
  directDeps[module.source] = module.dependencies
    .filter(d => !d.couldNotResolve)
    .map(d => d.resolved);
}

// For each route file, compute full transitive dependency set (BFS)
const reverseDeps = {};
for (const routeFile of routeFiles) {
  const visited = new Set();
  const queue = [routeFile];
  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);
    for (const dep of (directDeps[current] || [])) {
      if (!visited.has(dep)) queue.push(dep);
    }
  }
  for (const dep of visited) {
    if (dep === routeFile) continue;
    if (!reverseDeps[dep]) reverseDeps[dep] = new Set();
    reverseDeps[dep].add(routeFile);
  }
}

// Find all affected functions
const affected = new Set();
for (const changedFile of changedFiles) {
  if (functionMap[changedFile]) affected.add(functionMap[changedFile]);
  if (reverseDeps[changedFile]) {
    for (const routeFile of reverseDeps[changedFile]) {
      affected.add(functionMap[routeFile]);
    }
  }
}

if (affected.size === 0) {
  console.log('NONE');
} else {
  console.log([...affected].map(n => `functions:${n}`).join(','));
}
```

If dependency-cruiser fails for any reason, it falls back to deploying all functions — safe by default.

---

## Step 3: The GitHub Actions Workflow

Two jobs: **preview** on PRs, **deploy** on merge.

```yaml
name: Deploy Cloud Functions

on:
  pull_request:
    branches: [staging, master]
    paths:
      - 'functions/src/**'
      - 'functions/package.json'
      - 'firebase.json'
  push:
    branches: [staging, master]
    paths:
      - 'functions/src/**'
      - 'functions/package.json'
      - 'firebase.json'

jobs:
  preview:
    name: Deployment Preview
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
      - name: Install dependencies
        run: npm ci
        working-directory: functions
      - name: Detect affected functions
        id: preview
        run: |
          CHANGED=$(git diff --name-only origin/${{ github.base_ref }}...HEAD)
          DEPLOY=$(CHANGED_FILES="$CHANGED" node .github/scripts/get-changed-functions.js)
          echo "deploy_target=$DEPLOY" >> $GITHUB_OUTPUT

  deploy:
    name: Deploy to ${{ github.ref_name == 'master' && 'Production' || 'Staging' }}
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
      - name: Detect affected functions
        id: changed
        run: |
          CHANGED=$(git diff --name-only HEAD~1 HEAD)
          DEPLOY=$(CHANGED_FILES="$CHANGED" node .github/scripts/get-changed-functions.js)
          echo "deploy_target=$DEPLOY" >> $GITHUB_OUTPUT
      - name: Install Firebase CLI
        run: npm install -g firebase-tools
      - name: Deploy changed functions
        if: steps.changed.outputs.deploy_target != 'NONE'
        run: |
          firebase deploy --only ${{ steps.changed.outputs.deploy_target }} \
            --project ${{ vars.FIREBASE_PROJECT }} --non-interactive
        env:
          GOOGLE_APPLICATION_CREDENTIALS: ${{ runner.temp }}/sa.json
```

---

## What We Hit in Production

### 1. `contents: read` permission missing

When you set any permission explicitly, all others default to `none`. So `actions/checkout` silently failed because the token had no `contents` permission.

**Fix:** Always pair `pull-requests: write` with `contents: read`.

### 2. `firebase: command not found`

The Ubuntu runner doesn't have the Firebase CLI pre-installed.

**Fix:** Add `npm install -g firebase-tools` before the deploy step.

### 3. Firebase Tools billing API false positive

After upgrading to Node 24, deployments started failing with a 403 on the Cloud Billing API — even though billing was enabled. This is a [known Firebase CLI bug](https://github.com/firebase/firebase-tools/issues/7584) introduced in v13.15.4 where the CLI makes an unnecessary billing API check.

**Fix:** Pin or upgrade firebase-tools past the affected range.

### 4. IAM permission for 2nd gen Cloud Functions

```
Caller is missing permission 'iam.serviceaccounts.actAs' on service account
<project-number>-compute@developer.gserviceaccount.com
```

For **2nd gen** Cloud Functions, Firebase uses Cloud Build internally. The **Cloud Build service account** needs `roles/iam.serviceAccountUser` on the compute default service account.

**Fix:**
```bash
gcloud iam service-accounts add-iam-policy-binding \
  <project-number>-compute@developer.gserviceaccount.com \
  --member="serviceAccount:<project-number>@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser" \
  --project=<your-project>
```

### 5. Container health check failing — OOM on Node 24

Node 24 has a higher baseline memory footprint than Node 18. The root cause was a shared `configurations.ts` file that eagerly initialized three heavy SDK clients at **module load time**:

```ts
// These ran on EVERY function import, even functions that never use them
const spanner = new Spanner({ projectId });
const pgPool = new Pool({ host, database, user, password, port });
const transcoderClient = new TranscoderServiceClient();
```

**Fix:** Lazy initialization using ES getter syntax:

```ts
let _pgPool: Pool | undefined;
const getPgPool = () => {
  if (!_pgPool) _pgPool = new Pool({ ... });
  return _pgPool;
};

export default () => ({
  database: {
    postgres: { get connection() { return getPgPool(); } },
  },
});
```

A function that only needs VPC config now pays zero cost for Spanner or Postgres at startup.

### 6. Skipping CI on shared dependency changes

Changing a shared file triggers a redeploy of every function that imports it. For infrastructure-only changes, include `[skip ci]` in the commit message and **squash merge** the PR.

---

## The Result

The PR comment now shows exactly which functions will deploy:

```
☁️ Cloud Functions Deployment Preview
🧪 Staging — merging this PR will deploy:
- app-admin-live-event
```

Deploy times dropped from ~15 minutes (all functions) to under 3 minutes for a typical single-function change.

---

## Key Takeaways

- **dependency-cruiser** gives you a precise, statically-derived import graph — no guessing, no glob patterns
- **2nd gen Cloud Functions** have more IAM setup requirements than 1st gen
- **Eager SDK initialization** in shared config modules is a silent memory tax
- **ES getters** are the cleanest way to make config lazy without changing how callers access it
- Use `[skip ci]` + squash merge to avoid triggering mass redeployments on infrastructure changes
