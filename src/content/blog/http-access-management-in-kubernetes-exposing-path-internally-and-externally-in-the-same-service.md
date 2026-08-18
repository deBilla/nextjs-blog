---
title: "HTTP Access management in Kubernetes — Exposing path internally and externally in the same service"
date: "2025-01-02"
preview: "Kubernetes (K8s) has become the de facto platform for container orchestration. Managing HTTP access in Kubernetes can be tricky when a…"
description: "Exposing some paths of a Kubernetes service publicly while keeping others internal, without splitting it into two separate services."
tags: ["kubernetes"]
mediumUrl: "https://medium.com/@billacode/http-access-management-in-kubernetes-exposing-path-internally-and-externally-in-the-same-service-2d024275fc48"
---
Kubernetes (K8s) has become the de facto platform for container orchestration. Managing HTTP access in Kubernetes can be tricky when a service needs to expose some paths to the external world while restricting others to internal access. In this article, we’ll walk through how to achieve this using Kubernetes-native resources.

![HTTP Access management in Kubernetes — Exposing path internally and externally in the same service — figure 1](./images/http-access-management-in-kubernetes-exposing-path-internally-and-externally-in-the-same-service/1.jpg)

## Problem Overview

Imagine a scenario where you have a single service that handles multiple HTTP paths:

- `/internal` — should only be accessible within the cluster.
- `/external` — should be exposed to the public.

You want both these paths to be served by the same backend service but with different accessibility requirements.

## Solution

Kubernetes makes it possible to manage such access control by combining Ingress resources with annotations, ingress controllers, and NetworkPolicies. Let’s break this down step-by-step.

### 1. Define Your Service

First, create a Kubernetes service that routes traffic to your backend application.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: example-service
  namespace: default
spec:
  selector:
    app: example-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
```

This service will route traffic to pods labeled `app: example-app` on port `8080`.

### 2. Use Ingress to Split Traffic

Next, define an Ingress resource to route traffic based on the HTTP path.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: example-ingress
  namespace: default
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: / # Use this annotation for path rewriting if necessary
spec:
  rules:
    - host: example.com
      http:
        paths:
          - path: /external
            pathType: Prefix
            backend:
              service:
                name: example-service
                port:
                  number: 80
          - path: /internal
            pathType: Prefix
            backend:
              service:
                name: example-service
                port:
                  number: 80
```

In this configuration:

- `/external` and `/internal` are routed to the same service.

### 3. Restrict Internal Access with NetworkPolicy

NetworkPolicies can restrict the accessibility of `/internal` to internal traffic.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-internal-access
  namespace: default
spec:
  podSelector:
    matchLabels:
      app: example-app
  ingress:
    - from:
        - podSelector: {}
      ports:
        - protocol: TCP
          port: 8080
```

This policy allows only traffic from within the cluster to access the `example-app` pods.

### 4. Use Ingress Annotations for External Access Control

Ingress annotations can be used to apply rules specifically for the `/external` path.

For example, with the NGINX ingress controller, you can enable authentication for the external path:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: example-ingress
  namespace: default
  annotations:
    nginx.ingress.kubernetes.io/auth-type: basic
    nginx.ingress.kubernetes.io/auth-secret: auth-secret
    nginx.ingress.kubernetes.io/auth-realm: "Authentication Required"
spec:
  rules:
    - host: example.com
      http:
        paths:
          - path: /external
            pathType: Prefix
            backend:
              service:
                name: example-service
                port:
                  number: 80
```

Here, `/external` requires HTTP basic authentication, while `/internal` does not.

## Test Your Configuration

Once deployed, verify the setup:

- Access `http://example.com/external` from outside the cluster — it should work with the configured authentication.
- Access `http://example.com/internal` from within the cluster — it should work without restrictions.
- Attempt to access `/internal` from outside the cluster — it should be blocked.

## Conclusion

By combining Kubernetes Ingress, NetworkPolicies, and annotations, you can manage HTTP access to paths within the same service. This approach is both flexible and scalable, making it ideal for real-world applications.

Happy Coding :P
