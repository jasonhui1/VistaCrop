import { memo, useEffect, useMemo, useRef, useState, CSSProperties } from 'react'
import { getImage } from '../utils/api'

// Constants for display calculations
const DEFAULT_IMAGE_DIMENSION = 1000 // fallback when original dimensions unavailable

export interface CropData {
    id: number | string
    imageId?: string
    imageData: string
    x?: number
    y?: number
    width: number
    height: number
    originalImageWidth?: number
    originalImageHeight?: number
    rotation?: number
    tags?: string[]
    notes?: string
    sourceRotation?: number
    filter?: string
}

export interface RotatableImageProps {
    crop: CropData
    currentRotation: number
    isRotating: boolean
    filterCss?: string
    containerInset?: number
    showCornerHandles?: boolean
    hideRotationOverlay?: boolean
    cropOffsetX?: number
    cropOffsetY?: number
    isPanning?: boolean
}

/**
 * RotatableImage - Shared component for rendering an image with rotation support
 * 
 * Used by both CropCard (gallery view) and FreeformCanvas (composer view)
 * Uses pixel-based calculations for proper transform-origin positioning
 * Includes lazy loading for original image when rotation is applied
 */
const RotatableImage = memo(function RotatableImage({
    crop,
    currentRotation,
    isRotating,
    filterCss = 'none',
    containerInset = 0,
    showCornerHandles = true,
    hideRotationOverlay = false,
    cropOffsetX = 0,
    cropOffsetY = 0,
    isPanning = false
}: RotatableImageProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

    // Lazy loading state for original image
    const [originalImage, setOriginalImage] = useState<string | null>(null)
    const [isLoadingOriginal, setIsLoadingOriginal] = useState(false)

    // Track container size with ResizeObserver
    useEffect(() => {
        if (!containerRef.current) return

        const updateSize = () => {
            if (containerRef.current) {
                setContainerSize({
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

    // Lazy load original image when rotation or panning offset is applied
    useEffect(() => {
        const needsOriginalImage = currentRotation !== 0 || cropOffsetX !== 0 || cropOffsetY !== 0
        const imageId = crop.imageId
        if (needsOriginalImage && !originalImage && !isLoadingOriginal && imageId) {
            const loadImage = async () => {
                setIsLoadingOriginal(true)
                try {
                    const imageData = await getImage(imageId)
                    if (imageData && imageData.data) {
                        setOriginalImage(imageData.data)
                    }
                } catch (error) {
                    console.error('Failed to lazy-load original image:', error)
                } finally {
                    setIsLoadingOriginal(false)
                }
            }
            loadImage()
        }
    }, [currentRotation, cropOffsetX, cropOffsetY, originalImage, isLoadingOriginal, crop.imageId])

    // Corner handle style (reusable)
    const cornerHandleStyle: CSSProperties = {
        position: 'absolute',
        width: 8,
        height: 8,
        backgroundColor: 'white',
        borderRadius: '50%',
        boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                zIndex: 1
            }}
        >
            {/* Loading indicator */}
            {isLoadingOriginal && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    zIndex: 10
                }}>
                    <div style={{
                        width: 24,
                        height: 24,
                        border: '2px solid #a855f7',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                </div>
            )}

            {/* When rotating or panning with original image available, show original behind selection */}
            {showOriginalImage ? (
                <>
                    {/* Dark overlay - hide when editing corners or just panning */}
                    {!hideRotationOverlay && currentRotation !== 0 && (
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                pointerEvents: 'none',
                                zIndex: 1
                            }}
                        />
                    )}

                    {/* Selection box that clips the rotated/panned original image */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: containerInset,
                            overflow: 'hidden',
                            // Only show selection styling when rotating and not hiding overlay
                            ...((hideRotationOverlay || currentRotation === 0) ? {} : {
                                outline: '2px solid #a855f7',
                                boxShadow: '0 0 0 4px rgba(168, 85, 247, 0.3), 0 4px 20px rgba(0,0,0,0.5)'
                            }),
                            // Show panning indicator border
                            ...(isPanning ? {
                                outline: '2px solid var(--accent-secondary, #10b981)',
                                boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.3)'
                            } : {}),
                            zIndex: 2
                        }}
                    >
                        {/* Original image that rotates/pans - using PIXEL values */}
                        <div
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                width: displayData.displayedOrigWidth,
                                height: displayData.displayedOrigHeight,
                                // Use translate for GPU-accelerated positioning, combined with rotation
                                transform: currentRotation !== 0
                                    ? `translate(${displayData.offsetX}px, ${displayData.offsetY}px) rotate(${-currentRotation}deg)`
                                    : `translate(${displayData.offsetX}px, ${displayData.offsetY}px)`,
                                transformOrigin: currentRotation !== 0
                                    ? `${displayData.cropCenterX - displayData.offsetX}px ${displayData.cropCenterY - displayData.offsetY}px`
                                    : undefined,
                                // No transition during active rotation or panning for instant feedback
                                transition: (isRotating || isPanning) ? 'none' : 'transform 0.15s ease-out',
                                // Use will-change for GPU acceleration during active panning/rotation
                                willChange: (isPanning || isRotating) ? 'transform' : 'auto'
                            }}
                        >
                            <img
                                src={originalImage!}
                                alt=""
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    filter: filterCss,
                                    pointerEvents: 'none'
                                }}
                                draggable={false}
                            />
                        </div>

                        {/* Corner handles inside selection - hide when editing custom corners or panning */}
                        {showCornerHandles && !hideRotationOverlay && !isPanning && currentRotation !== 0 && (
                            <>
                                <div style={{ ...cornerHandleStyle, top: -2, left: -2 }} />
                                <div style={{ ...cornerHandleStyle, top: -2, right: -2 }} />
                                <div style={{ ...cornerHandleStyle, bottom: -2, left: -2 }} />
                                <div style={{ ...cornerHandleStyle, bottom: -2, right: -2 }} />
                            </>
                        )}
                    </div>
                </>
            ) : (
                /* Normal view - just the cropped image */
                <img
                    src={crop.imageData}
                    alt=""
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: filterCss,
                        transform: `rotate(${currentRotation}deg)`,
                        transition: isRotating ? 'none' : 'transform 0.15s ease-out',
                        pointerEvents: 'none'
                    }}
                    draggable={false}
                />
            )}
        </div>
    )
})

export default RotatableImage
