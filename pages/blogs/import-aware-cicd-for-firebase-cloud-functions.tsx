import React from "react";
import Head from "next/head";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import data from "../../data/portfolio.json";

const Article: React.FC = () => {
  return (
    <>
      <Head>
        <title>Import-Aware CI/CD for Firebase Cloud Functions: Deploy Only What Changed — {data.name}</title>
        <meta name="description" content="If you have a monorepo with many Cloud Functions, setting up CI/CD can feel like something to avoid. In this guide I'll show a better approach: selective deployment using static import analysis, without any complex monorepo tooling like Bazel or Nx." />
      </Head>

      <div className="bg-glow" />
      <div className="bg-glow-2" />

      <div className="relative z-10">
        <Navbar />

        <article className="max-w-3xl mx-auto px-6 pt-6 pb-20">
          <Link href="/blogs">
            <a className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-400 transition-colors mb-8">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to blogs
            </a>
          </Link>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {["firebase","cloud-functions","cicd","github-actions","monorepo"].map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">
            Import-Aware CI/CD for Firebase Cloud Functions: Deploy Only What Changed
          </h1>

          <div className="mt-4 flex items-center gap-3 text-xs font-mono text-gray-400 dark:text-gray-600">
            <span>April 11, 2026</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span>10 min read</span>
          </div>

          <div
            className="mt-8 h-px"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(var(--accent), 0.3), transparent)",
            }}
          />

          <div className="markdown-class" dangerouslySetInnerHTML={{ __html: `

<p>If you have a monorepo with many Cloud Functions, setting up CI/CD can feel like something to avoid — one wrong change and you're redeploying everything.</p>

<p>In this guide I'll show a better approach: selective deployment using static import analysis, without any complex monorepo tooling like Bazel or Nx.</p>

<hr />

<h2>The Problem</h2>

<p>If you have a Firebase project with 40+ Cloud Functions, a naive CI/CD pipeline deploys all of them on every push. A 30-second code change to one function kicks off a 15-minute deployment of everything. It's slow, risky, and wastes money on unnecessary Cloud Build minutes.</p>

<p>We needed a pipeline that could answer one question: <em>which functions are actually affected by this change?</em></p>

<hr />

<h2>The Goal</h2>

<ul>
<li>On a <strong>pull request</strong>: post a comment showing exactly which functions will deploy</li>
<li>On <strong>merge</strong>: deploy only those functions</li>
<li>If a shared utility changes: correctly identify every function that depends on it, transitively</li>
</ul>

<hr />

<h2>The Approach: Static Import Graph Analysis</h2>

<p>The key insight is that Firebase Cloud Functions are just Node.js modules. Each function exports a handler from a route file, and those route files import shared utilities, repositories, and config. If you change a shared file, every function that transitively imports it is affected.</p>

<p>We used <a href="https://github.com/sverweij/dependency-cruiser" target="_blank" rel="noopener noreferrer">dependency-cruiser</a> to build a static import graph from all route files and traverse it in reverse — from a changed file back to every function that depends on it.</p>

<hr />

<h2>Step 1: The Function Map</h2>

<p>Create <code>.github/function-map.json</code> — a mapping from route file path to Firebase function name:</p>

<pre><code>{
  "functions/src/modules/media/routes/get-content.route.ts": "app-get-content",
  "functions/src/modules/media/routes/search.route.ts": "app-search",
  "functions/src/modules/admin/routes/content-management.route.ts": "app-admin-content",
  "functions/src/modules/admin/routes/live-event.route.ts": "app-admin-live-event"
}</code></pre>

<p>Every entry is a leaf — a file that exports a Cloud Function. This is the source of truth for the pipeline.</p>

<hr />

<h2>Step 2: The Detection Script</h2>

<p><code>.github/scripts/get-changed-functions.js</code> takes a list of changed files via <code>CHANGED_FILES</code> env var and returns the Firebase deploy targets:</p>

<pre><code>const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../..');
const functionMap = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../function-map.json'), 'utf8')
);

const changedFiles = (process.env.CHANGED_FILES || '')
  .split('\\n').map(f => f.trim()).filter(Boolean);

if (changedFiles.length === 0) {
  console.log('NONE');
  process.exit(0);
}

const routeFiles = Object.keys(functionMap);

// Build full import graph with dependency-cruiser
const depcruiseBin = path.join(REPO_ROOT, 'functions/node_modules/.bin/depcruise');
const output = execSync(
  \`"\${depcruiseBin}" --no-config --include-only "^functions/src" --output-type json \${routeFiles.join(' ')}\`,
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
// Build reverse map: changedFile → Set of route files that depend on it
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
  console.log([...affected].map(n => \`functions:\${n}\`).join(','));
}</code></pre>

<p>If dependency-cruiser fails for any reason, it falls back to deploying all functions — safe by default.</p>

<hr />

<h2>Step 3: The GitHub Actions Workflow</h2>

<p>Two jobs: <strong>preview</strong> on PRs, <strong>deploy</strong> on merge.</p>

<pre><code>name: Deploy Cloud Functions

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
      contents: read        # required for checkout
      pull-requests: write  # required to post PR comment
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'
          cache-dependency-path: functions/package-lock.json
      - name: Install dependencies
        run: npm ci
        working-directory: functions
      - name: Detect affected functions
        id: preview
        run: |
          CHANGED=$(git diff --name-only origin/${{ "{{" }} github.base_ref {{ "}}" }}...HEAD)
          DEPLOY=$(CHANGED_FILES="$CHANGED" node .github/scripts/get-changed-functions.js)
          echo "deploy_target=$DEPLOY" >> $GITHUB_OUTPUT
      - name: Post PR comment
        uses: actions/github-script@v7
        # ... posts/updates a comment listing affected functions

  deploy:
    name: Deploy to ${{ "{{" }} github.ref_name == 'master' && 'Production' || 'Staging' {{ "}}" }}
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    environment: ${{ "{{" }} github.ref_name == 'master' && 'production' || 'staging' {{ "}}" }}
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
          firebase deploy --only ${{ "{{" }} steps.changed.outputs.deploy_target {{ "}}" }} \\
            --project ${{ "{{" }} vars.FIREBASE_PROJECT {{ "}}" }} --non-interactive
        env:
          GOOGLE_APPLICATION_CREDENTIALS: ${{ "{{" }} runner.temp {{ "}}" }}/sa.json</code></pre>

<hr />

<h2>What We Hit in Production</h2>

<p>Getting the pipeline working took more than writing the workflow. Here are the real issues we ran into.</p>

<h3>1. <code>contents: read</code> permission missing</h3>

<p>The <code>preview</code> job sets <code>permissions: pull-requests: write</code>. In GitHub Actions, when you set <strong>any</strong> permission explicitly, all others default to <code>none</code>. So <code>actions/checkout</code> silently failed with "Repository not found" because the token had no <code>contents</code> permission.</p>

<p><strong>Fix:</strong> Always pair <code>pull-requests: write</code> with <code>contents: read</code>.</p>

<h3>2. <code>firebase: command not found</code></h3>

<p>The Ubuntu runner doesn't have the Firebase CLI pre-installed.</p>

<p><strong>Fix:</strong> Add <code>npm install -g firebase-tools</code> before the deploy step.</p>

<h3>3. Firebase Tools billing API false positive</h3>

<p>After upgrading to Node 24, deployments started failing with a 403 on the Cloud Billing API — even though billing was enabled on the project. This turned out to be a <a href="https://github.com/firebase/firebase-tools/issues/7584" target="_blank" rel="noopener noreferrer">known Firebase CLI bug</a> introduced in v13.15.4 where the CLI makes an unnecessary billing API check.</p>

<p><strong>Fix:</strong> Pin or upgrade firebase-tools past the affected range.</p>

<h3>4. IAM permission for 2nd gen Cloud Functions</h3>

<p>Deployment failed with:</p>

<pre><code>Caller is missing permission 'iam.serviceaccounts.actAs' on service account
&lt;project-number&gt;-compute@developer.gserviceaccount.com</code></pre>

<p>For <strong>2nd gen</strong> Cloud Functions, Firebase uses Cloud Build internally to build and push the container. The <strong>Cloud Build service account</strong> — not your CI/CD service account — needs <code>roles/iam.serviceAccountUser</code> on the compute default service account.</p>

<p><strong>Fix:</strong></p>

<pre><code>gcloud iam service-accounts add-iam-policy-binding \\
  &lt;project-number&gt;-compute@developer.gserviceaccount.com \\
  --member="serviceAccount:&lt;project-number&gt;@cloudbuild.gserviceaccount.com" \\
  --role="roles/iam.serviceAccountUser" \\
  --project=&lt;your-project&gt;</code></pre>

<h3>5. Container health check failing — OOM on Node 24</h3>

<p>After fixing IAM, the Cloud Run health check started failing:</p>

<pre><code>Memory limit of 256 MiB exceeded with 258 MiB used.</code></pre>

<p>Node 24 has a higher baseline memory footprint than Node 18. The root cause was that a shared <code>configurations.ts</code> file eagerly initialized three heavy SDK clients at <strong>module load time</strong>, regardless of whether the function needed them:</p>

<pre><code>// These ran on EVERY function import, even functions that never use them
const spanner = new Spanner({ projectId });
const spannerConnection = spanner.instance(instanceId).database(databaseId);
const pgPool = new Pool({ host, database, user, password, port });
const transcoderClient = new TranscoderServiceClient();</code></pre>

<p>Firebase CLI also loads the function module <strong>locally during deployment</strong> to discover exports — so these clients were being initialized on the CI runner too, causing <code>ECONNREFUSED</code> errors in deploy logs.</p>

<p><strong>Fix:</strong> Lazy initialization using ES getter syntax:</p>

<pre><code>let _spannerConnection: any;
const getSpannerConnection = () => {
  if (!_spannerConnection) {
    const spanner = new Spanner({ projectId });
    _spannerConnection = spanner.instance(instanceId).database(databaseId);
  }
  return _spannerConnection;
};

let _pgPool: Pool | undefined;
const getPgPool = () => {
  if (!_pgPool) _pgPool = new Pool({ ... });
  return _pgPool;
};

export default () => ({
  database: {
    spanner: { get connection() { return getSpannerConnection(); } },
    postgres: { get connection() { return getPgPool(); } },
  },
});</code></pre>

<p>A function that only needs VPC config now pays zero cost for Spanner, Postgres, or Transcoder at startup.</p>

<h3>6. Skipping CI on shared dependency changes</h3>

<p>Changing a shared file like <code>configurations.ts</code> triggers a redeploy of every function that imports it — potentially 40+. For infrastructure-only changes where you don't want a mass redeploy, include <code>[skip ci]</code> in the commit message and <strong>squash merge</strong> the PR. GitHub Actions respects this flag on the merge commit.</p>

<hr />

<h2>The Result</h2>

<p>The PR comment now looks like this when you touch a single route file:</p>

<pre><code>☁️ Cloud Functions Deployment Preview
🧪 Staging — merging this PR will deploy:
- app-admin-live-event</code></pre>

<p>And when you change a shared utility used by multiple functions, it correctly lists all of them. Deploy times dropped from ~15 minutes (all functions) to under 3 minutes for a typical single-function change.</p>

<hr />

<h2>Key Takeaways</h2>

<ul>
<li><strong>dependency-cruiser</strong> gives you a precise, statically-derived import graph — no guessing, no glob patterns</li>
<li><strong>2nd gen Cloud Functions</strong> have more IAM setup requirements than 1st gen — budget time for the Cloud Build SA permissions</li>
<li><strong>Eager SDK initialization</strong> in shared config modules is a silent memory tax — every function pays for clients it may never use</li>
<li><strong>ES getters</strong> are the cleanest way to make config lazy without changing how callers access it</li>
<li>When merging infrastructure changes to shared files, use <code>[skip ci]</code> + squash merge to avoid triggering mass redeployments</li>
</ul>

          ` }} />
        </article>

        <div className="max-w-3xl mx-auto px-6">
          <Footer />
        </div>
      </div>
    </>
  );
};

export default Article;
