#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
CONFIG_FILE="${CONFIG_FILE:-${SERVER_DIR}/deploy/config.local.env}"

if [[ ! -f "${CONFIG_FILE}" ]]; then
  echo "Missing config: ${CONFIG_FILE}" >&2
  echo "Copy deploy/config.example.env to deploy/config.local.env and edit it." >&2
  exit 1
fi

set -a
source "${CONFIG_FILE}"
set +a

required_config=(
  GCP_PROJECT_ID
  GCP_REGION
  CLOUD_RUN_SERVICE
  RUNTIME_SERVICE_ACCOUNT
  CHROME_EXTENSION_ID
  JIRA_CLIENT_ID
  JIRA_CLIENT_SECRET
)

for config_name in "${required_config[@]}"; do
  if [[ -z "${!config_name:-}" ]]; then
    echo "Missing ${config_name} in ${CONFIG_FILE}" >&2
    exit 1
  fi
done

RUNTIME_SERVICE_ACCOUNT_EMAIL="${RUNTIME_SERVICE_ACCOUNT}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"
