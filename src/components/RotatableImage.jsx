import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { getImage } from '../utils/api'

// Constants for display calculations
const DEFAULT_IMAGE_DIMENSION = 1000 // fallback when original dimensions unavailable

/**
 * RotatableImage - Shared component for rendering an image with rotation support
 * 
 * Used by both CropCard (gallery view) and FreeformCanvas (composer view)
 * Uses pixel-based calculations for proper transform-origin positioning
 * Includes lazy loading for original image when rotation is applied
 * 
 * @param {Object} crop - The crop data object containing image info
 * @param {number} currentRotation - Current rotation angle in degrees
 * @param {boolean} isRotating - Whether user is currently dragging to rotate
 * @param {string} filterCss - CSS filter string to apply (optional, defaults to 'none')
 * @param {number} containerInset - Inset in pixels for selection box (0 for freeform, 12 for CropCard)
 * @param {boolean} showCornerHandles - Whether to show corner handles on selection box
 * @param {boolean} hideRotationOverlay - Whether to hide the rotation overlay (e.g., when editing corners)
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
}) {
    const containerRef = useRef(null)
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

    // Lazy loading state for original image
    const [originalImage, setOriginalImage] = useState(null)
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

    // Lazy load original image when rotation is applied
    useEffect(() => {
        if (currentRotation !== 0 && !originalImage && !isLoadingOriginal && crop.imageId) {
            const loadImage = async () => {
                setIsLoadingOriginal(true)
                try {
                    const imageData = await getImage(crop.imageId)
                    if (imageData && imageData.data) {
                        setOriginalImage(imageData.data)
                    }
                } catch (error) {
                    console.error('Failed to lazy-load original image for rotation:', error)
                } finally {
                    setIsLoadingOriginal(false)
                }
            }
            loadImage()
        }
    }, [currentRotation, originalImage, isLoadingOriginal, crop.imageId])

    // Calculate rotation display data (pixel-based)
    // When hideRotationOverlay is true, we still need the data to render the rotated image correctly
    // We just hide the overlay UI elements (dark background, selection box, corner handles)
    // Calculate display data for both rotation and panning
    const displayData = useMemo(() => {
        const containerWidth = containerSize.width || 100
        const containerHeight = containerSize.height || 100

        // Calculate the box dimensions (accounting for inset)
        const boxWidth = containerWidth - (containerInset * 2)
        const boxHeight = containerHeight - (containerInset * 2)

        // Scale factors to map crop coordinates to container pixels
        const scaleX = crop.width > 0 ? boxWidth / crop.width : 1
        const scaleY = crop.height > 0 ? boxHeight / crop.height : 1

        const origW = crop.originalImageWidth || DEFAULT_IMAGE_DIMENSION
        const origH = crop.originalImageHeight || DEFAULT_IMAGE_DIMENSION
        const cropX = (crop.x || 0) + cropOffsetX
        const cropY = (crop.y || 0) + cropOffsetY
        const cropW = crop.width || 100
        const cropH = crop.height || 100

        return {
            displayedOrigWidth: origW * scaleX,
            displayedOrigHeight: origH * scaleY,
            offsetX: -cropX * scaleX,
            offsetY: -cropY * scaleY,
            cropCenterX: (cropX + cropW / 2) * scaleX,
            cropCenterY: (cropY + cropH / 2) * scaleY,
            scaleX,
            scaleY
        }
    }, [containerSize, containerInset, crop.width, crop.height, crop.x, crop.y, crop.originalImageWidth, crop.originalImageHeight, cropOffsetX, cropOffsetY])

    // Determine if we need to show the original image (rotation or panning with offset)
    const showOriginalImage = (currentRotation !== 0 || cropOffsetX !== 0 || cropOffsetY !== 0) && originalImage

    // For panning preview, also load original image
    useEffect(() => {
        if ((cropOffsetX !== 0 || cropOffsetY !== 0) && !originalImage && !isLoadingOriginal && crop.imageId) {
            const loadImage = async () => {
                setIsLoadingOriginal(true)
                try {
                    const imageData = await getImage(crop.imageId)
                    if (imageData && imageData.data) {
                        setOriginalImage(imageData.data)
                    }
                } catch (error) {
                    console.error('Failed to lazy-load original image for panning:', error)
                } finally {
                    setIsLoadingOriginal(false)
                }
            }
            loadImage()
        }
    }, [cropOffsetX, cropOffsetY, originalImage, isLoadingOriginal, crop.imageId])

    // Corner handle style (reusable)
    const cornerHandleStyle = {
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
                                src={originalImage}
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
