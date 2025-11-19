# Migration to React + Vite

This document explains the migration from vanilla JavaScript to React + TypeScript with Vite.

## What Changed

### Build System
- **Before**: Plain HTML/JS files loaded directly by Chrome
- **After**: React + TypeScript with Vite build system
- **Why**: Better development experience, hot reload, modern tooling, type safety

### File Structure
The extension was restructured to follow the Vite Web Extension template:

**Old Files (vanilla JS):**
- `popup.html` + `popup.js` → **Migrated to** `src/pages/popup/`
- `recorder.html` + `recorder.js` → **Migrated to** `src/pages/recorder/`
- `background.js` → **Migrated to** `src/pages/background/index.ts`
- `content.js` → **Migrated to** `src/pages/content/index.ts`

**New Structure:**
```
src/
├── pages/
│   ├── popup/          # React component for side panel
│   ├── recorder/       # React component for recording page
│   ├── background/     # Background service worker (TypeScript)
│   └── content/        # Content script (TypeScript)
```

### Functionality Preserved
All original functionality has been preserved:
- ✅ Side panel UI for starting/stopping recordings
- ✅ Screen capture with getDisplayMedia API
- ✅ Microphone audio recording
- ✅ System audio mixing (when available)
- ✅ WebM format with VP9/VP8 codec
- ✅ Automatic download on stop
- ✅ 1920x1080 @ 30fps recording quality

### New Features
- **TypeScript**: Type safety throughout the codebase
- **React**: Modern component-based UI
- **Hot Reload**: Automatic rebuilding during development
- **Better Developer Experience**: Modern tooling with Vite

## Old Files

The following files are now obsolete and can be deleted (kept for reference):
- `background.js` → migrated to `src/pages/background/index.ts`
- `content.js` → migrated to `src/pages/content/index.ts`
- `popup.html` → migrated to `src/pages/popup/`
- `popup.js` → migrated to `src/pages/popup/Popup.tsx`
- `recorder.html` → migrated to `src/pages/recorder/`
- `recorder.js` → migrated to `src/pages/recorder/Recorder.tsx`

## Building and Running

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

The built extension will be in the `dist_chrome/` directory.

## Migration Notes

1. **Icons**: Icons are now in the `public/` folder and automatically copied during build
2. **Manifest**: The `manifest.json` is now processed by Vite's @crxjs/vite-plugin
3. **Dependencies**: All installed via npm, managed in `package.json`
4. **TypeScript**: Full type safety with `@types/chrome` for Chrome API
5. **CSS**: Component-specific CSS files (Popup.css, Recorder.css)

## Testing the Migration

To verify everything works:
1. Run `npm install --legacy-peer-deps`
2. Run `npm run build`
3. Load `dist_chrome/` in Chrome (`chrome://extensions/`)
4. Test recording functionality
5. Verify audio mixing works
6. Check download functionality

## Rollback

If you need to rollback to the old version:
1. The old files are still in the root directory
2. Simply load the root directory as an unpacked extension (not `dist_chrome/`)
3. The old vanilla JS version will load

## Future Enhancements

Now that we have a modern build system, future improvements are easier:
- Add UI libraries (Material-UI, Tailwind is already available)
- Add state management (Redux, Zustand, etc.)
- Add testing (Jest, React Testing Library)
- Add more sophisticated recording controls
- Add recording preview/playback
- Add settings/preferences UI
