# Changelog

## v1.2.4 — 2026-04-05
- New extension icon for better visibility; icon turns red when recording
- Jira markdown description support: `textToAdf()` converts plain text with basic markdown into proper Jira ADF nodes
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
