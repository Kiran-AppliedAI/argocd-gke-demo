# GitHub Setup For ArgoCD Demo

This demo works best when:

- GitHub stores your Kubernetes and ArgoCD manifests
- GitHub Actions builds the demo images
- GitHub Actions updates the manifest image tags in Git
- ArgoCD detects the Git change and syncs the cluster

That gives you a real GitOps flow instead of a local-only deployment.

## 1. Create A GitHub Repo

Create a repository such as:

```text
https://github.com/Kiran-AppliedAI/argocd-gke-demo
```

Then push the contents of this local folder into that repository.

## 2. Configure The Repo For Your Environment

From the local `argocd-gke-demo` directory:

```bash
./scripts/configure-demo.sh \
  --repo-url "https://github.com/Kiran-AppliedAI/argocd-gke-demo.git" \
  --ui-image "us-central1-docker.pkg.dev/aaic-opsrabbit-demo/argocd-demo/clientfacing-ui" \
  --api-image "us-central1-docker.pkg.dev/aaic-opsrabbit-demo/argocd-demo/inventory-api" \
  --image-tag "bootstrap"
```

Why `bootstrap`?

- It gives ArgoCD valid manifest values before your first GitHub Actions build runs.
- After the workflow runs, GitHub Actions replaces `bootstrap` with a commit-based tag like `sha-abc1234`.

## 3. Add GitHub Actions Variables

In the GitHub repository, go to:

`Settings` -> `Secrets and variables` -> `Actions` -> `Variables`

Create these repository variables:

- `GCP_PROJECT_ID`: your Google Cloud project ID
- `GCP_REGION`: for example `us-central1`
- `GCP_ARTIFACT_REPO`: for example `argocd-demo`
- `GCP_WORKLOAD_IDENTITY_PROVIDER`: full provider resource name
- `GCP_SERVICE_ACCOUNT`: service account email used by the workflow

Example values:

```text
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1
GCP_ARTIFACT_REPO=argocd-demo
GCP_WORKLOAD_IDENTITY_PROVIDER=projects/123456789/locations/global/workloadIdentityPools/github/providers/github-provider
GCP_SERVICE_ACCOUNT=github-argocd-demo@your-project-id.iam.gserviceaccount.com
```

## 4. Configure GitHub Actions Authentication To GCP

The included workflow uses **Workload Identity Federation**, which is the preferred approach for GitHub Actions to authenticate to Google Cloud.

You need:

- a Workload Identity Pool
- a Workload Identity Provider that trusts GitHub
- a Google service account with the permissions needed for Cloud Build and Artifact Registry

Recommended service account roles for this demo:

- `roles/cloudbuild.builds.editor`
- `roles/artifactregistry.writer`
- `roles/storage.admin`

You may also choose to grant broader permissions temporarily for a demo, but the list above is the cleaner starting point.

## 5. Push To `main`

The workflow file is:

[build-and-update-images.yml](/Users/aaic/Documents/New project/argocd-gke-demo/.github/workflows/build-and-update-images.yml)

It triggers when code changes under:

- `apps/**`

What it does:

1. Authenticates GitHub Actions to Google Cloud
2. Builds and pushes both demo images to Artifact Registry
3. Updates the image tags in the Kubernetes manifests
4. Commits those manifest changes back to `main`

That final Git commit is what ArgoCD watches.

## 6. What ArgoCD Will Do

### `inventory-api`

- ArgoCD auto-sync is enabled
- When GitHub Actions updates the manifest tag, ArgoCD should deploy it automatically

### `clientfacing-ui`

- ArgoCD sync is manual
- When GitHub Actions updates the manifest tag, ArgoCD should show the app as `OutOfSync`
- You can then sync it manually in ArgoCD as part of the demo

## 7. Suggested Demo Flow

1. Push the initial repo to GitHub
2. Let GitHub Actions build images and update manifest tags
3. Apply the ArgoCD `Application` manifests to the cluster
4. Show `inventory-api` syncing automatically
5. Show `clientfacing-ui` waiting for manual sync
6. Make a tiny code change in either app and push again
7. Show GitHub Actions updating Git
8. Show ArgoCD reacting to the new commit
