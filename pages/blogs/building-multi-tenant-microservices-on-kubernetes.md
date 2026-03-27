# Building a Multi-Tenant E-Commerce Platform on Kubernetes with Linkerd, OpenTelemetry, and Helm

*A hands-on guide to building production-grade microservices with namespace-level tenant isolation, mTLS, observability, and a React dashboard — all running locally on kind.*

---

## What We're Building

Imagine you're building **ShopHost** — a SaaS e-commerce platform where multiple businesses (tenants) run their online stores. Each tenant needs:

- Their own isolated set of services
- Encrypted service-to-service communication
- No cross-tenant data leaks — even if a pod is compromised
- Full observability per tenant

By the end of this guide, you'll have:

```
Namespace: tenant-acme              Namespace: tenant-fresh
┌──────────────────────┐           ┌──────────────────────┐
│  cart-service    ←─mTLS──→       │  cart-service         │
│  product-service     │    ✗      │  product-service      │
│  customer-service    │  DENIED   │  customer-service     │
│  order-service       │           │  order-service        │
│  reviews-service     │           │  reviews-service      │
│  rabbitmq            │           │  rabbitmq             │
│  dashboard           │           │  dashboard            │
└──────────────────────┘           └──────────────────────┘
         ↕ allowed                          ↕ allowed
    (same namespace only)             (same namespace only)
```

**Tech stack**: Node.js, Express, TypeScript, MongoDB, RabbitMQ, Helm, Linkerd, OpenTelemetry, Prometheus, Grafana, React.

---

## Part 1: The Microservices

Our e-commerce backend has 5 services:

| Service | Port | Responsibility |
|---------|------|---------------|
| **Product Service** | 3006 | Product catalog, inventory management |
| **Customer Service** | 3004 | Customer CRUD |
| **Cart Service** | 3003 | Shopping carts, publishes events to RabbitMQ |
| **Order Service** | 3005 | Order management |
| **Product Reviews** | 3007 | Ratings and reviews |

Every service follows the same layered architecture:

```
src/
├── tracing.ts          # OpenTelemetry (loaded first)
├── app.ts              # Express setup, MongoDB connection
├── middleware/
│   └── tenantMiddleware.ts  # X-Tenant-Id extraction
├── models/             # Mongoose schemas
├── repositories/       # Data access layer
├── controllers/        # Business logic
└── routes/             # HTTP endpoints
```

### The Tenant Middleware

Every request (except `/health`) must include an `X-Tenant-Id` header:

```typescript
// src/middleware/tenantMiddleware.ts
export const tenantMiddleware = (req, res, next) => {
  if (req.path === "/health") return next();
  const tenantId = req.headers["x-tenant-id"];
  if (!tenantId) {
    return res.status(400).json({ error: "X-Tenant-Id header is required" });
  }
  req.tenantId = tenantId;
  next();
};
```

All database queries are scoped by `tenantId`:

```typescript
// Repository pattern — every query filters by tenant
viewAll = async (tenantId: string) => {
  return await Product.find({ tenantId });
};

viewById = async (id: ObjectId, tenantId: string) => {
  return await Product.findOne({ _id: id, tenantId });
};
```

This gives us **database-level isolation** — Tenant A can never see Tenant B's data, even on a shared MongoDB instance.

### Event-Driven Communication

The Cart Service publishes events to RabbitMQ when items are added. The Product Service consumes these events to update stock:

```
Cart Service → RabbitMQ (cart_exchange, fanout) → Product Service
```

### Health Endpoints

Every service exposes a dedicated `/health` endpoint that doesn't hit the database — critical for Kubernetes liveness/readiness probes:

```typescript
app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
app.use(tenantMiddleware);  // Applied after health, so probes don't need headers
app.use(router);
```

---

## Part 2: The Helm Chart

Instead of managing individual YAML files per service, we have a single Helm chart at `helm/ecommerce/` that deploys everything.

### Chart Structure

```
helm/ecommerce/
├── Chart.yaml
├── values.yaml                    # All configuration in one place
└── templates/
    ├── _helpers.tpl               # Shared template functions
    ├── cart-service-deployment.yaml
    ├── cart-service-svc.yaml
    ├── customer-service-deployment.yaml
    ├── customer-service-svc.yaml
    ├── order-service-deployment.yaml
    ├── order-service-svc.yaml
    ├── product-service-deployment.yaml
    ├── product-service-svc.yaml
    ├── product-reviews-service-deployment.yaml
    ├── product-reviews-service-svc.yaml
    ├── dashboard-deployment.yaml
    ├── dashboard-svc.yaml
    ├── rabbitmq-statefulset.yaml
    ├── rabbitmq-svc.yaml
    ├── configmap.yaml
    ├── secret.yaml
    ├── ingress.yaml
    ├── servicemonitor.yaml        # Prometheus integration
    ├── linkerd-auth.yaml          # mTLS policies
    └── network-policy.yaml        # Network isolation
```

### Why One Chart for Multi-Tenancy?

