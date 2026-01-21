import { memo } from 'react'

// ============================================================================
// Resize Handle Component (single corner)
// ============================================================================
export const ResizeHandle = memo(function ResizeHandle({ corner, onMouseDown }) {
    const positions = {
        tl: { left: -8, top: -8, cursor: 'nwse-resize' },
        tr: { right: -8, top: -8, cursor: 'nesw-resize' },
        bl: { left: -8, bottom: -8, cursor: 'nesw-resize' },
        br: { right: -8, bottom: -8, cursor: 'nwse-resize' }
    }

    const pos = positions[corner]

    return (
        <div
            className={`resize-handle resize-${corner}`}
            style={{
                position: 'absolute',
                ...pos,
                width: 14,
                height: 14,
                backgroundColor: '#000',
                border: '2px solid var(--accent-primary)',
                zIndex: 4
            }}
            onMouseDown={onMouseDown}
        />
    )
})

// ============================================================================
// Resize Handles Group Component (all 4 corners)
// ============================================================================
export const ResizeHandles = memo(function ResizeHandles({ item, onMouseDown }) {
    const corners = ['tl', 'tr', 'bl', 'br']

    return (
        <>
            {corners.map(corner => (
                <ResizeHandle
                    key={corner}
                    corner={corner}
                    onMouseDown={(e) => onMouseDown(e, item, `resize-${corner}`)}
                />
            ))}
        </>
    )
})

// ============================================================================
// Canvas Edge Resize Handle Component
// ============================================================================
export const CanvasResizeHandle = memo(function CanvasResizeHandle({ edge, onMouseDown }) {
    const size = 8
    const len = 50

    const baseStyle = {
        position: 'absolute',
        backgroundColor: 'var(--accent-primary)',
        opacity: 0.7,
        zIndex: 20,
        borderRadius: '3px'
    }

    const edgeStyles = {
        top: { top: -size - 6, left: '50%', transform: 'translateX(-50%)', width: len, height: size, cursor: 'ns-resize' },
        bottom: { bottom: -size - 6, left: '50%', transform: 'translateX(-50%)', width: len, height: size, cursor: 'ns-resize' },
        left: { left: -size - 6, top: '50%', transform: 'translateY(-50%)', width: size, height: len, cursor: 'ew-resize' },
        right: { right: -size - 6, top: '50%', transform: 'translateY(-50%)', width: size, height: len, cursor: 'ew-resize' }
    }

    return (
        <div
            style={{ ...baseStyle, ...edgeStyles[edge] }}
            onMouseDown={(e) => onMouseDown(e, edge)}
            title={edge === 'top' || edge === 'bottom' ? 'Resize height' : 'Resize width'}
        />
    )
})
