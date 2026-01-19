/**
 * Panel Layout Utilities
 * Defines preset manga panel layouts with position/size ratios
 */

// Default page dimensions (in pixels at 150 DPI for web preview)
export const PAGE_PRESETS = {
    A4_PORTRAIT: { width: 1240, height: 1754, label: 'A4 Portrait' },
    A4_LANDSCAPE: { width: 1754, height: 1240, label: 'A4 Landscape' },
    LETTER_PORTRAIT: { width: 1275, height: 1650, label: 'Letter Portrait' },
    LETTER_LANDSCAPE: { width: 1650, height: 1275, label: 'Letter Landscape' },
    SQUARE: { width: 1500, height: 1500, label: 'Square' },
    CUSTOM: { width: 1200, height: 1600, label: 'Custom' }
}

// Default gutter size between panels (as ratio of page width)
export const DEFAULT_GUTTER = 0.02

/**
 * Panel layout definitions
 * Each panel is defined by { x, y, width, height } as ratios (0-1)
 * relative to the content area (page minus margins)
 */
export const PANEL_LAYOUTS = {
    // Single panel - full page
    'single': {
        id: 'single',
        name: 'Single',
        description: 'Full page splash',
        panels: [
            { x: 0, y: 0, width: 1, height: 1 }
        ]
    },

    // 2-panel layouts
    '2-horizontal': {
        id: '2-horizontal',
        name: '2 Horizontal',
        description: 'Two horizontal panels',
        panels: [
            { x: 0, y: 0, width: 1, height: 0.48 },
            { x: 0, y: 0.52, width: 1, height: 0.48 }
        ]
    },
    '2-vertical': {
        id: '2-vertical',
        name: '2 Vertical',
        description: 'Two vertical panels',
        panels: [
            { x: 0, y: 0, width: 0.48, height: 1 },
            { x: 0.52, y: 0, width: 0.48, height: 1 }
        ]
    },

    // 3-panel layouts
    '3-top-heavy': {
        id: '3-top-heavy',
        name: '3 Top Heavy',
        description: 'Large top, two bottom',
        panels: [
            { x: 0, y: 0, width: 1, height: 0.58 },
            { x: 0, y: 0.62, width: 0.48, height: 0.38 },
            { x: 0.52, y: 0.62, width: 0.48, height: 0.38 }
        ]
    },
    '3-bottom-heavy': {
        id: '3-bottom-heavy',
        name: '3 Bottom Heavy',
        description: 'Two top, large bottom',
        panels: [
            { x: 0, y: 0, width: 0.48, height: 0.38 },
            { x: 0.52, y: 0, width: 0.48, height: 0.38 },
            { x: 0, y: 0.42, width: 1, height: 0.58 }
        ]
    },
    '3-left-heavy': {
        id: '3-left-heavy',
        name: '3 Left Heavy',
        description: 'Large left, two right',
        panels: [
            { x: 0, y: 0, width: 0.58, height: 1 },
            { x: 0.62, y: 0, width: 0.38, height: 0.48 },
            { x: 0.62, y: 0.52, width: 0.38, height: 0.48 }
        ]
    },
    '3-horizontal': {
        id: '3-horizontal',
        name: '3 Horizontal',
        description: 'Three horizontal strips',
        panels: [
            { x: 0, y: 0, width: 1, height: 0.3 },
            { x: 0, y: 0.35, width: 1, height: 0.3 },
            { x: 0, y: 0.7, width: 1, height: 0.3 }
        ]
    },

    // 4-panel layouts
    '4-grid': {
        id: '4-grid',
        name: '4 Grid',
        description: 'Classic 2x2 grid',
        panels: [
            { x: 0, y: 0, width: 0.48, height: 0.48 },
            { x: 0.52, y: 0, width: 0.48, height: 0.48 },
            { x: 0, y: 0.52, width: 0.48, height: 0.48 },
            { x: 0.52, y: 0.52, width: 0.48, height: 0.48 }
        ]
    },
    '4-vertical-strip': {
        id: '4-vertical-strip',
        name: '4 Vertical',
        description: 'Four vertical strips',
        panels: [
            { x: 0, y: 0, width: 0.22, height: 1 },
            { x: 0.26, y: 0, width: 0.22, height: 1 },
            { x: 0.52, y: 0, width: 0.22, height: 1 },
            { x: 0.78, y: 0, width: 0.22, height: 1 }
        ]
    },
    '4-manga': {
        id: '4-manga',
        name: '4 Manga',
        description: 'Manga-style varied panels',
        panels: [
            { x: 0, y: 0, width: 0.58, height: 0.48 },
            { x: 0.62, y: 0, width: 0.38, height: 0.28 },
            { x: 0.62, y: 0.32, width: 0.38, height: 0.16 },
            { x: 0, y: 0.52, width: 1, height: 0.48 }
        ]
    },

    // 6-panel layouts
    '6-grid': {
        id: '6-grid',
        name: '6 Grid',
        description: 'Classic 2x3 grid',
        panels: [
            { x: 0, y: 0, width: 0.48, height: 0.3 },
            { x: 0.52, y: 0, width: 0.48, height: 0.3 },
            { x: 0, y: 0.35, width: 0.48, height: 0.3 },
            { x: 0.52, y: 0.35, width: 0.48, height: 0.3 },
            { x: 0, y: 0.7, width: 0.48, height: 0.3 },
            { x: 0.52, y: 0.7, width: 0.48, height: 0.3 }
        ]
    },
    '6-manga': {
        id: '6-manga',
        name: '6 Manga',
        description: 'Dynamic manga layout',
        panels: [
            { x: 0, y: 0, width: 0.65, height: 0.35 },
            { x: 0.69, y: 0, width: 0.31, height: 0.35 },
            { x: 0, y: 0.39, width: 0.31, height: 0.26 },
            { x: 0.35, y: 0.39, width: 0.65, height: 0.26 },
            { x: 0, y: 0.69, width: 0.48, height: 0.31 },
            { x: 0.52, y: 0.69, width: 0.48, height: 0.31 }
        ]
    }
}

