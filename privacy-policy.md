# Privacy Policy for JiraQuickVideoRecord

**Last updated:** October 11, 2026  
**Developer:** Greg

This Chrome extension (JiraQuickVideoRecord) integrates with Jira via Atlassian [OAuth 2.0 (3LO)](https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/) authentication. We are committed to protecting your privacy.

## 1. No Cloud Data Collection or Storage
This extension **does not collect, store, transmit, share, or process** any personal data, user content, or sensitive information on servers or in the cloud controlled by the developer.

- Everything runs **locally** in your browser by default. The only exception is the optional AI provider feature in Section 4, which is off until you add your own API key.
- Temporary OAuth authorization codes and refresh tokens are sent to the extension's private OAuth exchange service solely to exchange them with Atlassian. The service does not persist them.
- Access and refresh tokens are stored **only** in Chrome's local storage on your device. Jira API traffic goes directly from the extension to Atlassian.

## 2. No Tracking, Analytics, or Telemetry
- No analytics tools, tracking pixels, error reporting that includes personal data, logging of user behavior, or any form of data collection is implemented.
- No third-party scripts, cookies, or beacons are used for tracking purposes.

## 3. Data Access and Permissions
- The extension requests **only the minimum** Chrome extension permissions and Atlassian OAuth scopes required for its functionality.
- It can only access your Jira data **after you explicitly authorize it** via Atlassian's official consent screen.
- Jira API interactions occur directly between your browser and Atlassian's servers. The private cloud exchange service handles only OAuth token exchanges and does not receive Jira issues, projects, recordings, or API requests.

## 4. Optional AI Provider Integration (Off by Default)
You can optionally connect your own AI provider account (OpenAI, Anthropic, Google Gemini, xAI Grok, Moonshot Kimi, or OpenRouter) to auto-generate recording titles and Jira ticket drafts.

- **This feature is off by default and does nothing until you choose a provider and enter your own API key** in Settings. Without a key, no transcript or recording data leaves your device.
- When enabled, after a recording is transcribed on your device, the **transcript text** and your **AI prompt** are sent directly from your browser to the provider you selected. Video and audio are never sent.
- Data goes straight to that provider; it does not pass through any server controlled by the developer. The provider's own privacy policy and terms apply to that data.
- Your API key is stored **only** in Chrome's local storage on your device and is sent only to the provider it belongs to.
- Chrome asks for your permission to reach a provider's API before the extension can contact it.
- You can turn the feature off at any time by setting the provider to "Off" or removing your key.

## 5. Security Practices
- OAuth is implemented using Chrome's secure `chrome.identity.launchWebAuthFlow` method.
- No Password Storage: Application uses OAuth 2.0 to access Atlassian products, meaning we never see, collect, or store Atlassian account passwords.
- Users that they can revoke app’s access at any time through their Atlassian Account / Connected Apps settings.
- No unnecessary network requests are made beyond what's required for Jira authentication and API usage, and the optional AI provider you configure.

## 6. Changes to This Policy
This policy may be updated occasionally. Changes will be reflected in this file in the public repository, and — when significant — noted in the extension's description or update notes.

## 7. Contact
If you have questions about this privacy policy or the extension, feel free to reach out:  
[gafinnegan@gmail.com]  

Thank you for using Jira Quick Video Recorder!
