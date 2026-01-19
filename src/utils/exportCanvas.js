/**
 * Export utility for ComposerView canvas
 * Handles rendering placed items and panels to a downloadable PNG
 */
import { FILTERS } from './filters'
import { drawShapePath } from './frameShapes'
import { getImage } from './api'

/**
 * Export canvas in panel mode
 */
async function exportPanelMode(ctx, composition, panels, crops) {
    for (const panel of panels) {
        const assignment = composition.assignments[panel.index]
        if (!assignment?.cropId) continue

        const crop = crops.find(c => c.id === assignment.cropId)
        if (!crop) continue

        const img = new Image()
        img.crossOrigin = 'anonymous'
        await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = crop.imageData
        })

        ctx.save()
        ctx.filter = FILTERS.find(f => f.id === crop.filter)?.css || 'none'
        ctx.beginPath()
        ctx.rect(panel.x, panel.y, panel.width, panel.height)
        ctx.clip()

        const centerX = panel.x + panel.width / 2
        const centerY = panel.y + panel.height / 2
        ctx.translate(centerX, centerY)
        ctx.scale(assignment.zoom, assignment.zoom)
        ctx.translate(assignment.offsetX, assignment.offsetY)

        if (crop.rotation) {
            ctx.rotate((crop.rotation * Math.PI) / 180)
        }

        const scale = Math.max(panel.width / img.width, panel.height / img.height)
        const drawWidth = img.width * scale
        const drawHeight = img.height * scale
        ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)

        ctx.restore()
    }
}

/**
 * Draw border around a placed item
 */
function drawItemBorder(ctx, item, shapeId, x, y, width, height) {
    const borderStyle = item.borderStyle || 'manga'
    const borderColor = item.borderColor || '#000'
    const borderWidth = item.borderWidth ?? 3

    if (borderStyle === 'none') return

    ctx.save()
    drawShapePath(ctx, shapeId, x, y, width, height, item.customPoints)
    ctx.strokeStyle = borderColor
    ctx.lineWidth = borderWidth
    ctx.lineJoin = 'miter'

    if (borderStyle === 'dashed') {
        ctx.setLineDash([borderWidth * 3, borderWidth * 2])
    }

    ctx.stroke()
    ctx.restore()

    // Draw inner manga-style border
    if (borderStyle === 'manga') {
        const insetAmount = Math.max(borderWidth, 4) / Math.min(width, height) * 100
        ctx.save()
        const insetX = x + (width * insetAmount / 100)
        const insetY = y + (height * insetAmount / 100)
        const insetWidth = width * (1 - 2 * insetAmount / 100)
        const insetHeight = height * (1 - 2 * insetAmount / 100)
        drawShapePath(ctx, shapeId, insetX, insetY, insetWidth, insetHeight, item.customPoints)
        ctx.strokeStyle = borderColor
        ctx.lineWidth = Math.max(1, borderWidth * 0.6)
        ctx.lineJoin = 'miter'
        ctx.stroke()
        ctx.restore()
    }
}

/**
 * Draw item with rotation using original image
 */
async function drawRotatedItem(ctx, item, crop, x, y, width, height, scale = 1) {
    const rotation = item.rotation ?? crop.rotation ?? 0

    try {
        const originalImageData = await getImage(crop.imageId)
        if (!originalImageData?.data) throw new Error('No original image data')

        const origImg = new Image()
        origImg.crossOrigin = 'anonymous'
        await new Promise((resolve, reject) => {
            origImg.onload = resolve
            origImg.onerror = reject
            origImg.src = originalImageData.data
        })

        const scaleX = crop.width > 0 ? width / crop.width : 1
        const scaleY = crop.height > 0 ? height / crop.height : 1

        const origW = crop.originalImageWidth || origImg.width
        const origH = crop.originalImageHeight || origImg.height
        const cropX = crop.x || 0
        const cropY = crop.y || 0
        const cropW = crop.width || 100
        const cropH = crop.height || 100

        const displayedOrigWidth = origW * scaleX
        const displayedOrigHeight = origH * scaleY
        const cropCenterX = (cropX + cropW / 2) * scaleX
        const cropCenterY = (cropY + cropH / 2) * scaleY

        ctx.save()
        ctx.filter = FILTERS.find(f => f.id === crop.filter)?.css || 'none'

        const itemCenterX = x + width / 2
        const itemCenterY = y + height / 2
        ctx.translate(itemCenterX, itemCenterY)
        ctx.rotate((-rotation * Math.PI) / 180)
        ctx.drawImage(
            origImg,
            -cropCenterX,
            -cropCenterY,
            displayedOrigWidth,
            displayedOrigHeight
        )
        ctx.restore()
    } catch (error) {
        console.error('Failed to load original image for export:', error)
        // Fallback: draw cropped image without rotation
        const img = new Image()
        img.crossOrigin = 'anonymous'
        await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = crop.imageData
        })
        ctx.drawImage(img, x, y, width, height)
    }
}

/**
 * Draw item without rotation (using cropped preview)
 */
