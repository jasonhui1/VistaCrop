/**
 * Export utility for ComposerView canvas
 * Handles rendering placed items and panels to a downloadable PNG
 */
import { getFilterCss } from './filters';
import { drawShapePath } from './frameShapes';
import { getImage } from './api';
import type { Composition, Panel, Crop, PlacedItem } from '../types';

export interface ExportCanvasParams {
    composition: Composition;
    panels: Panel[];
    crops: Crop[];
    mode: 'panels' | 'freeform' | string;
    placedItems?: PlacedItem[];
    basePath?: string;
}

/**
 * Export canvas in panel mode
 */
async function exportPanelMode(
    ctx: CanvasRenderingContext2D,
    composition: Composition,
    panels: Panel[],
    crops: Crop[],
    _basePath: string
): Promise<void> {
    for (const panel of panels) {
        const assignment = composition.assignments[panel.index];
        if (!assignment?.cropId) continue;

        const crop = crops.find(c => String(c.id) === String(assignment.cropId));
        if (!crop || !crop.imageData) continue;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = (err) => reject(err);
            img.src = crop.imageData!;
        });

        ctx.save();
        ctx.filter = getFilterCss(crop.filter);
        ctx.beginPath();
        ctx.rect(panel.x, panel.y, panel.width, panel.height);
        ctx.clip();

        const centerX = panel.x + panel.width / 2;
        const centerY = panel.y + panel.height / 2;
        ctx.translate(centerX, centerY);
        ctx.scale(assignment.zoom, assignment.zoom);
        ctx.translate(assignment.offsetX, assignment.offsetY);

        if (crop.rotation) {
            ctx.rotate((crop.rotation * Math.PI) / 180);
        }

        const scale = Math.max(panel.width / img.width, panel.height / img.height);
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

        ctx.restore();
    }
}

/**
 * Draw border around a placed item
 */
function drawItemBorder(
    ctx: CanvasRenderingContext2D,
    item: PlacedItem,
    shapeId: string
): void {
    const { x, y, width, height } = item;
    const borderStyle = item.borderStyle || 'manga';
    const borderColor = item.borderColor || '#000';
    const borderWidth = item.borderWidth ?? 3;

    if (borderStyle === 'none') return;

    ctx.save();
    drawShapePath(ctx, shapeId, x, y, width, height, item.customPoints || null);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.lineJoin = 'miter';

    if (borderStyle === 'dashed') {
        ctx.setLineDash([borderWidth * 3, borderWidth * 2]);
    }

    ctx.stroke();
    ctx.restore();

    // Draw inner manga-style border
    if (borderStyle === 'manga') {
        const insetAmount = (Math.max(borderWidth, 4) / Math.min(width, height)) * 100;
        ctx.save();
        const insetX = x + (width * insetAmount) / 100;
        const insetY = y + (height * insetAmount) / 100;
        const insetWidth = width * (1 - (2 * insetAmount) / 100);
        const insetHeight = height * (1 - (2 * insetAmount) / 100);
        drawShapePath(ctx, shapeId, insetX, insetY, insetWidth, insetHeight, item.customPoints || null);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = Math.max(1, borderWidth * 0.6);
        ctx.lineJoin = 'miter';
        ctx.stroke();
        ctx.restore();
    }
}

/**
 * Draw item with rotation using original image
 */
