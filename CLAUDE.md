# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm start` - Start development mode (launches Electron app)
- `npm run build:mac` - Build for macOS (creates .dmg)
- `npm run build:linux` - Build for Linux (creates AppImage and .deb)
- `npm run build:win` - Build for Windows (creates NSIS installer)

## Architecture Overview

This is an Electron-based digital signage application that displays content from MicroCMS in a slideshow format with scheduling capabilities.

### Core Components

**Main Process (`src/main.js`)**
- Entry point that orchestrates services and windows
- Handles IPC communication for content fetching
- Sets up periodic content updates (1-minute intervals)

**MicroCMS Service (`src/services/microcms.js`)**
- Manages MicroCMS API client initialization and content fetching
- Implements scheduling logic based on weekDay filtering (day of week + week of month)
- Settings are read from `userSettings.microcms` in electron-store
- Gracefully handles missing configuration (warns but doesn't crash)

**Settings Service (`src/services/settings.js`)**
- Manages application configuration using electron-store
- All settings stored under `userSettings` key
- Handles both MicroCMS configuration and UI preferences
- IPC handlers: `get-settings`, `get-slide-settings`, `save-settings`, `update-slide-speed`

**Window Manager (`src/windows/window-manager.js`)**
- Manages main application window and settings window lifecycle
- Handles window communication and menu setup
- Main window starts in fullscreen mode with ESC key to exit
- Settings window is modal and accessible via Cmd/Ctrl+, or menu

### Data Flow

1. Main process initializes MicroCMSService with settings from electron-store
2. Content is fetched via `fetchContents()` and filtered by current day/week
3. Processed content is sent to renderer via IPC (`content-updated` events)
4. Renderer displays content in slideshow format with configurable speed

### Content Scheduling

The app supports sophisticated scheduling via `weekDay` arrays in MicroCMS content:
- `week`: "毎週" (every week) or "第1週" through "第5週" (specific week of month)
- `day`: Japanese day names ("月", "火", "水", "木", "金", "土", "日")

Content is filtered during `processContent()` to only show items matching current day/week.

### Settings Structure

Settings are stored in electron-store under `userSettings`:
```json
{
  "slide": { "speed": 5 },
  "devTools": false,
  "microcms": {
    "serviceDomain": "string",
    "apiKey": "string", 
    "endpoint": "string"
  }
}
```

### Important Notes

- MicroCMS configuration is required for content display but app will run without it
- Settings changes require app restart to take effect
- Content updates automatically every minute
- Slide speed changes are applied immediately when saved via settings
- All IPC communication flows through preload.js for security
- Dev tools can be enabled via settings and will auto-open on startup if enabled
- Content supports both image and iframe types from MicroCMS