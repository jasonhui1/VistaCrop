// ============================================================================
// Resize Logic Helpers
// ============================================================================

export const MIN_ITEM_SIZE = 50
export const MIN_CANVAS_SIZE = 200

/**
 * Calculate resize updates for a specific corner
 * Maintains aspect ratio and anchors to the opposite corner
 */
export function calculateResizeUpdates(corner, deltaX, deltaY, startItem, aspectRatio, pageWidth, pageHeight) {
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)
    const useDeltaX = absDeltaX > absDeltaY

    let updates = {}

    switch (corner) {
        case 'br': {
            // Bottom-right: anchor top-left
            if (useDeltaX) {
                const newWidth = Math.max(MIN_ITEM_SIZE, Math.min(pageWidth - startItem.x, startItem.width + deltaX))
                updates.width = newWidth
                updates.height = newWidth / aspectRatio
            } else {
                const newHeight = Math.max(MIN_ITEM_SIZE, Math.min(pageHeight - startItem.y, startItem.height + deltaY))
                updates.height = newHeight
                updates.width = newHeight * aspectRatio
            }
            break
        }
        case 'bl': {
            // Bottom-left: anchor top-right
            if (useDeltaX) {
                const newWidth = Math.max(MIN_ITEM_SIZE, startItem.width - deltaX)
                const widthDiff = newWidth - startItem.width
                updates.width = newWidth
                updates.height = newWidth / aspectRatio
                updates.x = startItem.x - widthDiff
            } else {
                const newHeight = Math.max(MIN_ITEM_SIZE, Math.min(pageHeight - startItem.y, startItem.height + deltaY))
                const newWidth = newHeight * aspectRatio
                const widthDiff = newWidth - startItem.width
                updates.height = newHeight
                updates.width = newWidth
                updates.x = startItem.x - widthDiff
            }
            break
        }
        case 'tr': {
            // Top-right: anchor bottom-left
            if (useDeltaX) {
                const newWidth = Math.max(MIN_ITEM_SIZE, Math.min(pageWidth - startItem.x, startItem.width + deltaX))
                const newHeight = newWidth / aspectRatio
                const heightDiff = newHeight - startItem.height
                updates.width = newWidth
                updates.height = newHeight
                updates.y = startItem.y - heightDiff
            } else {
                const newHeight = Math.max(MIN_ITEM_SIZE, startItem.height - deltaY)
                const heightDiff = newHeight - startItem.height
                updates.height = newHeight
                updates.width = newHeight * aspectRatio
                updates.y = startItem.y - heightDiff
            }
            break
        }
        case 'tl': {
            // Top-left: anchor bottom-right
            if (useDeltaX) {
                const newWidth = Math.max(MIN_ITEM_SIZE, startItem.width - deltaX)
                const newHeight = newWidth / aspectRatio
                const widthDiff = newWidth - startItem.width
                const heightDiff = newHeight - startItem.height
                updates.width = newWidth
                updates.height = newHeight
                updates.x = startItem.x - widthDiff
                updates.y = startItem.y - heightDiff
            } else {
                const newHeight = Math.max(MIN_ITEM_SIZE, startItem.height - deltaY)
                const newWidth = newHeight * aspectRatio
                const widthDiff = newWidth - startItem.width
                const heightDiff = newHeight - startItem.height
                updates.height = newHeight
                updates.width = newWidth
                updates.x = startItem.x - widthDiff
                updates.y = startItem.y - heightDiff
            }
            break
        }
    }

    // Clamp position to stay within canvas
    if (updates.x !== undefined) updates.x = Math.max(0, updates.x)
    if (updates.y !== undefined) updates.y = Math.max(0, updates.y)

    return updates
}
