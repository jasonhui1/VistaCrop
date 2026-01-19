import { useEffect, useCallback } from 'react'

/**
 * Custom hook for keyboard shortcuts in the composer
 * Reusable - accepts callback props, no store dependencies
 * 
 * @param {Object} options - Shortcut handlers
 * @param {Function} options.onDelete - Called when Delete/Backspace pressed
 * @param {Function} options.onUndo - Called when Ctrl+Z pressed
 * @param {Function} options.onRedo - Called when Ctrl+Y or Ctrl+Shift+Z pressed
 * @param {Function} options.onSave - Called when Ctrl+S pressed
 * @param {Function} options.onNudge - Called with { dx, dy } when arrow keys pressed
 * @param {boolean} options.enabled - Whether shortcuts are enabled (default: true)
 */
export function useKeyboardShortcuts({
    onDelete,
    onUndo,
    onRedo,
    onSave,
    onNudge,
    enabled = true
} = {}) {
    const handleKeyDown = useCallback((e) => {
        if (!enabled) return

        // Don't trigger if user is typing in an input/textarea
        const target = e.target
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return
        }

        const isCtrlOrMeta = e.ctrlKey || e.metaKey
        const key = e.key.toLowerCase()

        // Ctrl+S - Save
        if (isCtrlOrMeta && key === 's') {
            e.preventDefault()
            onSave?.()
            return
        }

        // Ctrl+Z - Undo
        if (isCtrlOrMeta && key === 'z' && !e.shiftKey) {
            e.preventDefault()
            onUndo?.()
            return
        }

        // Ctrl+Y or Ctrl+Shift+Z - Redo
        if (isCtrlOrMeta && (key === 'y' || (key === 'z' && e.shiftKey))) {
            e.preventDefault()
            onRedo?.()
            return
        }

        // Delete or Backspace - Delete selected item
        if ((e.key === 'Delete' || e.key === 'Backspace') && !isCtrlOrMeta) {
            e.preventDefault()
            onDelete?.()
            return
        }

        // Arrow keys - Nudge selected item
        const nudgeAmount = e.shiftKey ? 10 : 1
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault()
                onNudge?.({ dx: 0, dy: -nudgeAmount })
                break
            case 'ArrowDown':
                e.preventDefault()
                onNudge?.({ dx: 0, dy: nudgeAmount })
                break
            case 'ArrowLeft':
                e.preventDefault()
                onNudge?.({ dx: -nudgeAmount, dy: 0 })
                break
            case 'ArrowRight':
                e.preventDefault()
                onNudge?.({ dx: nudgeAmount, dy: 0 })
                break
        }
    }, [enabled, onDelete, onUndo, onRedo, onSave, onNudge])

    useEffect(() => {
        if (!enabled) return

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [enabled, handleKeyDown])
}

export default useKeyboardShortcuts
