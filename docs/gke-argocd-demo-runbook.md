# GKE + ArgoCD Demo Runbook

This runbook uses a **small Standard GKE cluster** because it is predictable for demos and matches the one-node setup you described.

## 1. Set Variables

```bash
export PROJECT_ID="aaic-opsrabbit-demo"
export REGION="us-central1"
export CLUSTER_NAME="argocd-demo"
export AR_REPO="argocd-demo"
export IMAGE_TAG="v1"
export GIT_REPO_URL="https://github.com/Kiran-AppliedAI/argocd-gke-demo.git"
```

## 2. Enable Required APIs

```bash
gcloud services enable \
  container.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  --project "${PROJECT_ID}"
```

## 3. Create the GKE Cluster

```bash
gcloud container clusters create "${CLUSTER_NAME}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --release-channel regular \
  --machine-type e2-medium \
  --num-nodes 1 \
  --disk-type pd-balanced \
  --disk-size 30 \
  --enable-ip-alias
```

If you want the simplest possible cluster creation flow instead, you can use Autopilot:

```bash
gcloud container clusters create-auto "${CLUSTER_NAME}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}"
```

## 4. Fetch Cluster Credentials

```bash
gcloud container clusters get-credentials "${CLUSTER_NAME}" \
  --region "${REGION}" \
  --project "${PROJECT_ID}"
```

## 5. Create Artifact Registry Repo

```bash
gcloud artifacts repositories create "${AR_REPO}" \
  --project "${PROJECT_ID}" \
  --repository-format docker \
  --location "${REGION}" \
  --description "Docker repository for ArgoCD GKE demo"
```

## 6. Build and Push the Demo Images

Run these commands from the `argocd-gke-demo` directory:

```bash
gcloud builds submit apps/clientfacing-ui \
  --project "${PROJECT_ID}" \
  --tag "${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/clientfacing-ui:${IMAGE_TAG}"
```

```bash
gcloud builds submit apps/inventory-api \
  --project "${PROJECT_ID}" \
  --tag "${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/inventory-api:${IMAGE_TAG}"
```

## 7. Configure Repo Placeholders

```bash
chmod +x scripts/configure-demo.sh
./scripts/configure-demo.sh \
  --repo-url "${GIT_REPO_URL}" \
  --ui-image "${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/clientfacing-ui" \
  --api-image "${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/inventory-api" \
  --image-tag "${IMAGE_TAG}"
```

## 8. Push the Repo to GitHub

Your ArgoCD applications point to Git, so the rendered manifests must be available in the repo ArgoCD can access.

Use the GitHub setup guide here:

- `docs/github-setup.md`

After your first push to `main`, the included GitHub Actions workflow can build images and update image tags in Git automatically.

## 9. Install ArgoCD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

Wait for ArgoCD to become healthy:

```bash
kubectl get pods -n argocd
```

## 10. Access ArgoCD

For a quick demo session, port-forward the ArgoCD server:

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Get the initial admin password:

```bash
kubectl get secret argocd-initial-admin-secret -n argocd \
  -o jsonpath="{.data.password}" | base64 --decode && echo
```

Then open:

- URL: `https://localhost:8080`
- Username: `admin`

## 11. Create the ArgoCD Applications

```bash
kubectl apply -f argocd/applications/inventory-api.yaml
kubectl apply -f argocd/applications/clientfacing-ui.yaml
```

Expected behavior:

- `inventory-api` syncs automatically
- `clientfacing-ui` appears in ArgoCD and waits for manual sync

## 12. Verify the Deployment

Check services:

```bash
kubectl get svc -n production
```

Get the UI external IP:

```bash
kubectl get svc clientfacing-ui -n production
```

Check ArgoCD app status:

```bash
kubectl get applications -n argocd
```

## Demo Storyline

### CR-1 demo

- Show `clientfacing-ui` application in ArgoCD
- Point out it is configured for manual sync
- Sync it from the UI and show it becoming healthy

### CR-2 demo

- Change the `inventory-api` image tag in Git
- Push the change
- Show ArgoCD auto-sync picking it up automatically

For a more realistic demo, let GitHub Actions make that Git change by pushing a small app code update to `main`.
