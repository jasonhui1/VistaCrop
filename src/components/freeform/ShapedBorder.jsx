import { memo, useRef, useState, useEffect, useMemo } from 'react'
import { FRAME_SHAPES } from '../../utils/frameShapes'

// ============================================================================
// ShapedBorder Component - SVG polygon borders for manga-style effect
// ============================================================================
export const ShapedBorder = memo(function ShapedBorder({
    shapeId,
    customPoints,
    isSelected,
    isEditingCorners,
    onCornerMouseDown,
    borderColor = '#000',
    borderWidth = 3,
    borderStyle = 'manga'
}) {
    const containerRef = useRef(null)
    const [size, setSize] = useState({ width: 100, height: 100 })

    useEffect(() => {
        if (!containerRef.current) return
        const updateSize = () => {
            if (containerRef.current) {
                setSize({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                })
            }
        }
        updateSize()
        const resizeObserver = new ResizeObserver(updateSize)
        resizeObserver.observe(containerRef.current)
        return () => resizeObserver.disconnect()
    }, [])

    // Use custom points if provided, else fall back to shape preset
    const points = customPoints || FRAME_SHAPES[shapeId]?.points || FRAME_SHAPES.rectangle.points

    // Generate SVG points for the shape
    const outerPoints = points
        .map(([xPct, yPct]) => `${(xPct / 100) * size.width},${(yPct / 100) * size.height}`)
        .join(' ')

    // Calculate inner points for double border effect
    const innerPoints = useMemo(() => {
        const insetAmount = Math.max(borderWidth, 4)
        const centerX = size.width / 2
        const centerY = size.height / 2

        return points
            .map(([xPct, yPct]) => {
                const x = (xPct / 100) * size.width
                const y = (yPct / 100) * size.height
                const dx = centerX - x
                const dy = centerY - y
                const dist = Math.sqrt(dx * dx + dy * dy)
                const factor = dist > 0 ? insetAmount / dist : 0
                return `${x + dx * factor},${y + dy * factor}`
            })
            .join(' ')
    }, [points, size.width, size.height, borderWidth])

    // Container style
    const containerStyle = {
        position: 'absolute',
        inset: -4,
        pointerEvents: isEditingCorners ? 'auto' : 'none',
        zIndex: 2
    }

    // Don't render borders if style is 'none'
    if (borderStyle === 'none' && !isEditingCorners) {
        return <div ref={containerRef} style={containerStyle} />
    }

    // Get stroke dash array based on style
    const strokeDashArray = borderStyle === 'dashed'
        ? `${borderWidth * 3},${borderWidth * 2}`
        : 'none'

    return (
        <div ref={containerRef} style={containerStyle}>
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${size.width} ${size.height}`}
                preserveAspectRatio="none"
                style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
            >
                {/* Outer border */}
                <polygon
                    points={outerPoints}
                    fill="none"
                    stroke={borderColor}
                    strokeWidth={borderWidth}
                    strokeLinejoin="miter"
                    strokeDasharray={strokeDashArray}
                />
                {/* Inner border for manga double style */}
                {borderStyle === 'manga' && (
                    <polygon
                        points={innerPoints}
                        fill="none"
                        stroke={borderColor}
                        strokeWidth={Math.max(1, borderWidth * 0.6)}
                        strokeLinejoin="miter"
                    />
                )}
                {/* Corner handles when editing */}
                {isEditingCorners && points.map((point, index) => {
                    const x = (point[0] / 100) * size.width
                    const y = (point[1] / 100) * size.height
                    return (
                        <circle
                            key={index}
                            cx={x}
                            cy={y}
                            r={8}
                            fill="var(--accent-primary)"
                            stroke="#fff"
                            strokeWidth="2"
                            style={{ cursor: 'move', pointerEvents: 'auto' }}
                            onMouseDown={(e) => onCornerMouseDown?.(e, index)}
                        />
                    )
                })}
            </svg>
        </div>
    )
})

export default ShapedBorder
