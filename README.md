# Chrome Window Recorder with Microphone

A lightweight Chrome extension that records your window FAST. With audio into WebM format for compatablity. 
Designed for clarity and optimal file size.
My use case: Record a quick video, upload WebM video stright from dowloads to Jira.

## Features

- **Screen Recording**: Capture your current Chrome window or entire screen
- **Microphone Audio**: Records your microphone audio alongside the screen capture
- **System Audio Support**: Optionally captures system audio (if available/selected)
- **Audio Mixing**: Automatically mixes microphone and system audio when both are available
- **High Quality**: Records at 1920x1080 resolution at 30fps
- **WebM Format**: Uses VP9/VP8 codec with Opus audio for efficient file sizes
- **Side Panel UI**: Convenient side panel interface for quick access
- **Automatic Download**: Recording is automatically downloaded when stopped

## Installation

### For Users (Pre-built Extension)

1. Download the latest release from the releases page
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top right corner
4. Click "Load unpacked" and select the `dist_chrome` directory from the downloaded release
5. The extension icon should now appear in your Chrome toolbar

### For Developers (Build from Source)

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/QuickVideoRecord.git
   cd QuickVideoRecord
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" using the toggle in the top right corner
   - Click "Load unpacked" and select the `dist_chrome` directory
   - The extension icon should now appear in your Chrome toolbar

## Usage

1. Click the extension icon in your Chrome toolbar or open the side panel

2. Click the "Start Recording" button

3. A new tab will open with a screen recording prompt

4. Grant microphone permissions when prompted

5. Recording will start automatically - the preview will show in the recorder tab

6. Click "Stop & Download" when you're done recording

7. The video will be automatically downloaded as a WebM file with a timestamp

## File Structure

```
QuickVideoRecord/
├── src/
│   ├── pages/
│   │   ├── popup/           # Side panel React component
│   │   │   ├── Popup.tsx
│   │   │   ├── Popup.css
│   │   │   ├── index.tsx
│   │   │   └── index.html
│   │   ├── recorder/        # Recorder React component
│   │   │   ├── Recorder.tsx
│   │   │   ├── Recorder.css
│   │   │   ├── index.tsx
│   │   │   └── index.html
│   │   ├── background/      # Background service worker
│   │   │   └── index.ts
│   │   └── content/         # Content script
│   │       └── index.ts
│   ├── global.d.ts
│   └── vite-env.d.ts
├── public/                  # Static assets
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── dist_chrome/             # Build output (Chrome)
├── manifest.json            # Extension configuration
├── manifest.dev.json        # Development manifest overrides
├── package.json
├── tsconfig.json
├── vite.config.base.ts      # Base Vite configuration
├── vite.config.chrome.ts    # Chrome-specific Vite config
└── custom-vite-plugins.ts   # Custom Vite plugins
```

## Technical Details

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 6 with @crxjs/vite-plugin
- **Manifest Version**: 3 (latest Chrome extension standard)
- **Video Codec**: VP9 (fallback to VP8 if not supported)
- **Audio Codec**: Opus
- **Resolution**: 1920x1080 (ideal, max)
- **Frame Rate**: 30fps
- **Audio Mixing**: Web Audio API for combining multiple audio sources

## Permissions

The extension requires the following permissions:

- `desktopCapture`: To capture screen content
- `tabCapture`: For tab-specific recording capabilities
- `activeTab`: To interact with the current tab
- `downloads`: To save recorded videos
- `storage`: To store extension settings
- `sidePanel`: To display the control panel
- `host_permissions`: To inject content scripts on all pages

## Browser Compatibility

- Chrome 116+ (Manifest V3 with sidePanel support)
- Chromium-based browsers with similar extension support

## Known Limitations

- System audio capture depends on browser support and user selection during screen sharing
- Recording quality is balanced for file size and clarity
- Extension cannot record in incognito mode without explicit permission

## Development

### Development Mode with Hot Reload

Run the extension in development mode with hot reload:

```bash
npm run dev
```

This will:
- Build the extension in development mode
- Watch for file changes
- Automatically rebuild on changes
- Output to `dist_chrome` directory

Then load the `dist_chrome` directory in Chrome as an unpacked extension.

### Making Changes

1. Make your changes to files in the `src/` directory
2. The extension will automatically rebuild
3. Go to `chrome://extensions/` and click the refresh icon on the extension card
4. Test your changes

### Available Scripts

- `npm run dev` - Development mode with hot reload (Chrome)
- `npm run build` - Production build (Chrome)
- `npm run build:chrome` - Production build for Chrome
- `npm run build:firefox` - Production build for Firefox

## License

[Add your license here]

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please open an issue on the GitHub repository.
