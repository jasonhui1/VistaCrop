// Re-export FreeformCanvas as the default export from this directory
export { default } from './FreeformCanvas'

// Named exports for individual components if needed elsewhere
export { PlacedItem } from './PlacedItem'
export { ShapedBorder } from './ShapedBorder'
export { SelectionIndicator } from './SelectionIndicator'
export { EmptyStateHint } from './EmptyStateHint'
export { ResizeHandle, ResizeHandles, CanvasResizeHandle } from './resizeHandles'
export { RotationRing, FrameRotationHandle } from './rotationHandles'
export { calculateResizeUpdates, MIN_ITEM_SIZE, MIN_CANVAS_SIZE } from './resizeUtils'
