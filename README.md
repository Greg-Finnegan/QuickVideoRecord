# JiraQuickVideoRecord

**Screen recording with local AI transcription and Jira integration**

[![Chrome Version](https://img.shields.io/badge/chrome-116%2B-blue)](https://www.google.com/chrome/)
[![Version](https://img.shields.io/badge/version-1.2.0-blue)](package.json)

Chrome extension that can record your screen, automatically transcribe with AI (on device - no API), and create Jira issues with smart descriptions—all in one place.

The primary goal is to **radically reduce friction** when reporting bugs, describing UI issues, explaining customer requests, or documenting small improvements — especially from Customer Success, Support, and Sales teams.

## Why this exists

Writing good JIRA tickets takes time and mental energy.  
Most people avoid it or write very short / vague descriptions.  
Short narrated screen recordings + good transcription + structured summarization = dramatically better tickets with far less effort.

Observed benefits so far:

- ~10–25 tickets per week created mostly via voice instead of typing
- Much clearer reproduction steps (especially UI/layout issues)
- Faster triage & understanding for engineers
- Non-dev team members actually create tickets regularly
- Videos can be downloaded & shared in Slack independently of JIRA

## Core workflow (how people are using it)

1. Click the extension icon → **Start Recording**
2. Record screen + voice (usually 30 sec – 3 min)
   - Most common: share current tab or specific window
3. Click **Stop & Download**
4. Wait a few seconds → local transcription appears
5. Review / lightly edit the auto-generated **summary** (Cliff Notes style)
6. Set quick metadata:
   - Project (default: Customer Success or Engineering)
   - Sprint (default: current / next sprint)
   - Priority
   - Assignee (default: lead engineer)
7. Click **Create Ticket**
   → JIRA issue is created with:
      - Summary from title / cleaned-up prompt
      - Description = transcript + AI-generated cliff notes
      - Linked video file name reference

Many users also:

- Just download the video and drop it in Slack without creating a ticket
- Use it for internal explanations / knowledge sharing

## Features

- Local (offline) transcription & processing
- One-click JIRA ticket creation
- Sprint & project selector (pulls your recent sprints)
- Priority & assignee defaults
- Dark & light theme support
- Recording history (last ~120 recordings kept in UI)
- Download original video file anytime
- Open raw recording file locally
- Direct link to ChatGPT / LLM with transcript + custom prompt
- Refreshable extension without store publication

## Current limitations & known realities

- Best for recordings **< 5 minutes** (longer ones often fail transcription)
- Transcription quality depends heavily on clear speech & low background noise
- Requires manual JIRA OAuth app setup per user/machine (Chrome extension ID → callback URL)
- Still in active development — some rough edges exist
- Not yet published on Chrome Web Store (side-loaded only)

## Installation

1. Clone or download this repository OR Run the build script (`build-chrome-extension.sh`)
3. Create your own Atlassian Developer app → get Client ID & Secret
4. Fill `.env` file with your credentials & extension ID
5. Load unpacked extension in Chrome (developer mode)
6. Authorize with JIRA
7. Set default project & sprint in the extension settings


## Development notes

- Built with Vite + React + TypeScript + Tailwind
- Uses Chrome `chrome.tabCapture` + `MediaRecorder` API
- Local @xenova/transformers transcription
- Atlassian OAuth 2.0 (Jira Software Cloud)

## Future direction (rough ideas)

- Editable system prompt for summary generation
- Better handling of long recordings (chunking / resumable)
- Chrome Web Store publication → auto-updates
- Optional video upload to private S3 / cloud storage
- Quick re-record / append to existing ticket
- Priority sorting visualization in recording list
- One-click "copy JIRA link" after creation

## Contributing

This started as an internal productivity hack.  
Feel free to fork, PR, or open issues — especially around:

- Transcription reliability
- UX pain points
- OAuth & setup simplification
- Prompt engineering for better summaries

Feedback from Customer Success & Support users is especially valuable.
