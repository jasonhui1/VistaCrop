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
 */
const RotatableImage = memo(function RotatableImage({
    crop,
    currentRotation,
    isRotating,
    filterCss = 'none',
    containerInset = 0,
    showCornerHandles = true
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
    const rotationDisplayData = useMemo(() => {
        if (currentRotation === 0 || !originalImage) return null

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
        const cropX = crop.x || 0
        const cropY = crop.y || 0
        const cropW = crop.width || 100
        const cropH = crop.height || 100

        return {
            displayedOrigWidth: origW * scaleX,
            displayedOrigHeight: origH * scaleY,
            offsetX: -cropX * scaleX,
            offsetY: -cropY * scaleY,
            cropCenterX: (cropX + cropW / 2) * scaleX,
            cropCenterY: (cropY + cropH / 2) * scaleY
        }
    }, [currentRotation, originalImage, containerSize, containerInset, crop.width, crop.height, crop.x, crop.y, crop.originalImageWidth, crop.originalImageHeight])

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

            {/* When rotating with original image available, show original behind selection */}
            {rotationDisplayData ? (
                <>
                    {/* Dark overlay */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            pointerEvents: 'none',
                            zIndex: 1
                        }}
                    />

                    {/* Selection box that clips the rotated original image */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: containerInset,
                            overflow: 'hidden',
                            outline: '2px solid #a855f7',
                            boxShadow: '0 0 0 4px rgba(168, 85, 247, 0.3), 0 4px 20px rgba(0,0,0,0.5)',
                            zIndex: 2
                        }}
                    >
                        {/* Original image that rotates - using PIXEL values */}
                        <div
                            style={{
                                position: 'absolute',
                                left: rotationDisplayData.offsetX,
                                top: rotationDisplayData.offsetY,
                                width: rotationDisplayData.displayedOrigWidth,
                                height: rotationDisplayData.displayedOrigHeight,
                                transform: `rotate(${-currentRotation}deg)`,
                                transformOrigin: `${rotationDisplayData.cropCenterX}px ${rotationDisplayData.cropCenterY}px`,
                                transition: isRotating ? 'none' : 'transform 0.15s ease-out'
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

                        {/* Corner handles inside selection */}
                        {showCornerHandles && (
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