The chart uses `{{ .Release.Name }}` everywhere. Installing it twice with different names in different namespaces creates fully independent stacks:

```bash
# Tenant 1: Acme Electronics
helm install acme ./helm/ecommerce -n tenant-acme

# Tenant 2: Fresh Foods
helm install fresh ./helm/ecommerce -n tenant-fresh
```

Result: `acme-ecommerce-product-service` in `tenant-acme` and `fresh-ecommerce-product-service` in `tenant-fresh` — zero naming conflicts.

### Security Contexts

Every container runs as non-root:

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  allowPrivilegeEscalation: false
```

---

## Part 3: OpenTelemetry + Prometheus + Grafana

### Auto-Instrumentation

Every service loads OpenTelemetry **before** any other imports — this patches HTTP, Express, and Mongoose automatically:

```typescript
// src/tracing.ts — imported as first line of app.ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";

const sdk = new NodeSDK({
  metricReader: new PrometheusExporter({ port: 9464 }),
  instrumentations: [getNodeAutoInstrumentations()],
  serviceName: process.env.OTEL_SERVICE_NAME || "unknown-service",
});

sdk.start();
```

Each service exposes Prometheus metrics on port 9464 at `/metrics`:

```
# HELP http_server_duration Measures the duration of inbound HTTP requests.
# TYPE http_server_duration histogram
http_server_duration_bucket{http_method="GET",http_route="/:reviewId?",le="5"} 16
http_server_duration_bucket{http_method="GET",http_route="/:reviewId?",le="10"} 38
```

### ServiceMonitors

A single Helm template creates a Prometheus `ServiceMonitor` for each service:

```yaml
{{- $services := list "cart-service" "customer-service" "order-service"
                       "product-service" "product-reviews-service" }}
{{- range $services }}
---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: {{ include "ecommerce.fullname" $ }}-{{ . }}
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: {{ . }}
  endpoints:
    - port: metrics
      interval: 15s
      path: /metrics
{{- end }}
```

### Installing the Stack

```bash
./scripts/install-monitoring.sh
# Prometheus: kubectl port-forward -n monitoring svc/kube-prometheus-prometheus 9090:9090
# Grafana:    kubectl port-forward -n monitoring svc/kube-prometheus-grafana 3000:80
```

---

## Part 4: Linkerd Service Mesh

### Why Linkerd?

For multi-tenancy, Linkerd provides:

1. **mTLS everywhere** — all service-to-service traffic is encrypted and authenticated
2. **Identity-based authorization** — only pods from the same namespace can communicate
3. **Traffic observability** — per-service success rates, latency, and throughput
4. **Zero code changes** — it's a sidecar proxy, transparent to your application

### Installation

```bash
./scripts/install-linkerd.sh
```

This installs the CLI, CRDs, control plane, and Viz extension (dashboard + tap + metrics).

### Sidecar Injection

The Helm chart conditionally adds the Linkerd injection annotation:

```yaml
template:
  metadata:
    {{- if .Values.linkerd.enabled }}
    annotations:
      linkerd.io/inject: enabled
    {{- end }}
```

After deployment, every pod runs 2 containers — the app + the Linkerd proxy:

```
NAME                                    READY   STATUS
acme-ecommerce-cart-service-xxx         2/2     Running
acme-ecommerce-product-service-xxx      2/2     Running
```

### Authorization Policies

The `linkerd-auth.yaml` template creates `Server` + `AuthorizationPolicy` + `MeshTLSAuthentication` resources that restrict traffic to pods within the same namespace:

```yaml
apiVersion: policy.linkerd.io/v1alpha1
kind: MeshTLSAuthentication
metadata:
  name: same-namespace
spec:
  identities:
    - "*.tenant-acme.serviceaccount.identity.linkerd.cluster.local"
```

This means a pod in `tenant-acme` can **never** call a service in `tenant-fresh` — the mesh denies it at the proxy level, even before it reaches your application.

### Mesh Stats

```bash
$ linkerd viz stat deploy -n tenant-acme

