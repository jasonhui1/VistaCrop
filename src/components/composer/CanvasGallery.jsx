import { memo, useState } from 'react'

/**
 * Canvas Gallery Modal
 * Full-screen modal showing saved canvases with large thumbnail previews
 */
function CanvasGallery({
    isOpen,
    onClose,
    canvases,
    currentCanvasId,
    onLoadCanvas,
    onDeleteCanvas,
    isLoading
}) {
    const [deleteConfirmId, setDeleteConfirmId] = useState(null)

    if (!isOpen) return null

    const handleDeleteClick = (e, canvasId) => {
        e.stopPropagation()
        if (deleteConfirmId === canvasId) {
            onDeleteCanvas(canvasId)
            setDeleteConfirmId(null)
        } else {
            setDeleteConfirmId(canvasId)
            setTimeout(() => setDeleteConfirmId(null), 3000)
        }
    }

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={handleBackdropClick}
        >
            <div className="relative w-[90vw] max-w-5xl max-h-[85vh] bg-[var(--bg-secondary)] rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                        Load Canvas
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {canvases.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-[var(--text-muted)]">
                            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm">No saved canvases found</p>
                            <p className="text-xs mt-1 opacity-70">Save a canvas to see it here</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {canvases.map((canvas) => (
                                <div
                                    key={canvas.id}
                                    className={`group relative bg-[var(--bg-tertiary)] rounded-xl overflow-hidden border-2 transition-all cursor-pointer hover:border-[var(--accent-primary)] hover:shadow-lg ${canvas.id === currentCanvasId
                                            ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/30'
                                            : 'border-transparent'
                                        }`}
                                    onClick={() => {
                                        onLoadCanvas(canvas.id)
                                        onClose()
                                    }}
                                >
                                    {/* Thumbnail */}
                                    <div className="aspect-[4/3] bg-[var(--bg-primary)] flex items-center justify-center">
                                        {canvas.thumbnail ? (
                                            <img
                                                src={canvas.thumbnail}
                                                alt={canvas.name || 'Canvas preview'}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center text-[var(--text-muted)]">
                                                <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-xs mt-2 opacity-70">No preview</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-3">
                                        <div className="font-medium text-sm text-[var(--text-primary)] truncate">
                                            {canvas.name || `Canvas ${canvas.id}`}
                                        </div>
                                        <div className="text-xs text-[var(--text-muted)] mt-1">
                                            {canvas.updatedAt ? new Date(canvas.updatedAt).toLocaleString() : 'Unknown date'}
                                        </div>
                                    </div>

                                    {/* Delete button */}
                                    <button
                                        onClick={(e) => handleDeleteClick(e, canvas.id)}
                                        className={`absolute top-2 right-2 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${deleteConfirmId === canvas.id
                                                ? 'bg-red-500 text-white opacity-100'
                                                : 'bg-black/50 text-white hover:bg-red-500'
                                            }`}
                                        title={deleteConfirmId === canvas.id ? 'Click again to confirm' : 'Delete canvas'}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>

                                    {/* Current indicator */}
                                    {canvas.id === currentCanvasId && (
                                        <div className="absolute top-2 left-2 px-2 py-1 bg-[var(--accent-primary)] text-white text-xs font-medium rounded">
                                            Current
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Loading overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="flex items-center gap-3 px-6 py-3 bg-[var(--bg-secondary)] rounded-lg">
                            <svg className="w-5 h-5 animate-spin text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-sm text-[var(--text-primary)]">Loading canvas...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default memo(CanvasGallery)
