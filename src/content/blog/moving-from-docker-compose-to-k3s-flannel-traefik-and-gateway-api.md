---
title: "Moving from Docker Compose to k3s: Flannel, Traefik and the Gateway API in simple terms"
date: "2026-10-11"
preview: "Hi Guys, I moved the Kithly backend from a Docker Compose setup on a home server to a single-node k3s cluster. This post explains what Flannel, Traefik and the Gateway API actually do, in plain words, and the one networking surprise that cost me eight minutes of downtime…"
description: "Moving a Go API from Docker Compose to single-node k3s, with Flannel, Traefik and the Gateway API explained in plain words, plus a 12-second cutover."
tags: ["kubernetes", "devops", "go"]
draft: false
---
Hi Guys, the Kithly backend (a Go API, a few queue workers and a video transcoder) has been running on a home server with Docker Compose for a while. Last week I moved it to **k3s**, a small Kubernetes. In this post I'll show where we started, why I picked k3s, and what the three pieces everyone mentions really do: **Flannel**, **Traefik** and the **Gateway API**. I'll keep it simple, use a few analogies, and finish with how the cutover went, including the part where I broke production for eight minutes.

All the code is open source at [deBilla/kithly-api](https://github.com/deBilla/kithly-api). The bits this post covers are in [`deploy/k3s`](https://github.com/deBilla/kithly-api/tree/main/deploy/k3s) (bootstrap and ServiceLB scripts), [`deploy/helm`](https://github.com/deBilla/kithly-api/tree/main/deploy/helm) (the chart) and [`docs/K8S_DEPLOYMENT.md`](https://github.com/deBilla/kithly-api/blob/main/docs/K8S_DEPLOYMENT.md).

## Where we started: one Compose file

The whole stack lived in one `docker-compose.yml`. Here's a trimmed version so you can see the shape of it:

```yaml
services:
  api:
    build: { context: ., args: { BINARY: api } }
    ports:
      - "80:3001"
    env_file: [.env]
    environment:
      - REDIS_HOST=redis

  worker:
    build: { context: ., args: { BINARY: worker } }
    env_file: [.env]

  transcoder-worker:
    build: { context: ., args: { BINARY: transcoder } }
    deploy:
      resources:
        limits: { cpus: "2", memory: 4G }

  bull-board-dashboard:
    build: { context: ., args: { BINARY: dashboard } }
    ports:
      - "3002:3002"

  redis:
    image: redis:7-alpine
```

Public traffic came in through a **Cloudflare Tunnel**. The `cloudflared` daemon on the server sent `api.example.com` to `localhost:80` and the dashboard to `localhost:3002`. TLS ended at Cloudflare, so the server only ever spoke plain HTTP on localhost.

Honestly, this worked. Compose is great. But a few things kept bothering me:

- **Images were built on the server.** Every deploy was SSH, `git pull`, `docker compose up --build`. The server is also where the transcoder burns CPU, so builds and real work fought each other.
- **No real rollback.** If a bad build went out, "rollback" meant checking out an older commit and building again.
- **No health-gated rollout.** Compose stops the old container and starts the new one. If the new one crashes on boot, you're down until you notice.
- **Redis wasn't persisted.** A restart lost whatever jobs were queued.
- **One worker.** Scaling meant copy-pasting service blocks.

None of these are Compose's fault. They're just the things Kubernetes was built for.

## Why k3s and not "real" Kubernetes

Full Kubernetes is a box of parts. You choose a container runtime, a network plugin, a DNS server, an ingress controller, a load balancer and a storage driver, and then you wire them together.

**k3s** is Kubernetes that ships as one binary with all of those already chosen for you:

- **containerd** to run containers
- **Flannel** for pod networking
- **CoreDNS** for in-cluster names
- **Traefik** as the reverse proxy at the edge
- **ServiceLB** to expose services on the host's ports
- **local-path** storage, so a volume is just a folder on the disk

For a single home server that's exactly what I want. It's still certified Kubernetes, so everything I learn here works on EKS or GKE later. I'd pick k3s over Docker Swarm every time now, because the skills carry over and Swarm's don't.

## Kubernetes in four words

Before we get to the networking, here's how the Compose ideas map across:

| Compose | Kubernetes | What it means |
|---|---|---|
| a `service` block | Deployment | "Keep N copies of this container running" |
| a running container | Pod | One running copy (one or more containers) |
| the service name as a hostname | Service | A stable name and IP in front of the pods |
| `ports: "80:3001"` | Gateway / LoadBalancer | How traffic gets in from outside |

The important one is the **Service**. Pods come and go, and every new pod gets a new IP. A Service is a fixed address that always points at whichever pods are currently healthy. When the API wants Redis, it asks for `kithly-redis` and doesn't care which pod answers.

## Flannel: giving every pod an address

Here's the problem Flannel solves. In Kubernetes **every pod gets its own IP address**, and every pod must be able to reach every other pod directly, even if they sit on different machines. Nobody sets that up for you. A plugin called a **CNI** (Container Network Interface) does it, and in k3s that plugin is Flannel.

Think of the cluster as an apartment complex:

- Each **node** (machine) is a building.
- Each **pod** is an apartment with its own number.
- **Flannel** is the postal system. It hands every building a block of apartment numbers and makes sure a letter addressed to apartment 10.42.1.7 reaches the right building, whichever building it was posted from.

In k3s the defaults look like this:

- **Pods** get addresses from `10.42.0.0/16`. Each node takes a `/24` slice of that.
- **Services** get virtual addresses from `10.43.0.0/16`. These aren't real interfaces. kube-proxy writes iptables rules that catch traffic to a Service IP and forward it to one of its pods.

Across machines, Flannel's default backend is **VXLAN**: it wraps a pod-to-pod packet inside a normal UDP packet, sends it to the other node, and unwraps it there. On my single node there's no other building, so most traffic just crosses a local bridge called `cni0`. The addresses still matter, though, and that's where I hit my first problem.

### The firewall gotcha

The server runs `ufw`. Out of the box, ufw saw traffic from `10.42.x.x` (a pod) going to CoreDNS and dropped it, because it wasn't on the allow list. The symptom wasn't "firewall blocked". The symptom was DNS failing silently inside every pod, so the API couldn't find `kithly-redis`.

The fix is to allow both ranges. This lives in the bootstrap script:

```bash
# Without these, ufw drops pod -> CoreDNS / ClusterIP traffic and DNS fails silently.
sudo ufw allow from 10.42.0.0/16 to any comment 'k3s pods'
sudo ufw allow from 10.43.0.0/16 to any comment 'k3s services'
```

There was a second DNS trap. The host's `/etc/resolv.conf` listed IPv6 link-local servers like `fe80::…%2`, and CoreDNS can't use zone-scoped addresses like that. So k3s gets its own clean file with a single upstream, like your router or `1.1.1.1`:

```bash
printf 'nameserver %s\n' "$UPSTREAM_DNS" | sudo tee /etc/rancher/k3s/resolv.conf
```

and `resolv-conf: /etc/rancher/k3s/resolv.conf` goes in the k3s config. If your pods can't resolve anything, check these two first.

## Traefik: the receptionist at the front door

Flannel moves packets between pods. But something has to stand at the edge, take an HTTP request for `api.example.com`, and decide which Service gets it. That's a **reverse proxy**, and in Kubernetes the one doing that job is often called an **ingress controller**.

Traefik is the one k3s bundles. Think of it as the receptionist in the lobby. Every visitor comes through the same door, says who they're here to see (the `Host` header and the path), and the receptionist walks them to the right office.

In Compose, the API published `80:3001` directly, so there was no receptionist at all. Port 80 *was* the API. That's fine for one service and gets messy the moment you want a second hostname on the same port.

Traefik needs a list of rules to work from. There are two ways to write that list in Kubernetes: the old **Ingress** resource, and the newer **Gateway API**. I went with the Gateway API.

## The Gateway API: three objects, three jobs

**Ingress** was Kubernetes' first attempt at HTTP routing. It's one object that holds everything: the hostname, the path, the backend, and the TLS settings. Anything beyond the basics (timeouts, header rewrites, traffic splitting) ended up in controller-specific annotations, so an Ingress written for nginx didn't work on Traefik.

The **Gateway API** is its replacement. It splits that one object into three, and each one has a clear owner:

- **GatewayClass**: *which kind of receptionist.* "We use Traefik." Usually set up once by whoever runs the cluster.
- **Gateway**: *the front door.* Which port, which protocol, and who is allowed to attach routes to it.
- **HTTPRoute**: *the directory on the wall.* "Visitors for `api.example.com` go to the `kithly-api` Service on port 3001." Owned by the app team.

The split matters even on a one-person project. My routes live in the app's Helm chart and ship through CI with the code. The door and the receptionist are cluster plumbing that I set up once.

### Turning it on in k3s

k3s's Traefik ships with the Gateway API provider turned off. You switch it on by dropping a `HelmChartConfig` into the k3s manifests folder, and k3s picks it up automatically:

```yaml
apiVersion: helm.cattle.io/v1
kind: HelmChartConfig
metadata:
  name: traefik
  namespace: kube-system
spec:
  valuesContent: |-
    providers:
      kubernetesGateway:
        enabled: true
    gateway:
      enabled: false
    gatewayClass:
      enabled: true
```

That gives me a `GatewayClass` called `traefik`. I turned off Traefik's default `Gateway` because I want the app's chart to own its own front door, next to its routes. One more thing: k3s already installs the Gateway API CRDs through its own `traefik-crd` chart. Don't install a second copy, or the two will fight over who owns them.

### The Gateway and the route

This is what the Helm chart renders. First the front door:

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: kithly
spec:
  gatewayClassName: traefik
  listeners:
    # Plain HTTP: TLS is terminated at Cloudflare and the tunnel connects over localhost.
    - name: http
      protocol: HTTP
      port: 8000
      allowedRoutes:
        namespaces:
          from: Same
```

Then the directory entry that hangs on it:

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: kithly-api
spec:
  parentRefs:
    - name: kithly
      sectionName: http
  hostnames:
    - api.example.com
    - api.example.org
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: kithly-api
          port: 3001
```

Notice the listener port is **8000**, not 80. That's because the port on a Traefik Gateway listener has to match a Traefik **entrypoint**, and Traefik's `web` entrypoint listens on 8000 inside its container. Host port 80 gets mapped to it further out. If you write `port: 80` here, the Gateway never becomes ready and nothing tells you why very loudly.

In the chart, adding a new hostname is now a two-line change in `values.yaml`:

```yaml
gateway:
  routes:
    api:
      service: api
      hostnames:
        - api.example.com
        - api.example.org
```

## ServiceLB, and how I broke production

So Traefik is listening on 8000 inside a pod. How does traffic arriving at the server's port 80 actually get there? In the cloud, a `LoadBalancer` Service would get a real cloud load balancer. On bare metal, k3s uses **ServiceLB**.

ServiceLB is simple. For every `LoadBalancer` Service, it runs a tiny pod on the node that claims the same port on the host using a **hostPort**. Traefik's Service asks for 80 and 443, so ServiceLB maps host :80 to Traefik. The dashboard Service asks for 3002, so host :3002 goes to the dashboard. That meant the Cloudflare tunnel config never had to change. It still sends traffic to `localhost:80` and `localhost:3002`, and whoever owns those ports gets it.

Here's the surprise. I assumed that while Compose still had port 80, ServiceLB would fail to bind it and wait. It doesn't bind anything. A hostPort is an **iptables DNAT rule**, not a socket. It rewrites packets before they ever reach Docker's listener. So the moment k3s started for the first time, with ServiceLB on by default, it quietly stole port 80 from the running Compose API and sent it to a Traefik with no routes yet. That was about eight minutes of API outage on the first bootstrap.

The fix was to keep ServiceLB **off from the very first boot** and turn it on only at cutover. k3s lets you do that with a node label, and the label has to be set at registration time through a config drop-in, because k3s re-applies node labels on every start:

```yaml
# /etc/rancher/k3s/config.yaml.d/50-servicelb.yaml
node-label:
  - svccontroller.k3s.cattle.io/enablelb=false
```

A small `servicelb.sh on|off` script flips both the live label and that file, so a reboot keeps whatever state I chose. It also refuses to turn on while Docker still listens on :80, so I can't repeat the mistake.

To check that the localhost-to-hostPort path works without touching port 80, the bootstrap starts a throwaway `traefik/whoami` pod with `hostPort: 18080`, curls `localhost:18080`, and deletes it. That's the exact path cloudflared will use, tested on a port nobody cares about.

## The full path of one request

Here's everything together, from a phone to a Go handler:

```text
phone
  -> Cloudflare (TLS ends here)
  -> Cloudflare Tunnel -> cloudflared on the server
  -> http://localhost:80
  -> ServiceLB hostPort (iptables DNAT)
  -> Traefik pod, "web" entrypoint :8000
  -> Gateway "kithly", listener "http"
  -> HTTPRoute matches Host: api.example.com
  -> Service kithly-api (ClusterIP, 10.43.x.x)
  -> kube-proxy picks a ready pod
  -> API pod (10.42.x.x) on :3001, over Flannel's cni0 bridge
```

Every arrow is one of the things we've talked about. If a request goes missing, you walk this list from the top.

## Deploying it: CI builds, Helm ships

The other half of the move was getting builds off the server. GitHub Actions now does this on every push to `main`:

1. `go vet` and `go test -race ./...`
2. `helm lint` and `helm template | kubeconform -strict` to catch broken YAML before it reaches the cluster
3. Build one image per binary and push it to GHCR, tagged with the commit SHA
4. Over SSH, run `helm upgrade --install --rollback-on-failure`

That last flag is the one I like most. If the new pods don't become ready within ten minutes, Helm rolls the release back on its own. Together with a rolling update that brings the new pod up before taking the old one down, a bad build no longer means downtime:

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    # Bring the new pod up before taking the old one down.
    maxSurge: 1
    maxUnavailable: 0
```

Two smaller tricks worth stealing:

- **A checksum of the secrets as a pod annotation.** Kubernetes doesn't restart pods when a Secret changes. Putting a hash of the secret contents on the pod template means a rotated secret changes the template, so the next deploy rolls every pod.
- **Keep the last 20 images in GHCR.** Then `helm rollback` can go back up to 19 deploys and the image is still there to pull.

Workers went from one to four with `replicas: 4`. Redis now uses AOF on a local-path volume, so queued jobs survive a restart.

## The cutover: about 12 seconds

Because the k3s stack had its own Redis, it could run next to Compose without the two sharing queues. The workers have no scheduled jobs, so nothing ran twice. The cutover was:

1. Check the k8s API through Traefik's NodePort with a `Host: api.example.com` header, before it has any public traffic.
2. Delete the old Compose deploy workflow, so a push can't bring Compose back and fight for the ports.
3. Let the Compose queue drain on the dashboard, then `docker compose down`.
4. `servicelb.sh on`, then `curl https://api.example.com/health`.

The gap between Compose letting go of the ports and ServiceLB taking them was about 12 seconds. The rollback plan was just as short: `servicelb.sh off`, then `docker start` the old containers, which I'd stopped rather than removed.

## Was it worth it?

For a single server, Kubernetes is more moving parts than Compose, and I won't pretend otherwise. But k3s makes most of those parts somebody else's problem, and what I got back is worth it: builds off the server, automatic rollback, zero-downtime deploys, persisted queues, and routing I can change with a pull request. If you want to copy the setup, start from [`deploy/k3s/bootstrap.sh`](https://github.com/deBilla/kithly-api/blob/main/deploy/k3s/bootstrap.sh) in the repo.

If you're doing the same move, my advice comes down to three things:

- **Allow `10.42.0.0/16` and `10.43.0.0/16` in your firewall** before you debug anything else.
- **Turn ServiceLB off from first boot** if anything else on the host already owns 80 or 443.
- **Use the Gateway API, not Ingress**, for new setups. The three-object split is easier to reason about, and it's where Kubernetes is going.

Next up I'll write about moving the database off Supabase into the same cluster, with nightly backups and a row-count-verified import.

Happy Coding ;)
