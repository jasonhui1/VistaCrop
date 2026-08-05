

import { Point2D, FrameShape, PlacedItem } from '../types';

export const FRAME_SHAPES: Record<string, FrameShape> = {
    rectangle: {
        id: 'rectangle',
        name: 'Rectangle',
        icon: '▯',
        points: [
            [0, 0],
            [100, 0],
            [100, 100],
            [0, 100]
        ]
    },

    'diagonal-tr': {
        id: 'diagonal-tr',
        name: 'Diagonal TR',
        icon: '◸',
        points: [
            [0, 0],
            [100, 15],
            [100, 100],
            [0, 100]
        ]
    },

    'diagonal-tl': {
        id: 'diagonal-tl',
        name: 'Diagonal TL',
        icon: '◹',
        points: [
            [0, 15],
            [100, 0],
            [100, 100],
            [0, 100]
        ]
    },

    'diagonal-br': {
        id: 'diagonal-br',
        name: 'Diagonal BR',
        icon: '◿',
        points: [
            [0, 0],
            [100, 0],
            [100, 85],
            [0, 100]
        ]
    },

    'diagonal-bl': {
        id: 'diagonal-bl',
        name: 'Diagonal BL',
        icon: '◺',
        points: [
            [0, 0],
            [100, 0],
            [100, 100],
            [0, 85]
        ]
    },

    'diagonal-double': {
        id: 'diagonal-double',
        name: 'Double Diagonal',
        icon: '⬠',
        points: [
            [0, 12],
            [100, 0],
            [100, 88],
            [0, 100]
        ]
    },

    'parallelogram-right': {
        id: 'parallelogram-right',
        name: 'Slant Right',
        icon: '▱',
        points: [
            [12, 0],
            [100, 0],
            [88, 100],
            [0, 100]
        ]
    },

    'parallelogram-left': {
        id: 'parallelogram-left',
        name: 'Slant Left',
        icon: '▰',
        points: [
            [0, 0],
            [88, 0],
            [100, 100],
            [12, 100]
        ]
    },

    'trapezoid-top': {
        id: 'trapezoid-top',
        name: 'Trapezoid Top',
        icon: '⏢',
        points: [
            [10, 0],
            [90, 0],
            [100, 100],
            [0, 100]
        ]
    },

    'trapezoid-bottom': {
        id: 'trapezoid-bottom',
        name: 'Trapezoid Bottom',
        icon: '⏣',
        points: [
            [0, 0],
            [100, 0],
            [90, 100],
            [10, 100]
        ]
    },

    pentagon: {
        id: 'pentagon',
        name: 'Pentagon',
        icon: '⬠',
        points: [
            [50, 0],
            [100, 35],
            [82, 100],
            [18, 100],
            [0, 35]
        ]
    },

    hexagon: {
        id: 'hexagon',
        name: 'Hexagon',
        icon: '⬡',
        points: [
            [25, 0],
            [75, 0],
            [100, 50],
            [75, 100],
            [25, 100],
            [0, 50]
        ]
    },

    'arrow-right': {
        id: 'arrow-right',
        name: 'Arrow Right',
        icon: '▷',
        points: [
            [0, 0],
            [75, 0],
            [100, 50],
            [75, 100],
            [0, 100]
        ]
    },

    'arrow-left': {
        id: 'arrow-left',
        name: 'Arrow Left',
        icon: '◁',
        points: [
            [25, 0],
            [100, 0],
            [100, 100],
            [25, 100],
            [0, 50]
        ]
    },

    'notch-tr': {
        id: 'notch-tr',
        name: 'Notch TR',
        icon: '⌐',
        points: [
            [0, 0],
            [70, 0],
            [100, 30],
            [100, 100],
            [0, 100]
        ]
    },

    'notch-tl': {
        id: 'notch-tl',
        name: 'Notch TL',
        icon: '¬',
        points: [
            [30, 0],
            [100, 0],
            [100, 100],
            [0, 100],
            [0, 30]
        ]
    },

    triangle: {
        id: 'triangle',
        name: 'Triangle',
        icon: '△',
        points: [
            [50, 0],
            [100, 100],
            [0, 100]
        ]
    },

    diamond: {
        id: 'diamond',
        name: 'Diamond',
        icon: '◇',
        points: [
            [50, 0],
            [100, 50],
            [50, 100],
            [0, 50]
        ]
    },

    'chevron-right': {
        id: 'chevron-right',
        name: 'Chevron Right',
        icon: '❯',
        points: [
            [0, 0],
            [70, 0],
            [100, 50],
            [70, 100],
            [0, 100],
            [30, 50]
        ]
    },

    burst: {
        id: 'burst',
        name: 'Burst',
        icon: '✦',
        points: [
            [50, 0],
            [62, 35],
            [100, 35],
            [70, 57],
            [82, 100],
            [50, 72],
            [18, 100],
            [30, 57],
            [0, 35],
            [38, 35]
        ]
    }
};


function resolvePoints(shapeId: string, customPoints: Point2D[] | null = null): Point2D[] {
    if (customPoints && customPoints.length >= 3) {
        return customPoints;
    }
    return FRAME_SHAPES[shapeId]?.points || FRAME_SHAPES.rectangle.points;
}


export function getClipPath(shapeId: string, customPoints: Point2D[] | null = null): string {
    const points = resolvePoints(shapeId, customPoints);

    const pointsStr = points
        .map(([x, y]) => `${x}% ${y}%`)
        .join(', ');

    return `polygon(${pointsStr})`;
}


export function getSvgPoints(
    shapeId: string,
    width: number,
    height: number,
    customPoints: Point2D[] | null = null
): string {
    const points = resolvePoints(shapeId, customPoints);

    return points
        .map(([xPct, yPct]) => `${(xPct / 100) * width},${(yPct / 100) * height}`)
        .join(' ');
}


export function drawShapePath(
    ctx: CanvasRenderingContext2D,
    shapeId: string,
    x: number,
    y: number,
    width: number,
    height: number,
    customPoints: Point2D[] | null = null
): void {
    const points = resolvePoints(shapeId, customPoints);

    ctx.beginPath();
    points.forEach(([xPct, yPct], index) => {
        const px = x + (xPct / 100) * width;
        const py = y + (yPct / 100) * height;
        if (index === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    });
    ctx.closePath();
}


export function getShapeList(): FrameShape[] {
    return Object.values(FRAME_SHAPES);
}


export function getShape(shapeId: string): FrameShape | null {
    return FRAME_SHAPES[shapeId] || null;
}


export function getDefaultPoints(): Point2D[] {
    return [[0, 0], [100, 0], [100, 100], [0, 100]];
}


export function getEffectivePoints(item: Partial<PlacedItem>): Point2D[] {
    if (item.customPoints && item.customPoints.length >= 3) {
        return item.customPoints;
    }
    const shape = FRAME_SHAPES[item.frameShape || 'rectangle'];
    return shape ? shape.points : FRAME_SHAPES.rectangle.points;
}
