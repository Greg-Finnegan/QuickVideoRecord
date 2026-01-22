# QuickVideoRecord

**Screen recording with AI transcription and Jira integration**

Chrome extension that can record your screen, automatically transcribe with AI (on device - no API), and create Jira issues with smart descriptions—all in one place.

[![Chrome Version](https://img.shields.io/badge/chrome-116%2B-blue)](https://www.google.com/chrome/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.2.0-blue)](package.json)

## Why QuickVideoRecord?

Unlike basic screen recorders, QuickVideoRecord is built for professional workflows:

- **AI-Powered Transcription**: Automatic speech-to-text using Whisper AI model (locally)
- **Native Jira Integration**: Create issues directly from recordings with OAuth authentication
- **Built-in Management**: Organize, search, and review all your recordings in one place

Perfect for bug reports, feature demos, sprint reviews, and documentation.

---

## Quick Start

### 1. Install the Extension

**From Releases** (Users):
1. Download the latest release from the [releases page](https://github.com/yourusername/QuickVideoRecord/releases)
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the `dist_chrome` directory
5. The extension icon appears in your toolbar

**From Source** (Developers):
```bash
git clone https://github.com/yourusername/QuickVideoRecord.git
cd QuickVideoRecord
npm install --legacy-peer-deps
npm run dev
```
Then load the `dist_chrome` directory as an unpacked extension.

### 2. Make Your First Recording

1. Click the extension icon in your toolbar
2. Click "Start Recording"
3. Select what to share (screen, window, or tab)
4. Grant microphone permission when prompted
5. Recording starts automatically
6. Click "Stop & Download" when finished
7. Video downloads automatically as WebM file

### 3. View and Transcribe

1. Open the extension and navigate to "Recordings"
2. Find your recording in the list
3. Click "Transcribe" to generate AI transcript
4. View transcript alongside video playback
5. Copy transcript or export to ChatGPT

### 4. Connect Jira (Optional)

1. Navigate to Settings
2. Click "Connect to Jira"
3. Authorize with your Jira account
4. Set default project and preferences
5. Create Jira issues from recordings with one click

### 5. Enable Gemini AI (Optional)

1. Navigate to Settings
2. Follow Gemini setup instructions
3. Authorize with Google account
4. Use AI to generate professional issue descriptions


## Jira Integration Setup

### Prerequisites
- Jira Cloud account (jira.atlassian.com)
- Project with create issue permissions
- Chrome extension installed

### Connection Steps

1. **Open Settings**
   - Click extension icon → Settings
   - Navigate to "Jira Integration" section

2. **Connect to Jira**
   - Click "Connect to Jira"
   - Browser opens Jira OAuth consent page
   - Authorize the extension
   - Automatically redirects back

3. **Configure Defaults** (Optional but recommended)
   - Select default project from dropdown
   - Choose default priority (e.g., Medium)
   - Select default assignee
   - Pick default sprint (if using sprints)

## Technical Documentation

### Tech Stack
- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 6 with @crxjs/vite-plugin
- **Styling**: TailwindCSS 4
- **Chrome APIs**: Manifest V3 (desktopCapture, storage, identity, offscreen)
- **AI/ML**: @xenova/transformers (Whisper model)
- **Jira API**: jira.js library


### API Integration Points

**Chrome Extension APIs**:
- `chrome.desktopCapture`: Screen recording
- `chrome.storage.local`: Settings and metadata persistence
- `chrome.identity`: OAuth flows for Jira and Gemini
- `chrome.offscreen`: Background transcription processing
- `chrome.downloads`: Video file downloads
- `chrome.tabs`: Tab management for recorder

**Jira.js Integration**:
- Projects API: Fetch accessible projects
- Issues API: Create, search, and link issues
- Users API: Get assignable users
- Sprints API: Fetch active/future sprints
- OAuth 2.0 authentication flow

**Whisper Transcription**:
- Runs in Web Worker (non-blocking)
- Uses @xenova/transformers library
- Processes audio in offscreen document
- Real-time progress updates via message passing

### Development Guides

**Available Scripts**:
```bash
npm run dev              # Development mode with hot reload (Chrome)
npm run dev:chrome       # Development mode (Chrome)
npm run dev:firefox      # Development mode (Firefox)
npm run build            # Production build (Chrome)
npm run build:chrome     # Production build (Chrome)
npm run build:firefox    # Production build (Firefox)
```

## Permissions

The extension requires these permissions:

| Permission | Purpose |
|------------|---------|
| `desktopCapture` | Capture screen/window content for recording |
| `tabCapture` | Tab-specific recording capabilities |
| `activeTab` | Interact with current tab for recording |
| `downloads` | Save recorded video files to disk |
| `storage` | Store settings, recording metadata, and preferences |
| `sidePanel` | Display side panel interface |
| `identity` | OAuth authentication for Jira and Gemini |
| `offscreen` | Background audio processing for transcription |
| `host_permissions` | Inject content scripts on all pages |


## Credits & Acknowledgments

**Open Source Libraries**:
- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [Jira.js](https://github.com/MrRefactoring/jira.js) - Jira API client
- [@xenova/transformers](https://github.com/xenova/transformers.js) - Whisper AI transcription
- [@crxjs/vite-plugin](https://github.com/crxjs/chrome-extension-tools) - Chrome extension build tool

**Contributors**:
- Your contributions welcome here!

---

Built with Chrome Extension Manifest V3 for modern, secure browser extensions.
