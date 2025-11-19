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

1. Clone or download this repository:

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" using the toggle in the top right corner

4. Click "Load unpacked" and select the project directory

5. The extension icon should now appear in your Chrome toolbar

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
├── manifest.json       # Extension configuration
├── popup.html          # Side panel UI
├── popup.js            # Side panel logic
├── recorder.html       # Recording page UI
├── recorder.js         # Core recording functionality
├── background.js       # Background service worker
├── content.js          # Content script
├── icon16.png          # Extension icon (16x16)
├── icon48.png          # Extension icon (48x48)
├── icon128.png         # Extension icon (128x128)
└── create_icons.sh     # Icon generation script
```

## Technical Details

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

To modify or extend the extension:

1. Make your changes to the relevant files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## License

[Add your license here]

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please open an issue on the GitHub repository.
