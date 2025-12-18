# UI DEVELOPMENT PLAN — RESEARCH TERMINAL (PHASE 1)

## 0) Scope & Goals (UI-only)

### Primary goal
Enable fast, reliable monitoring of live financial news with minimal interaction.

### In scope
- Real-time news terminal
- Six-pane layout
- Tag visibility
- Sound alerts for critical tags
- Click-through to source
- Simple global controls

### Out of scope
- Auth flows beyond basic access
- Custom dashboards
- Historical analysis
- Personalization beyond sound toggles

### UI principles
- Always-on screen
- Zero clutter
- No hidden navigation
- Fast scan over deep interaction

## 1) Navigation Map

Minimal by design.

```
/              → Terminal (default)
/settings      → Sound & system settings
/help          → Tag glossary + usage
```

No dashboards.
No landing page for MVP.
Terminal is the product.

## 2) App Shell (Global)

### Purpose
Provide a stable frame for live content and global controls.

### Top Bar (Persistent)

**Left**
- Product name: Research Terminal

**Center**
- Current time (market timezone)

**Right**
- Connection status indicator (Live / Reconnecting)
- Sound toggle (On / Off)
- Volume slider (popover)
- Settings icon
- Help icon

### Left Navigation (None in Phase 1)

Navigation is intentionally removed to:
- Reduce cognitive load
- Keep users focused on the terminal

### Main Content Area
- Hosts the six-pane terminal grid
- Fills remaining viewport height
- No global scrolling

### System Layer

**Toasts:**
- Connection lost / restored

**Modals:**
- Sound permission blocked

**Banners:**
- Temporary reconnecting state

### Shared Widgets
- Connection badge
- Sound-enabled tag indicator
- New item highlight

## 3) Terminal Screen (Core Screen)

### Goal
Let users understand global market news in under 60 seconds.

### Layout
- Fixed 2x3 grid (six panes)
- All panes visible at once
- Equal visual weight

### Pane Structure (Reusable)

**Pane Header**
- Pane title (e.g. "US Markets")
- Info icon → explains tag logic

**News List**
- Max 10 items
- Ordered newest → oldest
- No scrolling
- Auto-updating

## 4) News Item Component

### Goal
Make each item scannable in under 1 second.

### Structure
- Timestamp
- Headline (clickable)
- Source
- Tag group

### Tags
- Region (1)
- Market (1–2)
- Theme (1–2)
- Sound-enabled tags visibly marked.

### Behavior
- Click → opens source in new tab
- New items briefly highlighted
- If sound-enabled → sound plays once

## 5) Live Update Behavior

### Goal
Surface urgency without chaos.

### On New Item Arrival
- Insert at top of relevant panes
- Shift older items down
- Remove oldest if >10
- Apply brief highlight

### Sound Logic
- Plays only for specific tags
- One sound per burst
- Cooldown enforced

## 6) Sound Settings Screen

### Route
`/settings`

### Purpose
Give control without complexity.

### Components

**Global**
- Master sound toggle
- Volume slider
- Test sound button

**Per Tag**
- List of sound-eligible tags
- Toggle per tag

### Rules
- No custom sounds
- No per-pane sound settings
- Changes apply instantly

## 7) Help Screen

### Route
`/help`

### Purpose
Explain the system, not market concepts.

### Sections
- How the terminal works
- Tag glossary:
  - Regions
  - Markets
  - Themes
- Sound alert explanation
- Common questions:
  - Why fixed panes?
  - Why limited tags?

## 8) System States & Edge UI

### Empty Pane
- Message: "No live items for this category"
- No call to action

### Connection Lost
- Header shows "Reconnecting"
- Content freezes in place
- No error modal

### Audio Blocked
- Toast explaining browser restriction
- Link to settings
- Continue silently

## 9) Component Inventory (Reusable)

- AppShell
- HeaderBar
- ConnectionIndicator
- SoundToggle
- Pane
- PaneHeader
- NewsItem
- TagChip
- NewItemHighlight
- SoundSettingsPanel
- HelpContent
- Toast
- Modal

## 10) Data (UI-level Shape)

### NewsItem
```
id
headline
source
url
timestamp
tags[] { type, value }
soundEnabled (derived)
```

### Pane
```
id
title
rules
items[]
```

### GlobalState
```
connectionStatus
soundOn
volume
soundTags[]
```

## 11) Acceptance Matrix (Per Screen)

### Terminal
- Six panes visible
- Live updates without refresh
- Sound triggers correctly
- Click-through works

### Settings
- Sound toggles persist
- Test sound plays
- Volume respected

### Help
- Tags clearly explained
- No broken links

## 12) UI Build Order (Fast Path)

1. AppShell + Header
2. Terminal grid layout
3. Pane + NewsItem components
4. Live insertion + highlight logic
5. Sound alerts
6. Settings screen
7. Help screen
8. Edge states and polish
