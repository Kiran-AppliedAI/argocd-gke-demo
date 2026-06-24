#!/usr/bin/env bash

set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

REPO_URL=""
UI_IMAGE=""
API_IMAGE=""
IMAGE_TAG=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --repo-url)
      REPO_URL="$2"
      shift 2
      ;;
    --ui-image)
      UI_IMAGE="$2"
      shift 2
      ;;
    --api-image)
      API_IMAGE="$2"
      shift 2
      ;;
    --image-tag)
      IMAGE_TAG="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

if [ -z "$REPO_URL" ] || [ -z "$UI_IMAGE" ] || [ -z "$API_IMAGE" ] || [ -z "$IMAGE_TAG" ]; then
  echo "Usage:"
  echo "  ./scripts/configure-demo.sh --repo-url <git-url> --ui-image <ui-image> --api-image <api-image> --image-tag <tag>"
  exit 1
fi

replace_in_file() {
  file="$1"
  search="$2"
  replace="$3"
  sed -i.bak "s|${search}|${replace}|g" "$file"
  rm -f "${file}.bak"
}

replace_in_file "${REPO_ROOT}/argocd/applications/clientfacing-ui.yaml" "__GIT_REPO_URL__" "$REPO_URL"
replace_in_file "${REPO_ROOT}/argocd/applications/inventory-api.yaml" "__GIT_REPO_URL__" "$REPO_URL"
replace_in_file "${REPO_ROOT}/k8s/clientfacing-ui/overlays/production/kustomization.yaml" "__CLIENTFACING_UI_IMAGE__" "$UI_IMAGE"
replace_in_file "${REPO_ROOT}/k8s/inventory-api/overlays/production/kustomization.yaml" "__INVENTORY_API_IMAGE__" "$API_IMAGE"
replace_in_file "${REPO_ROOT}/k8s/clientfacing-ui/overlays/production/kustomization.yaml" "__IMAGE_TAG__" "$IMAGE_TAG"
replace_in_file "${REPO_ROOT}/k8s/inventory-api/overlays/production/kustomization.yaml" "__IMAGE_TAG__" "$IMAGE_TAG"
replace_in_file "${REPO_ROOT}/k8s/inventory-api/base/deployment.yaml" "__IMAGE_TAG__" "$IMAGE_TAG"

echo "Demo configuration updated successfully."
