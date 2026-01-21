import { memo } from 'react'
import { getClipPath } from '../../utils/frameShapes'
import RotatableImage from '../RotatableImage'
import PhoneMockup from '../PhoneMockup'
import { ShapedBorder } from './ShapedBorder'
import { SelectionIndicator } from './SelectionIndicator'
import { ResizeHandles } from './resizeHandles'
import { RotationRing, FrameRotationHandle } from './rotationHandles'

// ============================================================================
// Placed Item Component
// ============================================================================
export const PlacedItem = memo(function PlacedItem({
    item,
    crop,
    isSelected,
    isRotating,
    isFrameRotating,
    isPanning,
    currentRotation,
    currentFrameRotation,
    currentCropOffset,
    pageWidth,
    pageHeight,
    filterCss,
    onMouseDown,
    onCornerMouseDown
}) {
    // Convert pixel coordinates to percentages for rendering
    const leftPct = (item.x / pageWidth) * 100
    const topPct = (item.y / pageHeight) * 100
    const widthPct = (item.width / pageWidth) * 100
    const heightPct = (item.height / pageHeight) * 100

    // Frame rotation (rotates the entire container/selection box)
    const frameRotation = currentFrameRotation ?? item.frameRotation ?? 0

    const itemStyle = {
        position: 'absolute',
        left: `${leftPct}%`,
        top: `${topPct}%`,
        width: `${widthPct}%`,
        height: `${heightPct}%`,
        boxSizing: 'border-box',
        cursor: isRotating || isFrameRotating ? 'grabbing' : 'grab',
        zIndex: isSelected ? 10 : 1,
        transform: frameRotation !== 0 ? `rotate(${frameRotation}deg)` : undefined,
        transformOrigin: 'center center',
    }

    const imageContainerStyle = {
        position: 'absolute',
        inset: 0,
        clipPath: item.phoneMockup ? 'none' : getClipPath(item.frameShape || 'rectangle', item.customPoints),
        overflow: 'hidden'
    }

    const isEditingCorners = isSelected && !!item.editingCorners

    // Image content (reused in both normal and phone mockup modes)
    const imageContent = (
        <RotatableImage
            crop={crop}
            currentRotation={currentRotation}
            isRotating={isRotating}
            filterCss={filterCss}
            hideRotationOverlay={isEditingCorners}
            cropOffsetX={currentCropOffset?.x ?? item.cropOffsetX ?? 0}
            cropOffsetY={currentCropOffset?.y ?? item.cropOffsetY ?? 0}
            isPanning={isPanning}
        />
    )

    return (
        <div
            className={`freeform-item ${isSelected ? 'selected' : ''}`}
            style={itemStyle}
            onMouseDown={(e) => onMouseDown(e, item, 'move')}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Rotation ring for image rotation - visible when selected */}
            {isSelected && (
                <RotationRing onMouseDown={(e) => onMouseDown(e, item, 'rotate')} />
            )}

            {/* Frame rotation handle - visible when selected */}
            {isSelected && (
                <FrameRotationHandle
                    onMouseDown={(e) => onMouseDown(e, item, 'frame-rotate')}
                    frameRotation={frameRotation}
                />
            )}

            {/* Phone Mockup Frame */}
            {item.phoneMockup ? (
                <PhoneMockup
                    color={item.phoneColor || '#1a1a1a'}
                    style={item.phoneStyle || 'modern'}
                    landscape={crop && crop.width > crop.height}
                >
                    {imageContent}
                </PhoneMockup>
            ) : (
                <>
                    {/* Manga-style polygon border */}
                    <ShapedBorder
                        shapeId={item.frameShape || 'rectangle'}
                        customPoints={item.customPoints}
                        isSelected={isSelected}
                        isEditingCorners={isEditingCorners}
                        onCornerMouseDown={(e, cornerIndex) => onCornerMouseDown(e, item, cornerIndex)}
                        borderColor={item.borderColor || '#000'}
                        borderWidth={item.borderWidth ?? 3}
                        borderStyle={item.borderStyle || 'manga'}
                    />

                    {/* Selection indicator */}
                    {isSelected && (
                        <SelectionIndicator
                            frameShape={item.frameShape}
                            customPoints={item.customPoints}
                        />
                    )}

                    {/* Image container with clipping */}
                    <div style={imageContainerStyle}>
                        {imageContent}
                    </div>
                </>
            )}

            {/* Resize handles (hide when editing custom corners) */}
            {isSelected && !item.editingCorners && (
                <ResizeHandles item={item} onMouseDown={onMouseDown} />
            )}
        </div>
    )
})

export default PlacedItem
