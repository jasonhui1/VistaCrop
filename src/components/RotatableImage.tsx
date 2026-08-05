import { memo, useEffect, useMemo, useRef, useState, CSSProperties } from 'react'
import { useStorageAdapter } from '../lib/storage'
import { Crop } from '../types'

const DEFAULT_IMAGE_DIMENSION = 1000

export type CropData = Crop

export interface RotatableImageProps {
    crop: Crop
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
    const storageAdapter = useStorageAdapter()
    const containerRef = useRef<HTMLDivElement>(null)
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
    const [originalImage, setOriginalImage] = useState<string | null>(null)
    const [isLoadingOriginal, setIsLoadingOriginal] = useState(false)

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

    useEffect(() => {
        const needsOriginalImage = currentRotation !== 0 || cropOffsetX !== 0 || cropOffsetY !== 0
        const imageId = crop.imageId
        if (needsOriginalImage && !originalImage && !isLoadingOriginal && imageId) {
            const loadImage = async () => {
                setIsLoadingOriginal(true)
                try {
                    const imageData = await storageAdapter.getImage(imageId)
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
    }, [currentRotation, cropOffsetX, cropOffsetY, originalImage, isLoadingOriginal, crop.imageId, storageAdapter])

    const displayData = useMemo(() => {
        const containerWidth = containerSize.width || 100
        const containerHeight = containerSize.height || 100

        const boxWidth = containerWidth - (containerInset * 2)
        const boxHeight = containerHeight - (containerInset * 2)

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

    const showOriginalImage = (currentRotation !== 0 || cropOffsetX !== 0 || cropOffsetY !== 0) && originalImage

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

            {showOriginalImage ? (
                <>
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

                    <div
                        style={{
                            position: 'absolute',
                            inset: containerInset,
                            overflow: 'hidden',
                            ...((hideRotationOverlay || currentRotation === 0) ? {} : {
                                outline: '2px solid #a855f7',
                                boxShadow: '0 0 0 4px rgba(168, 85, 247, 0.3), 0 4px 20px rgba(0,0,0,0.5)'
                            }),
                            ...(isPanning ? {
                                outline: '2px solid var(--accent-secondary, #10b981)',
                                boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.3)'
                            } : {}),
                            zIndex: 2
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                width: displayData.displayedOrigWidth,
                                height: displayData.displayedOrigHeight,
                                transform: currentRotation !== 0
                                    ? `translate(${displayData.offsetX}px, ${displayData.offsetY}px) rotate(${-currentRotation}deg)`
                                    : `translate(${displayData.offsetX}px, ${displayData.offsetY}px)`,
                                transformOrigin: currentRotation !== 0
                                    ? `${displayData.cropCenterX - displayData.offsetX}px ${displayData.cropCenterY - displayData.offsetY}px`
                                    : undefined,
                                transition: (isRotating || isPanning) ? 'none' : 'transform 0.15s ease-out',
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
