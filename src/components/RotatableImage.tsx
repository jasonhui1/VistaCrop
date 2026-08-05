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
    showCornerHandles = false,
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
        const observer = new ResizeObserver(updateSize)
        observer.observe(containerRef.current)

        return () => observer.disconnect()
    }, [])

    // Dedicated image loader helper
    useEffect(() => {
        const needsOriginalImage = currentRotation !== 0 || isRotating || cropOffsetX !== 0 || cropOffsetY !== 0 || isPanning
        if (needsOriginalImage && crop.imageId && !originalImage && !isLoadingOriginal) {
            let isSubscribed = true
            const loadImage = async () => {
                setIsLoadingOriginal(true)
                try {
                    const imageData = await getImage(crop.imageId!)
                    if (isSubscribed && imageData && imageData.data) {
                        setOriginalImage(imageData.data)
                    }
                } catch (error) {
                    console.error('Failed to load original image for rotation:', error)
                } finally {
                    if (isSubscribed) {
                        setIsLoadingOriginal(false)
                    }
                }
            }
            loadImage()
            return () => {
                isSubscribed = false
            }
        }
    }, [currentRotation, isRotating, cropOffsetX, cropOffsetY, isPanning, originalImage, isLoadingOriginal, crop.imageId])

    // Corner handle style (reusable)
    const cornerHandleStyle: CSSProperties = {
        position: 'absolute',
        width: 8,
        height: 8,
        backgroundColor: '#ec4899',
        border: '1px solid white',
        borderRadius: '50%',
        boxShadow: '0 0 4px rgba(0,0,0,0.5)',
        zIndex: 20
    }

    // Determine effective image dimensions
    const imgWidth = crop.originalImageWidth || DEFAULT_IMAGE_DIMENSION
    const imgHeight = crop.originalImageHeight || DEFAULT_IMAGE_DIMENSION

    // Calculate crop relative positions
    const cropX = crop.x !== undefined ? crop.x : 0
    const cropY = crop.y !== undefined ? crop.y : 0
    const cropW = crop.width
    const cropH = crop.height

    // Calculate scale factor between full image coordinates and rendered container coordinates
    const displayWidth = containerSize.width || 100
    const displayHeight = containerSize.height || 100
    const scale = displayWidth / cropW

    // Calculate the center point of the crop selection in container coordinates
    const originXInContainer = displayWidth / 2
    const originYInContainer = displayHeight / 2

    // Calculate the offset from top-left of full image to the center of the crop
    const cropCenterXInFullImage = cropX + cropW / 2
    const cropCenterYInFullImage = cropY + cropH / 2

    // Compute scaled dimensions for full image
    const fullImageScaledWidth = imgWidth * scale
    const fullImageScaledHeight = imgHeight * scale

    // Compute top-left position of the full image relative to container origin
    const fullImageLeft = originXInContainer - (cropCenterXInFullImage * scale) + cropOffsetX
    const fullImageTop = originYInContainer - (cropCenterYInFullImage * scale) + cropOffsetY

    const isRotated = currentRotation !== 0

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden select-none bg-black/20"
        >
            {/* Base Crop Image */}
            <div
                className="w-full h-full"
                style={{
                    filter: filterCss,
                    opacity: isRotated || cropOffsetX !== 0 || cropOffsetY !== 0 || isPanning ? 0 : 1
                }}
            >
                <img
                    src={crop.imageData}
                    alt=""
                    className="w-full h-full object-cover"
                    draggable={false}
                />
            </div>

            {/* Rotated Full Image Layer */}
            {(isRotated || cropOffsetX !== 0 || cropOffsetY !== 0 || isPanning) && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        filter: filterCss
                    }}
                >
                    {originalImage ? (
                        <div
                            style={{
                                position: 'absolute',
                                left: fullImageLeft,
                                top: fullImageTop,
                                width: fullImageScaledWidth,
                                height: fullImageScaledHeight,
                                transformOrigin: `${cropCenterXInFullImage * scale}px ${cropCenterYInFullImage * scale}px`,
                                transform: `rotate(${currentRotation}deg)`,
                                willChange: 'transform'
                            }}
                        >
                            <img
                                src={originalImage}
                                alt=""
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'fill',
                                    display: 'block'
                                }}
                                draggable={false}
                            />
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-black/40 text-white/70 text-xs">
                            {isLoadingOriginal ? 'Loading high-res...' : 'Rotation unavailable'}
                        </div>
                    )}
                </div>
            )}

            {/* Selection Box Overlay */}
            {containerSize.width > 0 && (
                <div
                    className="absolute pointer-events-none transition-opacity duration-150"
                    style={{
                        left: containerInset,
                        top: containerInset,
                        right: containerInset,
                        bottom: containerInset,
                        border: isRotating ? '2px solid #8b5cf6' : (isPanning ? '2px solid #ec4899' : '1px solid rgba(255,255,255,0.4)'),
                        boxShadow: isRotating ? '0 0 12px rgba(139, 92, 246, 0.5)' : (isPanning ? '0 0 12px rgba(236, 72, 153, 0.5)' : 'none'),
                        borderRadius: 4
                    }}
                >
                    {showCornerHandles && (
                        <>
                            <div style={{ ...cornerHandleStyle, top: -4, left: -4 }} />
                            <div style={{ ...cornerHandleStyle, top: -4, right: -4 }} />
                            <div style={{ ...cornerHandleStyle, bottom: -4, left: -4 }} />
                            <div style={{ ...cornerHandleStyle, bottom: -4, right: -4 }} />
                        </>
                    )}
                </div>
            )}

            {/* Rotation Angle Overlay */}
            {!hideRotationOverlay && (isRotating || isRotated) && (
                <div className="absolute top-2 left-2 bg-black/75 text-white px-2 py-1 rounded text-xs font-mono backdrop-blur-sm z-30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    {Math.round(currentRotation)}°
                </div>
            )}
        </div>
    )
})

export default RotatableImage
