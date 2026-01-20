import { memo } from 'react'
import { useCanvasStore, useUIStore } from '../../stores'

/**
 * PanelControls - Controls for the selected panel in panel mode
 * Uses separated stores: useCanvasStore, useUIStore
 */
function PanelControls() {
    // === CANVAS STORE ===
    const mode = useCanvasStore((s) => s.mode)
    const getComposition = useCanvasStore((s) => s.getComposition)
    const handlePanelZoom = useCanvasStore((s) => s.handlePanelZoom)
    const clearPanel = useCanvasStore((s) => s.clearPanel)

    // === UI STORE ===
    const selectedPanelIndex = useUIStore((s) => s.selectedPanelIndex)

    // Only show in panel mode with a selected panel
    if (mode !== 'panels' || selectedPanelIndex === null) return null

    const composition = getComposition()
    const selectedAssignment = composition.assignments[selectedPanelIndex]
    if (!selectedAssignment) return null

    return (
        <div className="mt-4 p-4 bg-[var(--bg-tertiary)] rounded-xl flex items-center gap-6">
            <span className="text-sm font-medium text-[var(--text-secondary)]">
                Panel {selectedPanelIndex + 1}
            </span>
            <div className="flex items-center gap-2">
                <label className="text-sm text-[var(--text-muted)]">Zoom:</label>
                <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={selectedAssignment.zoom}
                    onChange={(e) => handlePanelZoom(selectedPanelIndex, parseFloat(e.target.value))}
                    className="w-32"
                />
                <span className="text-sm text-[var(--text-secondary)] w-12">
                    {Math.round(selectedAssignment.zoom * 100)}%
                </span>
            </div>
            <button
                onClick={() => clearPanel(selectedPanelIndex)}
                className="btn btn-secondary text-sm py-2 px-4"
            >
                Clear Panel
            </button>
        </div>
    )
}

export default memo(PanelControls)
