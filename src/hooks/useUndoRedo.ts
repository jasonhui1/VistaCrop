import { useCallback, useRef, useState } from 'react';

/**
 * Interface returned by the useUndoRedo hook
 */
export interface UseUndoRedoReturn<T> {
    state: T;
    setState: (newState: T | ((prevState: T) => T)) => void;
    setStateSilent: (newState: T | ((prevState: T) => T)) => void;
    recordState: () => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    clearHistory: () => void;
    reset: (newState: T) => void;
}

/**
 * Helper to resolve new state values from functional updates or direct values
 */
function resolveState<T>(newState: T | ((prevState: T) => T), prevState: T): T {
    return typeof newState === 'function'
        ? (newState as (prevState: T) => T)(prevState)
        : newState;
}

/**
 * Custom hook for undo/redo functionality
 * Maintains a history stack of state snapshots
 * 
 * Key feature: setStateSilent() updates state without recording history,
 * perfect for intermediate updates during drag operations.
 * Use recordState() explicitly when a drag ends.
 * 
 * @param initialState - The initial state value or initializer function
 * @param maxHistory - Maximum number of history states to keep (default: 50)
 * @returns Object containing state and undo/redo operations
 */
export function useUndoRedo<T>(
    initialState: T | (() => T),
    maxHistory: number = 50
): UseUndoRedoReturn<T> {
    // Current state
    const [state, setStateInternal] = useState<T>(initialState);

    // History stacks
    const pastRef = useRef<T[]>([]);
    const futureRef = useRef<T[]>([]);

    // Track the state before a drag operation started
    const preActionStateRef = useRef<T | null>(null);

    // Flags for UI
    const [canUndo, setCanUndo] = useState<boolean>(false);
    const [canRedo, setCanRedo] = useState<boolean>(false);

    // Update can flags
    const updateFlags = useCallback(() => {
        setCanUndo(pastRef.current.length > 0);
        setCanRedo(futureRef.current.length > 0);
    }, []);

    // Helper to push state onto past history stack and clear future
    const pushHistory = useCallback((snapshot: T) => {
        pastRef.current = [...pastRef.current.slice(-(maxHistory - 1)), snapshot];
        futureRef.current = [];
        preActionStateRef.current = null;
        setTimeout(updateFlags, 0);
    }, [maxHistory, updateFlags]);

    // Helper to clear all history stacks and update flags
    const resetHistory = useCallback(() => {
        pastRef.current = [];
        futureRef.current = [];
        preActionStateRef.current = null;
        updateFlags();
    }, [updateFlags]);

    // Set state AND record to history (use for discrete actions like add/delete)
    const setState = useCallback((newState: T | ((prevState: T) => T)) => {
        setStateInternal((prevState: T) => {
            const nextState = resolveState(newState, prevState);

            // Don't push to history if state hasn't changed
            if (JSON.stringify(prevState) === JSON.stringify(nextState)) {
                return prevState;
            }

            pushHistory(prevState);
            return nextState;
        });
    }, [pushHistory]);

    // Set state WITHOUT recording to history (use during drag operations)
    const setStateSilent = useCallback((newState: T | ((prevState: T) => T)) => {
        setStateInternal((prevState: T) => {
            const nextState = resolveState(newState, prevState);

            // Capture the state before this action started (first silent update)
            if (preActionStateRef.current === null) {
                preActionStateRef.current = prevState;
            }

            return nextState;
        });
    }, []);

    // Explicitly record current state to history (call on drag end)
    const recordState = useCallback(() => {
        if (preActionStateRef.current !== null) {
            pushHistory(preActionStateRef.current);
        }
    }, [pushHistory]);

    // Undo: pop from past, push current to future
    const undo = useCallback(() => {
        if (pastRef.current.length === 0) return;

        // Clear any pending silent updates
        preActionStateRef.current = null;

        // Get the previous state BEFORE calling setState
        const previousState = pastRef.current[pastRef.current.length - 1];

        // Update history stacks BEFORE setState (so it only happens once)
        pastRef.current = pastRef.current.slice(0, -1);

        setStateInternal((currentState: T) => {
            // Push current state to future (this runs twice in StrictMode, but we handle it)
            if (!futureRef.current.includes(currentState)) {
                futureRef.current = [currentState, ...futureRef.current];
            }
            return previousState;
        });

        setTimeout(updateFlags, 0);
    }, [updateFlags]);

    // Redo: pop from future, push current to past
    const redo = useCallback(() => {
        if (futureRef.current.length === 0) return;

        // Get the next state BEFORE calling setState
        const nextState = futureRef.current[0];

        // Update history stacks BEFORE setState (so it only happens once)
        futureRef.current = futureRef.current.slice(1);

        setStateInternal((currentState: T) => {
            // Push current state to past (this runs twice in StrictMode, but we handle it)
            if (!pastRef.current.includes(currentState)) {
                pastRef.current = [...pastRef.current, currentState];
            }
            return nextState;
        });

        setTimeout(updateFlags, 0);
    }, [updateFlags]);

    // Clear all history
    const clearHistory = useCallback(() => {
        resetHistory();
    }, [resetHistory]);

    // Reset to a specific state (clears history)
    const reset = useCallback((newState: T) => {
        setStateInternal(newState);
        resetHistory();
    }, [resetHistory]);

    return {
        state,
        setState,           // Use for discrete actions (add, delete)
        setStateSilent,     // Use during drag operations
        recordState,        // Call on drag end to save to history
        undo,
        redo,
        canUndo,
        canRedo,
        clearHistory,
        reset
    };
}

export default useUndoRedo;
