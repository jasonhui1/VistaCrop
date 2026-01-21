import { memo } from 'react'

// ============================================================================
// Empty State Component
// ============================================================================
export const EmptyStateHint = memo(function EmptyStateHint() {
    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                opacity: 0.5,
                pointerEvents: 'none'
            }}
        >
            <svg
                style={{ width: 48, height: 48, marginBottom: 8 }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 4v16m8-8H4"
                />
            </svg>
            <span>Drag crops here</span>
        </div>
    )
})

export default EmptyStateHint