async function drawRotatedItem(
    ctx: CanvasRenderingContext2D,
    item: PlacedItem,
    crop: Crop,
    basePath: string
): Promise<void> {
    const { x, y, width, height } = item;
    const rotation = item.rotation ?? crop.rotation ?? 0;

    try {
        if (!crop.imageId) throw new Error('No imageId on crop');
        const originalImageData = await getImage(crop.imageId, basePath);
        if (!originalImageData?.data) throw new Error('No original image data');

        const origImg = new Image();
        origImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
            origImg.onload = () => resolve();
            origImg.onerror = (err) => reject(err);
            origImg.src = originalImageData.data!;
        });

        const scaleX = crop.width > 0 ? width / crop.width : 1;
        const scaleY = crop.height > 0 ? height / crop.height : 1;

        const origW = crop.originalImageWidth || origImg.width;
        const origH = crop.originalImageHeight || origImg.height;
        const cropX = crop.x || 0;
        const cropY = crop.y || 0;
        const cropW = crop.width || 100;
        const cropH = crop.height || 100;

        const displayedOrigWidth = origW * scaleX;
        const displayedOrigHeight = origH * scaleY;
        const cropCenterX = (cropX + cropW / 2) * scaleX;
        const cropCenterY = (cropY + cropH / 2) * scaleY;

        ctx.save();
        ctx.filter = getFilterCss(crop.filter);

        const itemCenterX = x + width / 2;
        const itemCenterY = y + height / 2;
        ctx.translate(itemCenterX, itemCenterY);
        ctx.rotate((-rotation * Math.PI) / 180);
        ctx.drawImage(
            origImg,
            -cropCenterX,
            -cropCenterY,
            displayedOrigWidth,
            displayedOrigHeight
        );
        ctx.restore();
    } catch (error) {
        console.error('Failed to load original image for export:', error);
        // Fallback: draw cropped image without rotation
        if (crop.imageData) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = (err) => reject(err);
                img.src = crop.imageData!;
            });
            ctx.drawImage(img, x, y, width, height);
        }
    }
}

/**
 * Draw item without rotation (using cropped preview)
 */
async function drawNonRotatedItem(
    ctx: CanvasRenderingContext2D,
    crop: Crop,
    x: number,
    y: number,
    width: number,
    height: number
): Promise<void> {
    if (!crop.imageData) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (err) => reject(err);
        img.src = crop.imageData!;
    });

    const imgAspect = img.width / img.height;
    const boxAspect = width / height;
    let drawWidth: number, drawHeight: number, drawX: number, drawY: number;

    if (imgAspect > boxAspect) {
        drawWidth = width;
        drawHeight = width / imgAspect;
        drawX = x;
        drawY = y + (height - drawHeight) / 2;
    } else {
        drawHeight = height;
        drawWidth = height * imgAspect;
        drawX = x + (width - drawWidth) / 2;
        drawY = y;
    }

    ctx.save();
    ctx.filter = getFilterCss(crop.filter);
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();
}

/**
 * Export canvas in freeform mode
 */
async function exportFreeformMode(
    ctx: CanvasRenderingContext2D,
    placedItems: PlacedItem[],
    crops: Crop[],
    basePath: string
): Promise<void> {
    for (const item of placedItems) {
        const crop = crops.find(c => String(c.id) === String(item.cropId));
        if (!crop) continue;

        const rotation = item.rotation ?? crop.rotation ?? 0;
        const { x, y, width, height } = item;
        const shapeId = item.frameShape || 'rectangle';

        ctx.save();

        // Apply polygon clipping for the frame shape
        drawShapePath(ctx, shapeId, x, y, width, height, item.customPoints || null);
        ctx.clip();

        // Draw the image (with or without rotation)
        if (rotation !== 0 && crop.imageId) {
            await drawRotatedItem(ctx, item, crop, basePath);
        } else {
            await drawNonRotatedItem(ctx, crop, x, y, width, height);
        }

        ctx.restore();

        // Draw border on top
        drawItemBorder(ctx, item, shapeId);
    }
}

/**
 * Export the canvas to a PNG file and trigger download
 */
export async function exportCanvas({
    composition,
    panels,
    crops,
    mode,
    placedItems = [],
    basePath = '/api'
}: ExportCanvasParams): Promise<void> {
    const canvas = document.createElement('canvas');
    canvas.width = composition.pageWidth;
    canvas.height = composition.pageHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill background
    ctx.fillStyle = composition.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (mode === 'panels') {
        await exportPanelMode(ctx, composition, panels, crops, basePath);
    } else {
        await exportFreeformMode(ctx, placedItems, crops, basePath);
    }

    // Trigger download
    const link = document.createElement('a');
    link.download = `manga-page-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}
