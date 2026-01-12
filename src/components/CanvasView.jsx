import { useRef, useState, useEffect, useCallback } from 'react'

function CanvasView({ image, onAddCrop, onImageUpload }) {
    const containerRef = useRef(null)
    const canvasRef = useRef(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isRotating, setIsRotating] = useState(false)
    const [isDraggingOver, setIsDraggingOver] = useState(false)
    const initialRotationRef = useRef({ angle: 0, startAngle: 0 })
    const [selection, setSelection] = useState(null)
    const [selectionRotation, setSelectionRotation] = useState(0)
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
    const [displaySize, setDisplaySize] = useState({ width: 0, height: 0, offsetX: 0, offsetY: 0 })

    useEffect(() => {
        if (!image || !containerRef.current) return

        const img = new Image()
        img.onload = () => {
            setImageSize({ width: img.width, height: img.height })

            const container = containerRef.current
            const containerWidth = container.clientWidth - 48
            const containerHeight = container.clientHeight - 48

            const scale = Math.min(
                containerWidth / img.width,
                containerHeight / img.height,
                1
            )

            const displayWidth = img.width * scale
            const displayHeight = img.height * scale
            const offsetX = (containerWidth - displayWidth) / 2 + 24
            const offsetY = (containerHeight - displayHeight) / 2 + 24

            setDisplaySize({
                width: displayWidth,
                height: displayHeight,
                offsetX,
                offsetY,
                scale
            })
        }
        img.src = image
    }, [image])

    const getMousePosition = useCallback((e) => {
        const rect = containerRef.current.getBoundingClientRect()
        return {
            x: e.clientX - rect.left - displaySize.offsetX,
            y: e.clientY - rect.top - displaySize.offsetY
        }
    }, [displaySize])

    const handleMouseDown = useCallback((e) => {
        if (!image) return
        const pos = getMousePosition(e)

        // Check if we have an existing selection
        const rect = getSelectionRect()

        if (rect && rect.width > 10 && rect.height > 10) {
            // Check if click is OUTSIDE the selection - start rotation mode
            const isOutsideSelection =
                pos.x < rect.x || pos.x > rect.x + rect.width ||
                pos.y < rect.y || pos.y > rect.y + rect.height

            if (isOutsideSelection) {
                // Calculate initial angle from selection center to mouse
                const angleToMouse = Math.atan2(
                    pos.y - rect.centerY,
                    pos.x - rect.centerX
                ) * (180 / Math.PI)

                initialRotationRef.current = {
                    angle: selectionRotation,
                    startAngle: angleToMouse
                }
                setIsRotating(true)
                return
            }
        }

        // Otherwise, start a new selection if within image bounds
        if (pos.x < 0 || pos.y < 0 || pos.x > displaySize.width || pos.y > displaySize.height) return

        setIsDragging(true)
        setSelection({
            startX: pos.x,
            startY: pos.y,
            endX: pos.x,
            endY: pos.y
        })
        setSelectionRotation(0)
    }, [image, getMousePosition, displaySize, selectionRotation, selection])

    const handleMouseMove = useCallback((e) => {
        const pos = getMousePosition(e)

        if (isRotating) {
            const rect = getSelectionRect()
            if (!rect) return

            // Calculate current angle from selection center to mouse
            const currentAngle = Math.atan2(
                pos.y - rect.centerY,
                pos.x - rect.centerX
            ) * (180 / Math.PI)

            // Calculate rotation delta
            const angleDelta = currentAngle - initialRotationRef.current.startAngle
            let newRotation = initialRotationRef.current.angle + angleDelta

            // Normalize to -180 to 180
            while (newRotation > 180) newRotation -= 360
            while (newRotation < -180) newRotation += 360

            setSelectionRotation(newRotation)
            return
        }

        if (!isDragging || !selection) return
        const clampedX = Math.max(0, Math.min(pos.x, displaySize.width))
        const clampedY = Math.max(0, Math.min(pos.y, displaySize.height))

        setSelection(prev => ({
            ...prev,
            endX: clampedX,
            endY: clampedY
        }))
    }, [isDragging, isRotating, selection, getMousePosition, displaySize])

    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
        setIsRotating(false)
    }, [])

    const handleDragOver = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!isDraggingOver) {
            console.log('Drag over started')
            setIsDraggingOver(true)
        }
    }, [isDraggingOver])

    const handleDragLeave = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()

        // Only set to false if we actually leave the container
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
            const isOutside =
                e.clientX <= rect.left ||
                e.clientX >= rect.right ||
                e.clientY <= rect.top ||
                e.clientY >= rect.bottom;

            if (isOutside) {
                console.log('Drag leave confirmed outside container')
                setIsDraggingOver(false)
            }
        }
    }, [])

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        console.log('Drop event fired', e.dataTransfer.files)
        setIsDraggingOver(false)

        const file = e.dataTransfer.files?.[0]
        if (file && file.type.startsWith('image/')) {
            console.log('Processing image file:', file.name)
            const reader = new FileReader()
            reader.onload = (event) => {
                onImageUpload(event.target.result)
            }
            reader.readAsDataURL(file)
        } else {
            console.warn('Dropped item is not an image file')
        }
    }, [onImageUpload])

    const getSelectionRect = () => {
        if (!selection) return null
        const x = Math.min(selection.startX, selection.endX)
        const y = Math.min(selection.startY, selection.endY)
        const width = Math.abs(selection.endX - selection.startX)
        const height = Math.abs(selection.endY - selection.startY)
        const centerX = x + width / 2
        const centerY = y + height / 2
        return { x, y, width, height, centerX, centerY }
    }

    const handleCreateCrop = useCallback(() => {
        const rect = getSelectionRect()
        if (!rect || rect.width < 10 || rect.height < 10) return

        const scale = displaySize.scale
        const originalCenterX = rect.centerX / scale
        const originalCenterY = rect.centerY / scale
        const originalWidth = rect.width / scale
        const originalHeight = rect.height / scale

        const canvas = document.createElement('canvas')
        const radians = (selectionRotation * Math.PI) / 180
        const cos = Math.abs(Math.cos(radians))
        const sin = Math.abs(Math.sin(radians))
        const rotatedWidth = Math.ceil(originalWidth * cos + originalHeight * sin)
        const rotatedHeight = Math.ceil(originalHeight * cos + originalWidth * sin)

        canvas.width = rotatedWidth
        canvas.height = rotatedHeight
        const ctx = canvas.getContext('2d')

        const img = new Image()
        img.onload = () => {
            ctx.translate(rotatedWidth / 2, rotatedHeight / 2)
            ctx.rotate(radians)
            ctx.drawImage(img, -originalCenterX, -originalCenterY)

            const clipCanvas = document.createElement('canvas')
            clipCanvas.width = Math.ceil(originalWidth)
            clipCanvas.height = Math.ceil(originalHeight)
            const clipCtx = clipCanvas.getContext('2d')

            clipCtx.drawImage(
                canvas,
                (rotatedWidth - originalWidth) / 2,
                (rotatedHeight - originalHeight) / 2,
                originalWidth,
                originalHeight,
                0,
                0,
                originalWidth,
                originalHeight
            )

            onAddCrop({
                imageData: clipCanvas.toDataURL('image/png'),
                x: Math.round(originalCenterX - originalWidth / 2),
                y: Math.round(originalCenterY - originalHeight / 2),
                width: Math.round(originalWidth),
                height: Math.round(originalHeight),
                sourceRotation: selectionRotation,
                originalImageWidth: imageSize.width,
                originalImageHeight: imageSize.height
            })

            setSelection(null)
            setSelectionRotation(0)
        }
        img.src = image
    }, [selection, selectionRotation, displaySize, image, onAddCrop])

    const selectionRect = getSelectionRect()

    if (!image) {
        return (
            <div
                ref={containerRef}
                className={`glass-card flex-1 flex flex-col items-center justify-center gap-6 transition-all duration-300 ${isDraggingOver ? 'bg-purple-500/10 border-2 border-dashed border-purple-500/50' : ''
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center transition-transform duration-300 ${isDraggingOver ? 'scale-110' : ''}`}>
                    <svg className={`w-12 h-12 transition-colors duration-300 ${isDraggingOver ? 'text-purple-400' : 'text-[var(--accent-secondary)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-bold gradient-text mb-2">
                        {isDraggingOver ? 'Drop artwork to upload' : 'No Artwork Selected'}
                    </h2>
                    <p className="text-[var(--text-secondary)]">
                        {isDraggingOver ? 'Release to start exploring' : 'Upload or drag and drop an artwork to start exploring details'}
                    </p>
                </div>
                {!isDraggingOver && (
                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Click the "Upload Artwork" button in the header
                    </div>
                )}
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            className={`glass-card flex-1 relative cursor-crosshair overflow-hidden transition-all duration-300 ${isDraggingOver ? 'bg-purple-500/10 outline-2 outline-dashed outline-purple-500/50 outline-offset-[-2px]' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Image */}
            <img
                ref={canvasRef}
                src={image}
                alt="Artwork"
                className="absolute pointer-events-none select-none"
                style={{
                    left: displaySize.offsetX,
                    top: displaySize.offsetY,
                    width: displaySize.width,
                    height: displaySize.height
                }}
                draggable={false}
            />

            {/* Drop Overlay for existing image */}
            {isDraggingOver && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-purple-900/40 backdrop-blur-sm pointer-events-none">
                    <div className="bg-[var(--bg-primary)] p-8 rounded-2xl shadow-2xl border border-purple-500/30 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-white mb-1">Drop to Upload</h3>
                            <p className="text-purple-200 text-sm">Replace current artwork</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Selection overlay */}
            {selectionRect && selectionRect.width > 0 && selectionRect.height > 0 && !isDraggingOver && (
                <>
                    {/* Full dark overlay */}
                    <div
                        className="absolute bg-black/60 pointer-events-none"
                        style={{
                            left: displaySize.offsetX,
                            top: displaySize.offsetY,
                            width: displaySize.width,
                            height: displaySize.height
                        }}
                    />

                    {/* Rotated selection preview - shows what will be cropped */}
                    <div
                        className="absolute pointer-events-none overflow-hidden"
                        style={{
                            left: displaySize.offsetX + selectionRect.centerX,
                            top: displaySize.offsetY + selectionRect.centerY,
                            width: selectionRect.width,
                            height: selectionRect.height,
                            transform: `translate(-50%, -50%) rotate(${selectionRotation}deg)`,
                            transformOrigin: 'center center',
                            outline: '2px solid #a855f7',
                            boxShadow: '0 0 0 4px rgba(168, 85, 247, 0.3), 0 4px 20px rgba(0,0,0,0.5)'
                        }}
                    >
                        {/* Image inside the rotated box - counter-rotated to show correct preview */}
                        <div
                            className="absolute"
                            style={{
                                width: displaySize.width,
                                height: displaySize.height,
                                left: -(selectionRect.centerX - selectionRect.width / 2),
                                top: -(selectionRect.centerY - selectionRect.height / 2),
                                transform: `rotate(${-selectionRotation}deg)`,
                                transformOrigin: `${selectionRect.centerX}px ${selectionRect.centerY}px`
                            }}
                        >
                            <img
                                src={image}
                                alt=""
                                className="pointer-events-none"
                                style={{
                                    width: displaySize.width,
                                    height: displaySize.height
                                }}
                                draggable={false}
                            />
                        </div>

                        {/* Corner handles */}
                        <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white rounded-full shadow-lg" />
                        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white rounded-full shadow-lg" />
                        <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white rounded-full shadow-lg" />
                        <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white rounded-full shadow-lg" />
                    </div>

                    {/* Rotation angle badge */}
                    {selectionRotation !== 0 && (
                        <div
                            className="absolute bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full pointer-events-none z-10"
                            style={{
                                left: displaySize.offsetX + selectionRect.centerX,
                                top: displaySize.offsetY + selectionRect.y - 20,
                                transform: 'translateX(-50%)'
                            }}
                        >
                            {Math.round(selectionRotation)}°
                        </div>
                    )}
                </>
            )}

            {/* Bottom controls */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end gap-4 pointer-events-none">
                <div className="bg-[var(--bg-primary)]/90 backdrop-blur-sm px-4 py-3 rounded-xl text-sm text-[var(--text-secondary)] pointer-events-auto">
                    {selectionRect && selectionRect.width > 10 && selectionRect.height > 10 ? (
                        <>
                            <span className="text-[var(--accent-secondary)]">Drag outside selection</span> to rotate
                        </>
                    ) : (
                        <>
                            <span className="text-[var(--accent-secondary)]">Click and drag</span> to select an area
                        </>
                    )}
                </div>

                {selectionRect && selectionRect.width > 10 && selectionRect.height > 10 && (
                    <div className="flex items-center gap-4 pointer-events-auto">
                        {/* Rotation display */}
                        <div className="bg-[var(--bg-primary)]/90 backdrop-blur-sm px-4 py-3 rounded-xl flex items-center gap-2">
                            <svg className="w-4 h-4 text-[var(--accent-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="text-[var(--accent-secondary)] font-semibold">{Math.round(selectionRotation)}°</span>
                        </div>

                        <button
                            onClick={handleCreateCrop}
                            className="btn btn-primary"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Crop
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CanvasView
