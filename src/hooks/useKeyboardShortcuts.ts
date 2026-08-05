import { useEffect, useCallback } from 'react';


export interface KeyboardNudgeArgs {
    dx: number;
    dy: number;
}


export interface UseKeyboardShortcutsOptions {
    onDelete?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onSave?: () => void;
    onNudge?: (nudge: KeyboardNudgeArgs) => void;
    enabled?: boolean;
}


export function useKeyboardShortcuts({
    onDelete,
    onUndo,
    onRedo,
    onSave,
    onNudge,
    enabled = true
}: UseKeyboardShortcutsOptions): void {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!enabled) return;

        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
            return;
        }

        const isCtrlOrMeta = e.ctrlKey || e.metaKey;
        const key = e.key.toLowerCase();

        if (isCtrlOrMeta && key === 's') {
            e.preventDefault();
            onSave?.();
            return;
        }

        if (isCtrlOrMeta && key === 'z' && !e.shiftKey) {
            e.preventDefault();
            onUndo?.();
            return;
        }

        if (isCtrlOrMeta && (key === 'y' || (key === 'z' && e.shiftKey))) {
            e.preventDefault();
            onRedo?.();
            return;
        }

        if ((e.key === 'Delete' || e.key === 'Backspace') && !isCtrlOrMeta) {
            e.preventDefault();
            onDelete?.();
            return;
        }

        const nudgeAmount = e.shiftKey ? 10 : 1;
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                onNudge?.({ dx: 0, dy: -nudgeAmount });
                break;
            case 'ArrowDown':
                e.preventDefault();
                onNudge?.({ dx: 0, dy: nudgeAmount });
                break;
            case 'ArrowLeft':
                e.preventDefault();
                onNudge?.({ dx: -nudgeAmount, dy: 0 });
                break;
            case 'ArrowRight':
                e.preventDefault();
                onNudge?.({ dx: nudgeAmount, dy: 0 });
                break;
        }
    }, [enabled, onDelete, onUndo, onRedo, onSave, onNudge]);

    useEffect(() => {
        if (!enabled) return;

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [enabled, handleKeyDown]);
}

export default useKeyboardShortcuts;
