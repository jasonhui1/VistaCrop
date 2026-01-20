import { memo, useCallback, useMemo, useEffect } from 'react'
import { useCanvasStore, useUIStore, usePersistenceStore, useCropsStore } from '../../stores'
import { getLayout, calculatePanelPositions } from '../../utils/panelLayouts'
import { exportCanvas, exportAllPages } from '../../utils/exportCanvas'
import CanvasGallery from './CanvasGallery'

/**
 * Canvas toolbar component for Composer view
 * Contains mode info, action buttons (clear, edit size, undo/redo), and save/load/export
 * Uses new separated stores: useCanvasStore, useUIStore, usePersistenceStore
 */
function CanvasToolbar() {
    // === CROPS STORE ===
    const crops = useCropsStore((s) => s.crops)

    // === CANVAS STORE ===
    const mode = useCanvasStore((s) => s.mode)
    const pages = useCanvasStore((s) => s.pages)
    const currentPageIndex = useCanvasStore((s) => s.currentPageIndex)
    const placedItems = useCanvasStore((s) => s.placedItems)
    const getPagesForSave = useCanvasStore((s) => s.getPagesForSave)
    const loadState = useCanvasStore((s) => s.loadState)
    const clearItems = useCanvasStore((s) => s.clearItems)
    const undo = useCanvasStore((s) => s.undo)
    const redo = useCanvasStore((s) => s.redo)
    const canUndo = useCanvasStore((s) => s.canUndo)
    const canRedo = useCanvasStore((s) => s.canRedo)

    // === UI STORE ===
    const editingCanvasSize = useUIStore((s) => s.editingCanvasSize)
    const setEditingCanvasSize = useUIStore((s) => s.setEditingCanvasSize)
    const showGallery = useUIStore((s) => s.showGallery)
    const setShowGallery = useUIStore((s) => s.setShowGallery)

    // === PERSISTENCE STORE ===
    const isSaving = usePersistenceStore((s) => s.isSaving)
    const isLoading = usePersistenceStore((s) => s.isLoading)
    const savedCanvases = usePersistenceStore((s) => s.savedCanvases)
    const hasUnsavedChanges = usePersistenceStore((s) => s.hasUnsavedChanges)
    const canvasId = usePersistenceStore((s) => s.canvasId)
    const saveCanvas = usePersistenceStore((s) => s.saveCanvas)
    const loadCanvas = usePersistenceStore((s) => s.loadCanvas)
    const deleteCanvas = usePersistenceStore((s) => s.deleteCanvas)
    const fetchSavedCanvases = usePersistenceStore((s) => s.fetchSavedCanvases)
    const markUnsavedChanges = usePersistenceStore((s) => s.markUnsavedChanges)

    // Direct subscriptions to current page properties (avoids getComposition)
    const currentPageData = useCanvasStore((s) => s.pages[s.currentPageIndex] || s.pages[0])
    const layoutId = currentPageData?.layoutId || 'single'
    const pageWidth = currentPageData?.pageWidth || 800
    const pageHeight = currentPageData?.pageHeight || 1200
    const margin = currentPageData?.margin || 40
    const backgroundColor = currentPageData?.backgroundColor || '#ffffff'

    // Derived layout state
    const currentLayout = getLayout(layoutId)
    const itemCount = placedItems.length
    const panelCount = currentLayout.panels.length
    const pageCount = pages.length
    const currentPage = currentPageIndex + 1

    // Calculate panels for panel mode export
    const panels = useMemo(() =>
        calculatePanelPositions(currentLayout, pageWidth, pageHeight, margin),
        [currentLayout, pageWidth, pageHeight, margin]
    )

    // Mark unsaved changes when pages change
    useEffect(() => {
        markUnsavedChanges()
    }, [pages, placedItems, markUnsavedChanges])

    // Fetch saved canvases on mount
    useEffect(() => {
        fetchSavedCanvases()
    }, [fetchSavedCanvases])

    // === SAVE HANDLER ===
    const handleSave = useCallback(() => {
        const getCanvasData = () => ({
            pages: getPagesForSave(),
            mode,
            composition: { pageWidth, pageHeight, backgroundColor },
            placedItems,
            crops
        })
        saveCanvas(getCanvasData)
    }, [getPagesForSave, mode, pageWidth, pageHeight, backgroundColor, placedItems, crops, saveCanvas])

    // === LOAD HANDLER ===
    const handleLoadCanvas = useCallback((selectedCanvasId) => {
        loadCanvas(selectedCanvasId, loadState)
        setShowGallery(false)
    }, [loadCanvas, loadState, setShowGallery])

    // === DELETE HANDLER ===
    const handleDeleteCanvas = useCallback((canvasIdToDelete) => {
        deleteCanvas(canvasIdToDelete)
    }, [deleteCanvas])

    // === EXPORT HANDLERS ===
    const handleExport = useCallback(async () => {
        const composition = { pageWidth, pageHeight, backgroundColor, margin, layoutId }
        await exportCanvas({ composition, panels, crops, mode, placedItems })
    }, [pageWidth, pageHeight, backgroundColor, margin, layoutId, panels, crops, mode, placedItems])

    const handleExportAll = useCallback(async () => {
        const allPages = getPagesForSave()
        await exportAllPages({ pages: allPages, crops, mode })
    }, [getPagesForSave, crops, mode])

    return (
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--text-secondary)]">
                    {mode === 'freeform' ? 'Freeform' : currentLayout.name}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                    ({mode === 'freeform' ? itemCount : panelCount})
                </span>
                {pageCount > 1 && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--accent-primary)] text-white">
                        Page {currentPage}/{pageCount}
                    </span>
                )}
                {hasUnsavedChanges && (
                    <span className="text-xs text-yellow-500" title="Unsaved changes">
                        •
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2">
                {/* Undo/Redo buttons */}
                {mode === 'freeform' && (
                    <>
                        <button
                            onClick={undo}
                            disabled={!canUndo()}
                            className="text-xs px-2 py-1.5 rounded bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Undo (Ctrl+Z)"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                        </button>
                        <button
                            onClick={redo}
                            disabled={!canRedo()}
                            className="text-xs px-2 py-1.5 rounded bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Redo (Ctrl+Y)"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                            </svg>
                        </button>
                    </>
                )}

                {/* Clear button */}
                {mode === 'freeform' && itemCount > 0 && (
                    <button
                        onClick={clearItems}
                        className="text-xs px-3 py-1.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-red-500/20 hover:text-red-400"
                        title="Clear all items"
                    >
                        Clear
                    </button>
                )}

                {/* Edit canvas size toggle - freeform mode only */}
                {mode === 'freeform' && (
                    <button
                        onClick={() => setEditingCanvasSize(!editingCanvasSize)}
                        className={`text-xs px-3 py-1.5 rounded transition-colors ${editingCanvasSize
                            ? 'bg-[var(--accent-primary)] text-white'
                            : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                            }`}
                        title="Toggle canvas resize mode"
                    >
                        Resize
                    </button>
                )}

                {/* Load button */}
                <button
                    onClick={() => {
                        fetchSavedCanvases()
                        setShowGallery(true)
                    }}
                    className="text-xs px-3 py-1.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                    title="Load saved canvas"
                >
                    Load
                </button>

                {/* Save button */}
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="text-xs px-3 py-1.5 rounded bg-[var(--accent-primary)] text-white hover:opacity-90 disabled:opacity-50"
                    title="Save canvas (Ctrl+S)"
                >
                    {isSaving ? 'Saving...' : 'Save'}
                </button>

                {/* Export button */}
                <button
                    onClick={handleExport}
                    className="text-xs px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 flex items-center gap-1"
                    title="Export current page as PNG"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export
                </button>

                {/* Export All button - only show when multiple pages */}
                {pageCount > 1 && (
                    <button
                        onClick={handleExportAll}
                        className="text-xs px-3 py-1.5 rounded bg-[var(--accent-gradient)] text-white hover:opacity-90 transition-opacity flex items-center gap-1"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)' }}
                        title={`Export all ${pageCount} pages`}
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export All ({pageCount})
                    </button>
                )}
            </div>

            {/* Canvas Gallery Modal */}
            <CanvasGallery
                isOpen={showGallery}
                onClose={() => setShowGallery(false)}
                canvases={savedCanvases}
                currentCanvasId={canvasId}
                onLoadCanvas={handleLoadCanvas}
                onDeleteCanvas={handleDeleteCanvas}
                isLoading={isLoading}
            />
        </div>
    )
}

export default memo(CanvasToolbar)
