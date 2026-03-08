# Privacy Policy for JiraQuickVideoRecord

**Last updated:** March 8, 2026  
**Developer:** Greg

This Chrome extension (JiraQuickVideoRecord) integrates with Jira via Atlassian OAuth 2.0 authentication. We are committed to protecting your privacy.

## 1. No Cloud Data Collection or Storage
This extension **does not collect, store, transmit, share, or process** any personal data, user content, or sensitive information on servers or in the cloud controlled by the developer.

- Everything runs **locally** in your browser.
- Temporary OAuth authorization codes, access tokens, and refresh tokens (obtained from Atlassian) are handled entirely client-side.
- Tokens are stored **only** in Chrome's local storage or session storage on your device — never sent to the developer or any third party (except Atlassian's official auth and API endpoints as part of the standard OAuth 2.0 flow).

## 2. No Tracking, Analytics, or Telemetry
- No analytics tools, tracking pixels, error reporting that includes personal data, logging of user behavior, or any form of data collection is implemented.
- No third-party scripts, cookies, or beacons are used for tracking purposes.

## 3. Data Access and Permissions
- The extension requests **only the minimum** Chrome extension permissions and Atlassian OAuth scopes required for its functionality.
- It can only access your Jira data **after you explicitly authorize it** via Atlassian's official consent screen.
- All API interactions occur directly between your browser and Atlassian's servers — the developer has **no access** to your Jira account, issues, projects, or any other data.

## 4. Security Practices
- OAuth is implemented using Chrome's secure `chrome.identity.launchWebAuthFlow` method.
- Tokens remain scoped to the extension and are protected by Chrome's storage security model.
- No unnecessary network requests are made beyond what's required for Jira authentication and API usage.

## 5. Changes to This Policy
This policy may be updated occasionally. Changes will be reflected in this file in the public repository, and — when significant — noted in the extension's description or update notes.

## 6. Contact
If you have questions about this privacy policy or the extension, feel free to reach out:  
[gafinnegan@gmail.com]  

Thank you for using Jira Quick Video Record!