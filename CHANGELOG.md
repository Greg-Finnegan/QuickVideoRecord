# Changelog

## v1.2.7 — 2026-07-30
- **Pause and resume recordings** — pause in the middle of recording, resume when ready.
- **Open Side Panel from the main header** - button added for this.
- **Improved main navigation** — the Jira profile button now opens your Jira homepage.
- **Quick Create Jira issues** — open a prefilled Jira issue form directly from the main header.

## v1.2.6 — 2026-07-09
- Upgraded authentication keeps Atlassian tokens safer by using code-to-token and refresh-token exchange (backend service endpoint) (/v1/oauth/token).
- Added cryptographically random state generation (crypto.getRandomValues) and strict state matching to protect against CSRF attacks during auth flow.

## v1.2.5 — 2026-07-09
- **Live audio visualizer** — animated frequency bars show while recording, on both the recorder tab and the side panel, so you can see audio is being captured

## v1.2.4 — 2026-04-26
- **Responsive recording card layout** — metadata stacks above action buttons on narrower screens; clicking anywhere on a card opens the video player
- Wider recordings list container
- Plus icon on Create Jira Ticket button
- Spacing fix on Set as Default button
- **Auto-save Jira form state** — issue form fields persist to the recording so progress is preserved if you close the modal
- **On-device AI filenames** — Chrome's built-in Summarizer API generates descriptive filenames from transcripts after recording
- **Set-as-default buttons** — change a field in the issue form and set it as your new default for Project, Issue Type, Priority, Assignee, or Sprint
- **Default Issue Type setting** — configurable in Settings alongside existing Jira defaults
- **Developer Mode toggle** — hides raw recording data behind a setting; includes a "Clear All Jira Defaults" button for testing
- Encouragement prompt shown below recordings when you have 1–2 recordings
- Close button added to side panel
- Wider Create Jira Issue modal
- Replace emoji indicators with chevron icons and round close buttons
- New extension icon for better visibility; icon turns red when recording
- Jira markdown description support: `textToAdf()` converts plain text with basic markdown into proper Jira ADF nodes
- Fix: Jira dropdown close behavior
- Fix: Modal text selection drag behavior
- Update recording history blank state and fix WebM duration
- Code refactoring

## v1.2.3 — 2026-03-29
- **Multi AI provider support** — added DeepSeek and Perplexity as AI provider options
- Handle clipboard-only AI providers
- Copy Jira link option in context menu
- Close protection: confirm before closing during upload
- Fix: Transcribe button no longer shows during in-progress transcription
- Fix: Stop/download race condition
- Fix: Active recording context management in side panel
- Fix: Editable filename hover behavior
- Consolidate Copy Script buttons
- EditableFilename pencil icon always visible + cleanup
- Maintenance updates

## v1.2.2 — 2026-03-22
- Added "View Settings" button in sidebar

## v1.2.1 — 2026-03-12
- Bundle Whisper model locally and fix transcription worker blob URL context