NAME                                MESHED   SUCCESS      RPS   LATENCY_P50
acme-ecommerce-cart-service            2/2   100.00%   1.2rps           1ms
acme-ecommerce-product-service         2/2   100.00%   1.1rps           1ms
acme-ecommerce-customer-service        2/2   100.00%   1.2rps           1ms
```

---

## Part 5: The React Dashboard

Each tenant gets their own ERP-style dashboard deployed as a containerized nginx service.

### Architecture

```
Browser → nginx (port 3010)
├── Serves React build at /
├── /api/tenant → returns tenant name (from env var)
├── /api/products/* → proxy to product-service
├── /api/customers/* → proxy to customer-service
├── /api/carts/* → proxy to cart-service
├── /api/orders/* → proxy to order-service
└── /api/reviews/* → proxy to product-reviews-service
```

The nginx config is a **template** — service hostnames are injected via environment variables at deploy time:

```nginx
location /api/products/ {
    set $backend "${PRODUCT_SERVICE_HOST}";
    rewrite ^/api/products/(.*) /$1 break;
    proxy_pass http://$backend;
}
```

The Helm deployment injects FQDNs:

```yaml
- name: PRODUCT_SERVICE_HOST
  value: {{ .Release.Name }}-ecommerce-product-service.{{ .Release.Namespace }}.svc.cluster.local
- name: TENANT_NAME
  value: {{ .Release.Name }}
```

### Dashboard Features

- **Sidebar navigation**: Dashboard, Products, Customers, Carts, Orders, Reviews
- **Stat cards**: click any to jump to that section's full data table
- **Guided workflow**: Create Product → Customer → Cart → Add Items → Order → Review
- **Detail panel**: click any row to see all fields
- **Tenant badge**: shows which tenant this dashboard serves (from Helm release name)

### Multi-Stage Docker Build

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 3010
```

---

## Part 6: Deploying Multi-Tenant

### One Script Does It All

```bash
./scripts/deploy-tenants.sh
```

This script:

1. Creates `tenant-acme` and `tenant-fresh` namespaces
2. Annotates them with `linkerd.io/inject=enabled`
3. Deploys MongoDB per tenant (Bitnami Helm chart)
4. Installs the ecommerce Helm chart per tenant with:
   - Linkerd injection enabled
   - Authorization policies enabled
   - Network policies enabled
5. Waits for all pods to be ready

### Verifying Isolation

```bash
./scripts/test-isolation.sh
```

Output:
```
Test 1: Create products in each tenant
  Creating 'Gaming Laptop' in Acme... ✓
  Creating 'Organic Apples' in Fresh Foods... ✓

Test 2: Verify data isolation
  PASS: Acme cannot see Fresh Foods' products
  PASS: Fresh Foods cannot see Acme's products

Test 3: Cross-namespace network call
  PASS: Cross-tenant call BLOCKED
```

### Three Layers of Isolation

| Layer | Mechanism | What it prevents |
|-------|-----------|-----------------|
| **Application** | `tenantId` filter on all DB queries | Data leaks from shared collections |
| **Mesh** | Linkerd AuthorizationPolicy | Cross-namespace API calls |
| **Network** | Kubernetes NetworkPolicy | Any cross-namespace TCP traffic |

---

## Running It Yourself

### Prerequisites

```bash
brew install kind helm kubectl
```

### Full Setup

```bash
# 1. Create cluster
kind create cluster --name ecommerce

# 2. Build images
docker build -t debilla/node-cart-service-test:latest ./cart-service
docker build -t debilla/node-customer-service-test:latest ./customer-service
docker build -t debilla/node-order-service-test:latest ./order-service
docker build -t debilla/node-product-service-test:latest ./product-service
docker build -t debilla/node-product-reviews-service-test:latest ./product-reviews-service
docker build -t debilla/ecommerce-dashboard:latest ./dashboard

# 3. Load into kind
kind load docker-image debilla/node-cart-service-test:latest \
  debilla/node-customer-service-test:latest \
  debilla/node-order-service-test:latest \
  debilla/node-product-service-test:latest \
  debilla/node-product-reviews-service-test:latest \
  debilla/ecommerce-dashboard:latest \
  --name ecommerce

# 4. Install Linkerd
./scripts/install-linkerd.sh

# 5. Deploy both tenants
./scripts/deploy-tenants.sh

# 6. Install monitoring
./scripts/install-monitoring.sh

# 7. Access dashboards
kubectl port-forward -n tenant-acme svc/acme-ecommerce-dashboard 8080:80
kubectl port-forward -n tenant-fresh svc/fresh-ecommerce-dashboard 8081:80
```

Open http://localhost:8080 (Acme) and http://localhost:8081 (Fresh) side by side.

---

## Key Takeaways

1. **Namespace-per-tenant** is the cleanest isolation model — each tenant gets a full independent stack with zero shared state.

2. **Linkerd makes multi-tenancy viable** without writing network security code — mTLS, authorization policies, and observability come free with a sidecar.

3. **Helm's release-name pattern** naturally supports multi-tenancy — same chart, different release names, different namespaces.

4. **OpenTelemetry auto-instrumentation** gives you production-grade metrics with 14 lines of code and zero changes to your business logic.

5. **Defense in depth** matters — we use application-level tenant filtering, mesh-level authorization, AND network policies. Any single layer failing doesn't compromise isolation.

---

## What's Next

- **Horizontal Pod Autoscaler** per tenant based on custom metrics
- **Istio comparison** — how would this look with Istio instead of Linkerd?
- **CI/CD pipeline** — GitOps with ArgoCD deploying tenant-specific overrides
- **Rate limiting** per tenant using Linkerd's HTTPLocalRateLimitPolicy

The full source code is available on [GitHub](https://github.com/deBilla/kubernetes-test-node-express).

---

*Built with Node.js, TypeScript, React, MongoDB, RabbitMQ, Kubernetes, Helm, Linkerd, OpenTelemetry, Prometheus, and Grafana. Running on kind.*
