#!/usr/bin/env bash

set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"

gcloud config set project "${GCP_PROJECT_ID}"
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com

if ! gcloud iam service-accounts describe "${RUNTIME_SERVICE_ACCOUNT_EMAIL}" >/dev/null 2>&1; then
  gcloud iam service-accounts create "${RUNTIME_SERVICE_ACCOUNT}" \
    --display-name="Jira OAuth Cloud Run runtime"
fi

for secret_name in "${JIRA_CLIENT_ID}" "${JIRA_CLIENT_SECRET}"; do
  if ! gcloud secrets describe "${secret_name}" >/dev/null 2>&1; then
    gcloud secrets create "${secret_name}" --replication-policy=automatic
  fi
  gcloud secrets add-iam-policy-binding "${secret_name}" \
    --member="serviceAccount:${RUNTIME_SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/secretmanager.secretAccessor" >/dev/null
done

echo "GCP resources are ready. Run scripts/set-secrets.sh next."
