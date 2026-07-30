#!/usr/bin/env bash

set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"

gcloud run deploy "${CLOUD_RUN_SERVICE}" \
  --project="${GCP_PROJECT_ID}" \
  --region="${GCP_REGION}" \
  --source="${SERVER_DIR}" \
  --allow-unauthenticated \
  --service-account="${RUNTIME_SERVICE_ACCOUNT_EMAIL}" \
  --set-secrets="JIRA_CLIENT_ID=${JIRA_CLIENT_ID}:latest,JIRA_CLIENT_SECRET=${JIRA_CLIENT_SECRET}:latest" \
  --set-env-vars="JIRA_REDIRECT_URI=https://${CHROME_EXTENSION_ID}.chromiumapp.org/oauth2,ALLOWED_EXTENSION_ORIGIN=chrome-extension://${CHROME_EXTENSION_ID}" \
  --quiet

service_url="$(
  gcloud run services describe "${CLOUD_RUN_SERVICE}" \
    --project="${GCP_PROJECT_ID}" \
    --region="${GCP_REGION}" \
    --format='value(status.url)'
)"

echo "Service URL: ${service_url}"
echo "Extension build setting: VITE_JIRA_OAUTH_SERVER_URL=${service_url}"
echo "Atlassian callback URL: https://${CHROME_EXTENSION_ID}.chromiumapp.org/oauth2"
