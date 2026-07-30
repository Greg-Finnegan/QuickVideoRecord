#!/usr/bin/env bash

set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"

read -r -p "Atlassian Jira client ID: " jira_client_id
read -r -s -p "Atlassian Jira client secret: " jira_client_secret
echo

if [[ -z "${jira_client_id}" || -z "${jira_client_secret}" ]]; then
  echo "Client ID and client secret are required." >&2
  exit 1
fi

printf '%s' "${jira_client_id}" |
  gcloud secrets versions add "${JIRA_CLIENT_ID}" --data-file=-
printf '%s' "${jira_client_secret}" |
  gcloud secrets versions add "${JIRA_CLIENT_SECRET}" --data-file=-

unset jira_client_id jira_client_secret
echo "Secret versions added."
