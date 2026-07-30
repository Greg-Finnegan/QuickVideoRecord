# Privacy Policy for JiraQuickVideoRecord

**Last updated:** July 30, 2026  
**Developer:** Greg

This Chrome extension (JiraQuickVideoRecord) integrates with Jira via Atlassian [OAuth 2.0 (3LO)](https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/) authentication. We are committed to protecting your privacy.

## 1. No Cloud Data Collection or Storage
This extension **does not collect, store, transmit, share, or process** any personal data, user content, or sensitive information on servers or in the cloud controlled by the developer.

- Everything runs **locally** in your browser.
- Temporary OAuth authorization codes and refresh tokens are sent to the extension's private OAuth exchange service solely to exchange them with Atlassian. The service does not persist them.
- Access and refresh tokens are stored **only** in Chrome's local storage on your device. Jira API traffic goes directly from the extension to Atlassian.

## 2. No Tracking, Analytics, or Telemetry
- No analytics tools, tracking pixels, error reporting that includes personal data, logging of user behavior, or any form of data collection is implemented.
- No third-party scripts, cookies, or beacons are used for tracking purposes.

## 3. Data Access and Permissions
- The extension requests **only the minimum** Chrome extension permissions and Atlassian OAuth scopes required for its functionality.
- It can only access your Jira data **after you explicitly authorize it** via Atlassian's official consent screen.
- Jira API interactions occur directly between your browser and Atlassian's servers. The private cloud exchange service handles only OAuth token exchanges and does not receive Jira issues, projects, recordings, or API requests.

## 4. Security Practices
- OAuth is implemented using Chrome's secure `chrome.identity.launchWebAuthFlow` method.
- No Password Storage: Application uses OAuth 2.0 to access Atlassian products, meaning we never see, collect, or store Atlassian account passwords.
- Users that they can revoke app’s access at any time through their Atlassian Account / Connected Apps settings.
- No unnecessary network requests are made beyond what's required for Jira authentication and API usage.

## 5. Changes to This Policy
This policy may be updated occasionally. Changes will be reflected in this file in the public repository, and — when significant — noted in the extension's description or update notes.

## 6. Contact
If you have questions about this privacy policy or the extension, feel free to reach out:  
[gafinnegan@gmail.com]  

Thank you for using Jira Quick Video Recorder!
