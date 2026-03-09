# Chrome Web Store - Privacy Practices Justifications

## Single Purpose Description

QuickVideoRecord is a screen recording tool that captures your Chrome window with microphone audio, saves recordings locally, and optionally integrates with Jira for attaching recordings to issues.

---

## Permission Justifications

### desktopCapture

**Used:** Yes - `chrome.desktopCapture.chooseDesktopMedia()` in `src/pages/background/index.ts`

**Justification:** This permission is required to present the native screen/window picker dialog so the user can select which screen or window to record. This is the core functionality of the extension - without it, users cannot initiate a recording.

---

### downloads

**Used:** Yes - `chrome.downloads.download()` and `chrome.downloads.show()` in `src/pages/recorder/Recorder.tsx` and `src/pages/recordings/Recordings.tsx`

**Justification:** This permission is required to save recorded video files (WebM format) to the user's local file system. After a recording session ends, the extension uses the downloads API to let users save their recordings. It is also used to reveal downloaded files in the system file manager.

---

### storage

**Used:** Yes - `chrome.storage.local` used extensively across 20+ files

**Justification:** This permission is required to persist user settings, recording metadata, transcription results, and Jira authentication tokens locally within the extension. All data is stored locally on the user's device using `chrome.storage.local` - no data is synced or sent externally without user action.

---

### sidePanel

**Used:** Yes - `chrome.sidePanel.open()` in `src/pages/background/index.ts`

**Justification:** This permission is required to open the extension's side panel interface when the user clicks the extension icon. The side panel serves as the primary UI for managing recordings, viewing transcriptions, and accessing settings.

---

### identity

**Used:** Yes - `chrome.identity.launchWebAuthFlow()` and `chrome.identity.getRedirectURL()` in `src/pages/background/index.ts`, `src/utils/jiraAuth.ts`

**Justification:** This permission is required for the optional Jira OAuth authentication flow. Uses `launchWebAuthFlow()` to authenticate with Atlassian so users can attach recordings to Jira issues. This flow is user-initiated and optional. The extension works fully without authentication.

---

### offscreen

**Used:** Yes - `chrome.offscreen.createDocument()` in `src/pages/background/index.ts`

**Justification:** This permission is required to create an offscreen document that runs Web Workers for video transcription processing. In Manifest V3, service workers cannot run long-lived tasks or use certain Web APIs. The offscreen document provides a DOM context where transcription can run without being terminated by the service worker lifecycle.

---

## Host Permission Justifications

### `https://auth.atlassian.com/*` and `https://api.atlassian.com/*`

**Justification:** Required for the optional Jira integration. The extension makes requests to Atlassian's OAuth authorization server for authentication and to the Jira REST API for fetching projects and creating issue attachments. Only used when the user explicitly connects their Jira account.

---

## Remote Code

**This extension does not use remote code.** All JavaScript/TypeScript is bundled at build time using Vite. There are no dynamically loaded scripts, no `eval()` calls, no `Function()` constructors, and no external script tags. The `wasm-unsafe-eval` CSP directive is required for the local WebAssembly-based transcription model (`@xenova/transformers`), which is bundled with the extension.

---

## Removed Permissions (Not Needed)

| Permission | Reason for Removal |
|---|---|
| `activeTab` | Not used anywhere in the codebase. The extension uses `chrome.tabs.create()` which does not require this permission. |
| `tabCapture` | Not used anywhere in the codebase. The extension uses `navigator.mediaDevices.getDisplayMedia()` for recording, which does not require this permission. |
| `content_scripts` | The content script was an empty placeholder with no functionality. Removed from manifest. |
| `host_permissions: <all_urls>` | Scoped down to only the 2 Atlassian domains actually needed. |

---

## Checklist

- [x] Permission justifications written
- [x] Host permission justifications written
- [x] Single purpose description written
- [x] Remote code justification written
- [x] Unused permissions removed (`activeTab`, `tabCapture`)
- [x] `host_permissions` scoped to specific domains
- [x] Empty content script removed from manifest
- [ ] At least one screenshot or video required (upload manually)
- [ ] Icon image required (upload manually)
