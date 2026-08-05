import { useCallback, useRef, useState } from 'react';


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


function resolveState<T>(newState: T | ((prevState: T) => T), prevState: T): T {
    return typeof newState === 'function'
        ? (newState as (prevState: T) => T)(prevState)
        : newState;
}


export function useUndoRedo<T>(
    initialState: T | (() => T),
    maxHistory: number = 50
): UseUndoRedoReturn<T> {
    const [state, setStateInternal] = useState<T>(initialState);

    const pastRef = useRef<T[]>([]);
    const futureRef = useRef<T[]>([]);

    const preActionStateRef = useRef<T | null>(null);

    const [canUndo, setCanUndo] = useState<boolean>(false);
    const [canRedo, setCanRedo] = useState<boolean>(false);

    const updateFlags = useCallback(() => {
        setCanUndo(pastRef.current.length > 0);
        setCanRedo(futureRef.current.length > 0);
    }, []);

    const pushHistory = useCallback((snapshot: T) => {
        pastRef.current = [...pastRef.current.slice(-(maxHistory - 1)), snapshot];
        futureRef.current = [];
        preActionStateRef.current = null;
        setTimeout(updateFlags, 0);
    }, [maxHistory, updateFlags]);

    const resetHistory = useCallback(() => {
        pastRef.current = [];
        futureRef.current = [];
        preActionStateRef.current = null;
        updateFlags();
    }, [updateFlags]);

    const setState = useCallback((newState: T | ((prevState: T) => T)) => {
        setStateInternal((prevState: T) => {
            const nextState = resolveState(newState, prevState);

            if (JSON.stringify(prevState) === JSON.stringify(nextState)) {
                return prevState;
            }

            pushHistory(prevState);
            return nextState;
        });
    }, [pushHistory]);

    const setStateSilent = useCallback((newState: T | ((prevState: T) => T)) => {
        setStateInternal((prevState: T) => {
            const nextState = resolveState(newState, prevState);

            if (preActionStateRef.current === null) {
                preActionStateRef.current = prevState;
            }

            return nextState;
        });
    }, []);

    const recordState = useCallback(() => {
        if (preActionStateRef.current !== null) {
            pushHistory(preActionStateRef.current);
        }
    }, [pushHistory]);

    const undo = useCallback(() => {
        if (pastRef.current.length === 0) return;

        preActionStateRef.current = null;

        const previousState = pastRef.current[pastRef.current.length - 1];

        pastRef.current = pastRef.current.slice(0, -1);

        setStateInternal((currentState: T) => {
            if (!futureRef.current.includes(currentState)) {
                futureRef.current = [currentState, ...futureRef.current];
            }
            return previousState;
        });

        setTimeout(updateFlags, 0);
    }, [updateFlags]);

    const redo = useCallback(() => {
        if (futureRef.current.length === 0) return;

        const nextState = futureRef.current[0];

        futureRef.current = futureRef.current.slice(1);

        setStateInternal((currentState: T) => {
            if (!pastRef.current.includes(currentState)) {
                pastRef.current = [...pastRef.current, currentState];
            }
            return nextState;
        });

        setTimeout(updateFlags, 0);
    }, [updateFlags]);

    const clearHistory = useCallback(() => {
        resetHistory();
    }, [resetHistory]);

    const reset = useCallback((newState: T) => {
        setStateInternal(newState);
        resetHistory();
    }, [resetHistory]);

    return {
        state,
        setState,
        setStateSilent,
        recordState,
        undo,
        redo,
        canUndo,
        canRedo,
        clearHistory,
        reset
    };
}

export default useUndoRedo;
