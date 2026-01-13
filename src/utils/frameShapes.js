/**
 * Frame Shapes Utility
 * Defines polygon shapes for manga-style irregular panel frames
 * Each shape is defined as an array of [x%, y%] points for clip-path polygon
 */

// Shape presets - each shape is defined by polygon points as percentages
export const FRAME_SHAPES = {
    // Standard rectangle
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

    // Diagonal cuts - manga action style
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

    // Double diagonal - dramatic action
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

    // Parallelograms
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

    // Trapezoids
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

    // Pentagon - dynamic action panel
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

    // Hexagon
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

    // Arrow shapes - directional emphasis
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

    // Notched corners - dramatic impact
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

    // Triangle
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

    // Diamond
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

    // Chevron shapes
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

    // Explosion/burst - manga impact
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
}

/**
 * Get clip-path CSS value for a shape or custom points
 * @param {string} shapeId - The shape ID
 * @param {Array} customPoints - Optional custom points array [[x%, y%], ...]
 * @returns {string} CSS clip-path polygon value
 */
export function getClipPath(shapeId, customPoints = null) {
    const points = customPoints || FRAME_SHAPES[shapeId]?.points || FRAME_SHAPES.rectangle.points

    const pointsStr = points
        .map(([x, y]) => `${x}% ${y}%`)
        .join(', ')

    return `polygon(${pointsStr})`
}

/**
 * Get SVG polygon points string for a shape (for border rendering)
 * @param {string} shapeId - The shape ID
 * @param {number} width - Container width
 * @param {number} height - Container height
 * @returns {string} SVG points attribute value
 */
export function getSvgPoints(shapeId, width, height) {
    const shape = FRAME_SHAPES[shapeId]
    if (!shape) return ''

    return shape.points
        .map(([xPct, yPct]) => `${(xPct / 100) * width},${(yPct / 100) * height}`)
        .join(' ')
}

/**
 * Get canvas path for a shape (for export rendering)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} shapeId - The shape ID
 * @param {number} x - Top-left X position
 * @param {number} y - Top-left Y position
 * @param {number} width - Width
 * @param {number} height - Height
 * @param {Array} customPoints - Optional custom points array [[x%, y%], ...]
 */
export function drawShapePath(ctx, shapeId, x, y, width, height, customPoints = null) {
    const points = customPoints || FRAME_SHAPES[shapeId]?.points || FRAME_SHAPES.rectangle.points

    ctx.beginPath()
    points.forEach(([xPct, yPct], index) => {
        const px = x + (xPct / 100) * width
        const py = y + (yPct / 100) * height
        if (index === 0) {
            ctx.moveTo(px, py)
        } else {
            ctx.lineTo(px, py)
        }
    })
    ctx.closePath()
}

/**
 * Get list of all available shapes
 * @returns {Array} Array of shape objects
 */
export function getShapeList() {
    return Object.values(FRAME_SHAPES)
}

/**
 * Get a shape by ID
 * @param {string} shapeId - Shape ID
 * @returns {Object|null} Shape object or null
 */
export function getShape(shapeId) {
    return FRAME_SHAPES[shapeId] || null
}

/**
 * Get default rectangle points (4 corners)
 * @returns {Array} Default rectangle points [[0,0], [100,0], [100,100], [0,100]]
 */
export function getDefaultPoints() {
    return [[0, 0], [100, 0], [100, 100], [0, 100]]
}

/**
 * Get the effective points for an item (custom points or preset shape points)
 * @param {Object} item - The item with optional customPoints and frameShape
 * @returns {Array} The points array to use
 */
export function getEffectivePoints(item) {
    if (item.customPoints && item.customPoints.length >= 3) {
        return item.customPoints
    }
    const shape = FRAME_SHAPES[item.frameShape || 'rectangle']
    return shape ? shape.points : FRAME_SHAPES.rectangle.points
}
