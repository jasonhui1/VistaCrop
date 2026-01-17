# Canvas System Architecture

This document explains how the canvas/composition system works in VistaCrop.

## Overview

The canvas system allows users to create manga-style page compositions by placing cropped images onto a canvas. It supports two modes:

| Mode | Description |
|------|-------------|
| **Panels** | Preset grid layouts with fixed panel slots |
| **Freeform** | Free placement with drag, resize, and rotate |

```
┌─────────────────────────────────────────────────┐
│                  ComposerView                   │
│  ┌──────────┐  ┌──────────────────┐  ┌───────┐ │
│  │  Left    │  │                  │  │ Right │ │
│  │ Sidebar  │  │  Canvas Area     │  │Sidebar│ │
│  │ (crops)  │  │  (PageCanvas or  │  │(props)│ │
│  │          │  │  FreeformCanvas) │  │       │ │
│  └──────────┘  └──────────────────┘  └───────┘ │
└─────────────────────────────────────────────────┘
```

---

## Key Components

### `ComposerView.jsx`
**Role:** Main orchestrator component

- Manages `composition` state (page size, background color, layout)
- Manages `placedItems` array (freeform mode items)
- Handles mode switching (panels ↔ freeform)
- Integrates undo/redo via `useUndoRedo` hook
- Integrates save/load via `useCanvasPersistence` hook

### `FreeformCanvas.jsx`
**Role:** Freeform placement canvas

Handles:
- Drag & drop crops onto canvas
- Move, resize, rotate placed items
- Custom polygon corner editing
- Canvas dimension resizing (edge handles)

### `PageCanvas.jsx`
**Role:** Panel-based layout canvas

Handles:
- Rendering preset panel layouts
- Assigning crops to panel slots
- Zoom/pan within panels

### `CanvasView.jsx`
**Role:** Crop selection canvas (gallery mode)

Handles:
- Drawing selection rectangles on source images
- Creating new crops from selections

---

## Data Structures

### Composition
```javascript
{
  pageWidth: 1240,      // pixels
  pageHeight: 1754,     // pixels
  backgroundColor: '#ffffff',
  layoutId: 'single',   // panel layout preset
  assignments: {...}    // panel mode: cropId per panel
}
```

### Placed Item (freeform mode)
```javascript
{
  id: 1,
  cropId: 123,          // reference to crop
  x: 100,               // pixels from left
  y: 50,                // pixels from top
  width: 300,           // pixels
  height: 200,          // pixels
  rotation: 15,         // degrees
  frameShape: 'rectangle',
  customPoints: null,   // or [[x,y], ...] for custom polygon
  borderColor: '#000',
  borderWidth: 3,
  borderStyle: 'manga'  // 'manga' | 'solid' | 'dashed' | 'none'
}
```

---

## Coordinate System

All coordinates are stored in **pixels** relative to the composition's page size:

```
┌─────────────────────────────────────────┐
│ (0,0)                                   │
│                                         │
│   ┌─────────┐                           │
│   │ item    │ x: 100, y: 50             │
│   │         │ width: 300, height: 200   │
│   └─────────┘                           │
│                                         │
│                      (pageWidth, pageHeight)
└─────────────────────────────────────────┘
```

During rendering, pixel coordinates are converted to percentages for CSS positioning:
```javascript
const leftPct = (item.x / composition.pageWidth) * 100
```

This ensures items scale correctly when the canvas container resizes.

---

## Key Files

| File | Purpose |
|------|---------|
| `src/components/ComposerView.jsx` | Main composer component |
| `src/components/FreeformCanvas.jsx` | Freeform canvas with drag/resize |
| `src/components/PageCanvas.jsx` | Panel-based layout canvas |
| `src/components/composer/*.jsx` | Extracted sidebar components |
| `src/utils/panelLayouts.js` | Panel layout presets (2-panel, 3-panel, etc.) |
| `src/utils/exportCanvas.js` | PNG export logic |
| `src/utils/frameShapes.js` | Polygon/shape definitions |
| `src/hooks/useUndoRedo.js` | Undo/redo state management |
| `src/hooks/useCanvasPersistence.js` | Save/load canvas to server |

---

## Interaction Flow

### Adding a Crop to Freeform Canvas
```
1. User drags crop from left sidebar
2. FreeformCanvas.handleDrop() receives drop event
3. Converts screen position to page pixel coordinates
4. Calls onDropCrop(cropId, x, y)
5. ComposerView adds new item to placedItems array
```

### Resizing an Item
```
1. User drags corner resize handle
2. handleMouseMove() calculates delta in page pixels
3. calculateResizeUpdates() computes new size (maintaining aspect ratio)
4. onUpdateItemSilent() updates state without recording history
5. On mouse up, onDragEnd() records final state to undo history
```

### Exporting
```
1. User clicks Export button
2. exportCanvas() creates off-screen canvas at full page resolution
3. For each placed item:
   - Load original/cropped image
   - Apply rotation, filters, clipping
   - Draw borders
4. Trigger download as PNG
```

---

## Frame Shapes

Items can have different frame shapes defined in `frameShapes.js`:

| Shape | Points |
|-------|--------|
| `rectangle` | 4 corners |
| `diamond` | 4 points (rotated square) |
| `pentagon` | 5 points |
| `hexagon` | 6 points |
| `trapezoid` | 4 points (angled) |
| `parallelogram` | 4 points (skewed) |

Custom shapes: Users can drag individual corners to create irregular polygons via `customPoints`.

---

## Undo/Redo

The `useUndoRedo` hook manages state history:

- **Silent updates** during drag (no history recording)
- **Record** only on mouse up (final position)
- Prevents history pollution from intermediate states

```javascript
const { state, setState, setStateSilent, recordCurrentState, undo, redo } = useUndoRedo(initialState)
```