/**
 * Get list of all available layouts
 */
export function getLayoutList() {
    return Object.values(PANEL_LAYOUTS)
}

/**
 * Get a specific layout by ID
 */
export function getLayout(layoutId) {
    return PANEL_LAYOUTS[layoutId] || PANEL_LAYOUTS['single']
}

/**
 * Calculate actual pixel positions for panels given page dimensions and margin
 * @param {Object} layout - The layout definition
 * @param {number} pageWidth - Page width in pixels
 * @param {number} pageHeight - Page height in pixels
 * @param {number} margin - Margin in pixels (applied to all sides)
 * @returns {Array} Array of panel objects with pixel positions
 */
export function calculatePanelPositions(layout, pageWidth, pageHeight, margin = 40) {
    const contentWidth = pageWidth - (margin * 2)
    const contentHeight = pageHeight - (margin * 2)

    return layout.panels.map((panel, index) => ({
        index,
        x: margin + (panel.x * contentWidth),
        y: margin + (panel.y * contentHeight),
        width: panel.width * contentWidth,
        height: panel.height * contentHeight,
        // Keep original ratios for reference
        ratioX: panel.x,
        ratioY: panel.y,
        ratioWidth: panel.width,
        ratioHeight: panel.height
    }))
}

/**
 * Create an empty composition state
 */
export function createEmptyComposition(layoutId = 'single', pagePreset = 'A4_PORTRAIT') {
    const layout = getLayout(layoutId)
    const page = PAGE_PRESETS[pagePreset]

    return {
        id: Date.now(),
        name: `Composition ${new Date().toLocaleTimeString()}`,
        layoutId: layout.id,
        pagePreset,
        pageWidth: page.width,
        pageHeight: page.height,
        margin: 40,
        backgroundColor: '#1a1a1a',
        // Array of { panelIndex, cropId, zoom, offsetX, offsetY }
        assignments: layout.panels.map((_, index) => ({
            panelIndex: index,
            cropId: null,
            zoom: 1,
            offsetX: 0,
            offsetY: 0
        })),
        createdAt: Date.now(),
        updatedAt: Date.now()
    }
}

/**
 * Create an empty page for multi-page compositions
 * Each page has independent dimensions and placed items
 */
export function createEmptyPage(pageNumber = 1, pagePreset = 'A4_PORTRAIT') {
    const preset = PAGE_PRESETS[pagePreset] || PAGE_PRESETS.A4_PORTRAIT
    return {
        id: Date.now() + pageNumber,
        name: `Page ${pageNumber}`,
        pagePreset,
        pageWidth: preset.width,
        pageHeight: preset.height,
        backgroundColor: '#1a1a1a',
        placedItems: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    }
}

/**
 * Update a panel assignment in a composition
 */
export function updatePanelAssignment(composition, panelIndex, updates) {
    return {
        ...composition,
        assignments: composition.assignments.map((assignment, idx) =>
            idx === panelIndex ? { ...assignment, ...updates } : assignment
        ),
        updatedAt: Date.now()
    }
}

/**
 * Clear a panel assignment
 */
export function clearPanelAssignment(composition, panelIndex) {
    return updatePanelAssignment(composition, panelIndex, {
        cropId: null,
        zoom: 1,
        offsetX: 0,
        offsetY: 0
    })
}

/**
 * Change the layout of a composition (preserves assignments where possible)
 */
export function changeCompositionLayout(composition, newLayoutId) {
    const newLayout = getLayout(newLayoutId)
    const currentAssignments = composition.assignments

    // Create new assignments, preserving crops where panel indices match
    const newAssignments = newLayout.panels.map((_, index) => {
        const existing = currentAssignments[index]
        if (existing) {
            return { ...existing, panelIndex: index }
        }
        return {
            panelIndex: index,
            cropId: null,
            zoom: 1,
            offsetX: 0,
            offsetY: 0
        }
    })

    return {
        ...composition,
        layoutId: newLayoutId,
        assignments: newAssignments,
        updatedAt: Date.now()
    }
}
