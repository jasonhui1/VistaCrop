import { memo } from 'react'

/**
 * Canvas toolbar component for Composer view
 * Contains mode info, action buttons (clear, edit size, undo/redo), and save/load/export
 */
function CanvasToolbar({
    mode,
    layoutName,
    itemCount,
    panelCount,
    editingCanvasSize,
    onToggleEditCanvasSize,
    onClear,
    // Undo/Redo
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    // Save/Load
    canvasId,
    isSaving,
    isLoading,
    onFetchCanvases,
    onOpenGallery,
    onSave,
    onExport,
    onExportAll,
    // Auto-save indicator
    hasUnsavedChanges,
    lastSavedAt,
    // Multi-page
    pageCount = 1,
    currentPage = 1
}) {

    return (
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--text-secondary)]">
                    {mode === 'freeform' ? 'Freeform' : layoutName}
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
                            onClick={onUndo}
                            disabled={!canUndo}
                            className={`text-xs px-2 py-1 rounded transition-colors ${canUndo
                                ? 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-white'
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] opacity-40 cursor-not-allowed'
                                }`}
                            title="Undo (Ctrl+Z)"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                        </button>
                        <button
                            onClick={onRedo}
                            disabled={!canRedo}
                            className={`text-xs px-2 py-1 rounded transition-colors ${canRedo
                                ? 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-white'
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] opacity-40 cursor-not-allowed'
                                }`}
                            title="Redo (Ctrl+Y)"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                            </svg>
                        </button>
                    </>
                )}

                {mode === 'freeform' && itemCount > 0 && (
                    <button
                        onClick={onClear}
                        className="text-xs px-2 py-1 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-white transition-colors"
                    >
                        Clear
                    </button>
                )}

                {mode === 'freeform' && (
                    <button
                        onClick={onToggleEditCanvasSize}
                        className={`text-xs px-2 py-1 rounded transition-colors ${editingCanvasSize
                            ? 'bg-[var(--accent-primary)] text-white'
                            : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-white'
                            }`}
                    >
                        {editingCanvasSize ? '✓ Editing Size' : 'Edit Size'}
                    </button>
                )}

                {/* Load Button - opens gallery */}
                <button
                    onClick={() => {
                        onFetchCanvases()
                        onOpenGallery()
                    }}
                    disabled={isLoading}
                    className={`text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1 bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-white hover:bg-[var(--accent-primary)] ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Load saved canvas"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isLoading ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        )}
                    </svg>
                    {isLoading ? 'Loading...' : 'Load'}
                </button>

                <button
                    onClick={onSave}
                    disabled={isSaving}
                    className={`text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${canvasId
                        ? 'bg-green-600 hover:bg-green-500 text-white'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-white hover:bg-[var(--accent-primary)]'
                        } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={canvasId ? `Saved as ${canvasId}` : 'Save to server (Ctrl+S)'}
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isSaving ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        )}
                    </svg>
                    {isSaving ? 'Saving...' : (canvasId ? 'Update' : 'Save')}
                </button>

                <button
                    onClick={onExport}
                    className="text-xs px-3 py-1.5 rounded bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-secondary)] transition-colors flex items-center gap-1"
                    title="Export current page"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export
                </button>

                {/* Export All button - only show when multiple pages */}
                {onExportAll && (
                    <button
                        onClick={onExportAll}
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
        </div>
    )
}

export default memo(CanvasToolbar)
