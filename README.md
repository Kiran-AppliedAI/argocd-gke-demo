# ArgoCD + GKE Demo

This repo gives you a complete demo for the two pipeline scenarios shown in your screenshots:

- `clientfacing-ui`: frontend app with a manual ArgoCD sync policy
- `inventory-api`: backend API with automated ArgoCD sync enabled

It includes:

- Real demo app code
- Dockerfiles for both apps
- Kubernetes manifests with Kustomize overlays
- ArgoCD `Application` manifests
- GitHub Actions workflow for image build and manifest updates
- A runbook with `gcloud`, `kubectl`, and image build commands
- A small helper script to inject your project-specific values

## Repo Layout

```text
argocd-gke-demo/
├── apps/
│   ├── clientfacing-ui/
│   └── inventory-api/
├── argocd/
│   └── applications/
├── docs/
│   └── gke-argocd-demo-runbook.md
├── k8s/
│   ├── clientfacing-ui/
│   └── inventory-api/
└── scripts/
    └── configure-demo.sh
```

## Demo Behavior

### `clientfacing-ui`

- Small Node server that serves a static UI
- Proxies `/api/inventory` to the backend service inside the cluster
- Exposed with a `LoadBalancer` service for easy demo access

### `inventory-api`

- Small Node API that returns JSON inventory data
- Includes health checks and resource requests/limits
- Exposed as an internal `ClusterIP` service

## ArgoCD Setup Mapping

### CR-1: UI app pipeline

- Path: `k8s/clientfacing-ui/overlays/production`
- ArgoCD app manifest: `argocd/applications/clientfacing-ui.yaml`
- Sync policy: manual

### CR-2: API service pipeline

- Path: `k8s/inventory-api/overlays/production`
- ArgoCD app manifest: `argocd/applications/inventory-api.yaml`
- Sync policy: automated with prune and self-heal

## Quick Start

1. Create your GKE cluster using the commands in `docs/gke-argocd-demo-runbook.md`.
2. Build and push the two images to Artifact Registry.
3. Run `scripts/configure-demo.sh` to inject your repo URL and image paths.
4. Push this repo to GitHub.
5. Install ArgoCD on the cluster.
6. Apply the ArgoCD `Application` manifests.

For the GitHub-backed flow, also read `docs/github-setup.md`.

## Default Demo Values

The repo is pre-filled with these defaults:

- Git repo: `https://github.com/Kiran-AppliedAI/argocd-gke-demo.git`
- UI image: `us-central1-docker.pkg.dev/aaic-opsrabbit-demo/argocd-demo/clientfacing-ui`
- API image: `us-central1-docker.pkg.dev/aaic-opsrabbit-demo/argocd-demo/inventory-api`
- Initial image tag: `bootstrap`

If you want to change any of them later, use `scripts/configure-demo.sh`.
