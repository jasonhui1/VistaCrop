import { memo } from 'react'

const ROTATION_EDGE_THRESHOLD = 20 // pixels from edge that triggers rotation mode

// ============================================================================
// Rotation Ring Component (for original image rotation)
// ============================================================================
export const RotationRing = memo(function RotationRing({ onMouseDown }) {
    return (
        <div
            className="rotation-ring"
            style={{
                position: 'absolute',
                inset: -ROTATION_EDGE_THRESHOLD,
                border: '2px dashed rgba(168, 85, 247, 0.5)',
                borderRadius: '50%',
                cursor: 'grab',
                zIndex: 0
            }}
            onMouseDown={onMouseDown}
        />
    )
})

// ============================================================================
// Frame Rotation Handle Component (for selection box rotation)
// ============================================================================
export const FrameRotationHandle = memo(function FrameRotationHandle({ onMouseDown, frameRotation }) {
    return (
        <div
            className="frame-rotation-handle"
            style={{
                position: 'absolute',
                top: -35,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 24,
                height: 24,
                backgroundColor: 'var(--accent-secondary, #10b981)',
                borderRadius: '50%',
                cursor: 'grab',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                border: '2px solid white'
            }}
            onMouseDown={onMouseDown}
            title={`Frame rotation: ${Math.round(frameRotation || 0)}°`}
        >
            <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M21 12a9 9 0 0 0-9-9M21 3v9h-9" />
                <path d="M3 12a9 9 0 0 0 9 9M3 21v-9h9" />
            </svg>
        </div>
    )
})

export { ROTATION_EDGE_THRESHOLD }
