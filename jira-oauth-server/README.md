# Jira OAuth Exchange Server

Small Cloud Run service that keeps the Atlassian OAuth client secret out of the
Chrome extension. It exchanges authorization codes and refresh tokens, returns
Atlassian's response unchanged, and does not store tokens or proxy Jira APIs.

## Local development

```bash
npm install
npm test
npm run build

JIRA_CLIENT_ID=... \
JIRA_CLIENT_SECRET=... \
JIRA_REDIRECT_URI=https://EXTENSION_ID.chromiumapp.org/oauth2 \
ALLOWED_EXTENSION_ORIGIN=chrome-extension://EXTENSION_ID \
npm start
```

The API accepts:

```json
{ "grant_type": "authorization_code", "code": "..." }
```

or:

```json
{ "grant_type": "refresh_token", "refresh_token": "..." }
```

at `POST /v1/oauth/token`. `GET /health` is available for health checks.

## Google Cloud Run deployment

1. Copy `deploy/config.example.env` to `deploy/config.local.env`.
2. Fill in the non-secret GCP and extension values.
3. Run `scripts/bootstrap-gcp.sh`.
4. Run `scripts/set-secrets.sh`.
5. Run `scripts/deploy.sh`.
6. Set `VITE_JIRA_OAUTH_SERVER_URL` to the printed Cloud Run URL when building
   the extension.

The deployment scripts require an authenticated `gcloud` CLI principal with
permission to enable APIs, create service accounts and secrets, and deploy Cloud
Run services. The runtime service account receives access only to the two OAuth
secrets.
