import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { StorageAdapter, Composition, PlacedItem, SavedCanvas } from '../types.ts';
import { createApiClient } from '../utils/api.ts';

// Auto-save debounce delay in milliseconds
const AUTO_SAVE_DELAY = 30000;

export interface UseCanvasPersistenceOptions {
    composition: Composition;
    placedItems?: PlacedItem[];
    mode?: string;
    onLoadState?: (canvasData: SavedCanvas) => void;
    adapter?: StorageAdapter;
}

export interface UseCanvasPersistenceReturn {
    canvasId: string | number | null;
    isSaving: boolean;
    isLoading: boolean;
    savedCanvases: SavedCanvas[];
    showLoadMenu: boolean;
    hasUnsavedChanges: boolean;
    lastSavedAt: number | null;
    fetchSavedCanvases: () => Promise<void>;
    handleSave: () => Promise<void>;
    handleLoadCanvas: (selectedCanvasId: string) => Promise<void>;
    handleDeleteCanvas: (canvasIdToDelete: string | number) => Promise<void>;
    toggleLoadMenu: () => void;
}

/**
 * Custom hook for canvas persistence (save, load, delete, auto-save)
 */
export function useCanvasPersistence({
    composition,
    placedItems,
    mode,
    onLoadState,
    adapter
}: UseCanvasPersistenceOptions): UseCanvasPersistenceReturn {
    const storageAdapter: StorageAdapter = useMemo(
        () => adapter ?? createApiClient(),
        [adapter]
    );

    const [canvasId, setCanvasId] = useState<string | number | null>(null);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [savedCanvases, setSavedCanvases] = useState<SavedCanvas[]>([]);
    const [showLoadMenu, setShowLoadMenu] = useState<boolean>(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
    const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Close load menu when clicking outside
    useEffect(() => {
        if (!showLoadMenu) return;
        const handleClickOutside = () => setShowLoadMenu(false);
        const timer = setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showLoadMenu]);

    // Mark changes as unsaved when placedItems or composition changes
    useEffect(() => {
        if (canvasId) {
            setHasUnsavedChanges(true);
        }
    }, [placedItems, composition, canvasId]);

    // Auto-save functionality
    useEffect(() => {
        if (!hasUnsavedChanges || !canvasId) return;

        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(async () => {
            try {
                await storageAdapter.saveCanvas(String(canvasId), composition, placedItems ?? []);
                setHasUnsavedChanges(false);
                setLastSavedAt(Date.now());
                console.log('Auto-saved canvas:', canvasId);
            } catch (error) {
                console.error('Auto-save failed:', error);
            }
        }, AUTO_SAVE_DELAY);

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [hasUnsavedChanges, canvasId, composition, placedItems, storageAdapter]);

    // Fetch list of saved canvases
    const fetchSavedCanvases = useCallback(async () => {
        try {
            const canvases = await storageAdapter.listCanvases();
            setSavedCanvases(canvases || []);
        } catch (error) {
            console.error('Failed to fetch canvases:', error);
            setSavedCanvases([]);
        }
    }, [storageAdapter]);

    // Handle save to server
    const handleSave = useCallback(async () => {
        setIsSaving(true);
        try {
            let currentCanvasId = canvasId;

            if (!currentCanvasId) {
                const result = await storageAdapter.createCanvas({
                    name: `Canvas ${new Date().toLocaleString()}`,
                    mode
                });
                currentCanvasId = result.canvasId;
                setCanvasId(currentCanvasId);
            }

            await storageAdapter.saveCanvas(String(currentCanvasId), composition, placedItems ?? []);
            setHasUnsavedChanges(false);
            setLastSavedAt(Date.now());
            console.log('Canvas saved successfully:', currentCanvasId);
        } catch (error) {
            console.error('Failed to save canvas:', error);
        } finally {
            setIsSaving(false);
        }
    }, [canvasId, composition, placedItems, mode, storageAdapter]);

    // Handle loading a canvas
    const handleLoadCanvas = useCallback(async (selectedCanvasId: string) => {
        setIsLoading(true);
        setShowLoadMenu(false);
        try {
            const canvasData = await storageAdapter.loadCanvas(selectedCanvasId);
            if (canvasData) {
                setCanvasId(selectedCanvasId);
                if (onLoadState) {
                    onLoadState(canvasData);
                }
                setHasUnsavedChanges(false);
                console.log('Canvas loaded successfully:', selectedCanvasId);
            }
        } catch (error) {
            console.error('Failed to load canvas:', error);
        } finally {
            setIsLoading(false);
        }
    }, [onLoadState, storageAdapter]);

    // Handle deleting a canvas
    const handleDeleteCanvas = useCallback(async (canvasIdToDelete: string | number) => {
        try {
            await storageAdapter.deleteCanvas(String(canvasIdToDelete));
            setSavedCanvases(prev => prev.filter(c => String(c.id) !== String(canvasIdToDelete)));

            if (String(canvasIdToDelete) === String(canvasId)) {
                setCanvasId(null);
                setHasUnsavedChanges(false);
            }

            console.log('Canvas deleted:', canvasIdToDelete);
        } catch (error) {
            console.error('Failed to delete canvas:', error);
        }
    }, [canvasId, storageAdapter]);

    const toggleLoadMenu = useCallback(() => {
        setShowLoadMenu(prev => !prev);
    }, []);

    return {
        canvasId,
        isSaving,
        isLoading,
        savedCanvases,
        showLoadMenu,
        hasUnsavedChanges,
        lastSavedAt,
        fetchSavedCanvases,
        handleSave,
        handleLoadCanvas,
        handleDeleteCanvas,
        toggleLoadMenu
    };
}

export default useCanvasPersistence;