async function drawNonRotatedItem(ctx, crop, x, y, width, height) {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = crop.imageData
    })

    const imgAspect = img.width / img.height
    const boxAspect = width / height
    let drawWidth, drawHeight, drawX, drawY

    if (imgAspect > boxAspect) {
        drawWidth = width
        drawHeight = width / imgAspect
        drawX = x
        drawY = y + (height - drawHeight) / 2
    } else {
        drawHeight = height
        drawWidth = height * imgAspect
        drawX = x + (width - drawWidth) / 2
        drawY = y
    }

    ctx.save()
    ctx.filter = FILTERS.find(f => f.id === crop.filter)?.css || 'none'
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
    ctx.restore()
}

/**
 * Export canvas in freeform mode
 */
async function exportFreeformMode(ctx, placedItems, crops, scale = 1) {
    for (const item of placedItems) {
        const crop = crops.find(c => c.id === item.cropId)
        if (!crop) continue

        const rotation = item.rotation ?? crop.rotation ?? 0
        // Scale all coordinates for thumbnail mode
        const x = item.x * scale
        const y = item.y * scale
        const width = item.width * scale
        const height = item.height * scale
        const shapeId = item.frameShape || 'rectangle'

        ctx.save()

        // Apply polygon clipping for the frame shape
        drawShapePath(ctx, shapeId, x, y, width, height, item.customPoints)
        ctx.clip()

        // Draw the image (with or without rotation)
        if (rotation !== 0 && crop.imageId) {
            await drawRotatedItem(ctx, item, crop, x, y, width, height, scale)
        } else {
            await drawNonRotatedItem(ctx, crop, x, y, width, height)
        }

        ctx.restore()

        // Draw border on top (scale border width too)
        const scaledItem = scale !== 1 ? {
            ...item,
            borderWidth: (item.borderWidth ?? 3) * scale
        } : item
        drawItemBorder(ctx, scaledItem, shapeId, x, y, width, height)
    }
}

/**
 * Render the canvas content to an off-screen canvas
 * @returns {HTMLCanvasElement} The rendered canvas element
 */
async function renderCanvas({ composition, panels, crops, mode, placedItems, scale = 1 }) {
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(composition.pageWidth * scale)
    canvas.height = Math.round(composition.pageHeight * scale)
    const ctx = canvas.getContext('2d')

    // Fill background
    ctx.fillStyle = composition.backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (mode === 'panels') {
        await exportPanelMode(ctx, composition, panels, crops)
    } else {
        await exportFreeformMode(ctx, placedItems, crops, scale)
    }

    return canvas
}

/**
 * Export the canvas to a PNG file and trigger download
 */
export async function exportCanvas({ composition, panels, crops, mode, placedItems }) {
    const canvas = await renderCanvas({ composition, panels, crops, mode, placedItems, scale: 1 })

    // Trigger download
    const link = document.createElement('a')
    link.download = `manga-page-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
}

/**
 * Export all pages to separate PNG files
 */
export async function exportAllPages({ pages, crops, mode }) {
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i]
        const composition = {
            pageWidth: page.pageWidth,
            pageHeight: page.pageHeight,
            backgroundColor: page.backgroundColor,
            layoutId: page.layoutId || 'single',
            assignments: page.assignments || [],
            margin: page.margin || 40
        }

        const canvas = await renderCanvas({
            composition,
            panels: [], // Freeform mode doesn't use panels
            crops,
            mode,
            placedItems: page.placedItems || [],
            scale: 1
        })

        const link = document.createElement('a')
        link.download = `page-${i + 1}-${Date.now()}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()

        // Small delay between downloads to prevent browser issues
        if (i < pages.length - 1) {
            await new Promise(r => setTimeout(r, 200))
        }
    }
}

/**
 * Generate a thumbnail of the canvas
 * @param {Object} params - Same as exportCanvas
 * @param {number} [maxWidth=800] - Maximum thumbnail width
 * @param {number} [maxHeight=600] - Maximum thumbnail height
 * @returns {Promise<string|null>} Base64 data URL of the thumbnail or null on error
 */
export async function generateThumbnail({
    composition,
    panels,
    crops,
    mode,
    placedItems,
    maxWidth = 800,
    maxHeight = 600
}) {
    if (!composition || !placedItems || placedItems.length === 0) {
        return null
    }

    try {
        // Calculate scale to fit thumbnail dimensions while maintaining aspect ratio
        const pageWidth = composition.pageWidth || 1000
        const pageHeight = composition.pageHeight || 1000
        const scaleX = maxWidth / pageWidth
        const scaleY = maxHeight / pageHeight
        const scale = Math.min(scaleX, scaleY, 1) // Never upscale

        const canvas = await renderCanvas({ composition, panels, crops, mode, placedItems, scale })

        // Return as base64 data URL (WebP for better quality at smaller size)
        return canvas.toDataURL('image/webp', 0.9)
    } catch (error) {
        console.error('Failed to generate thumbnail:', error)
        return null
    }
}
