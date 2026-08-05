import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { StorageAdapter, Composition, PlacedItem, SavedCanvas } from '../types.ts';
import { createApiClient } from '../utils/api.ts';

const AUTO_SAVE_DELAY = 30000;

export interface UseCanvasPersistenceOptions {
    composition: Composition;
    placedItems?: PlacedItem[];
    mode?: string;
    onLoadState?: (canvasData: SavedCanvas) => void;
    adapter?: StorageAdapter;
}

export interface UseCanvasPersistenceReturn {
    canvasId: string | null;
    isSaving: boolean;
    isLoading: boolean;
    savedCanvases: SavedCanvas[];
    showLoadMenu: boolean;
    hasUnsavedChanges: boolean;
    lastSavedAt: number | null;
    fetchSavedCanvases: () => Promise<void>;
    handleSave: () => Promise<void>;
    handleLoadCanvas: (selectedCanvasId: string) => Promise<void>;
    handleDeleteCanvas: (canvasIdToDelete: string) => Promise<void>;
    toggleLoadMenu: () => void;
}


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

    const [canvasId, setCanvasId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [savedCanvases, setSavedCanvases] = useState<SavedCanvas[]>([]);
    const [showLoadMenu, setShowLoadMenu] = useState<boolean>(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
    const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

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

    const isFirstRenderRef = useRef<boolean>(true);

    useEffect(() => {
        if (isFirstRenderRef.current) {
            isFirstRenderRef.current = false;
            return;
        }
        if (canvasId) {
            setHasUnsavedChanges(true);
        }
    }, [placedItems, composition]);

    const performSave = useCallback(async (targetCanvasId: string) => {
        await storageAdapter.saveCanvas(targetCanvasId, composition, placedItems ?? []);
        setHasUnsavedChanges(false);
        setLastSavedAt(Date.now());
    }, [storageAdapter, composition, placedItems]);

    useEffect(() => {
        if (!hasUnsavedChanges || !canvasId) return;

        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(async () => {
            try {
                await performSave(canvasId);
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
    }, [hasUnsavedChanges, canvasId, performSave]);

    const fetchSavedCanvases = useCallback(async () => {
        try {
            const canvases = await storageAdapter.listCanvases();
            setSavedCanvases(canvases || []);
        } catch (error) {
            console.error('Failed to fetch canvases:', error);
            setSavedCanvases([]);
        }
    }, [storageAdapter]);

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        try {
            let currentCanvasId = canvasId;

            if (!currentCanvasId) {
                const result = await storageAdapter.createCanvas({
                    name: `Canvas ${new Date().toLocaleString()}`,
                    mode
                });
                currentCanvasId = String(result.canvasId);
                setCanvasId(currentCanvasId);
            }

            await performSave(currentCanvasId);
            console.log('Canvas saved successfully:', currentCanvasId);
        } catch (error) {
            console.error('Failed to save canvas:', error);
        } finally {
            setIsSaving(false);
        }
    }, [canvasId, mode, storageAdapter, performSave]);

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

    const handleDeleteCanvas = useCallback(async (canvasIdToDelete: string) => {
        try {
            const idString = String(canvasIdToDelete);
            await storageAdapter.deleteCanvas(idString);
            setSavedCanvases(prev => prev.filter(c => String(c.id) !== idString));

            if (canvasId === idString) {
                setCanvasId(null);
                setHasUnsavedChanges(false);
            }

            console.log('Canvas deleted:', idString);
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
