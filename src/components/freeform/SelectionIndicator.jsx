import { memo } from 'react'
import { getClipPath } from '../../utils/frameShapes'

// ============================================================================
// Selection Indicator Component
// ============================================================================
export const SelectionIndicator = memo(function SelectionIndicator({ frameShape, customPoints }) {
    return (
        <div
            style={{
                position: 'absolute',
                inset: -6,
                clipPath: getClipPath(frameShape || 'rectangle', customPoints),
                border: '2px solid var(--accent-primary)',
                boxShadow: '0 0 12px var(--accent-primary)',
                pointerEvents: 'none',
                zIndex: 3
            }}
        />
    )
})

export default SelectionIndicator
