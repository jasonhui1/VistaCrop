import { useCallback, useRef, useState } from 'react'

/**
 * Custom hook for undo/redo functionality
 * Maintains a history stack of state snapshots
 * 
 * Key feature: setStateSilent() updates state without recording history,
 * perfect for intermediate updates during drag operations.
 * Use recordState() explicitly when a drag ends.
 * 
 * @param {any} initialState - The initial state value
 * @param {number} maxHistory - Maximum number of history states to keep (default: 50)
 * @returns {Object} - { state, setState, setStateSilent, recordState, undo, redo, canUndo, canRedo, clearHistory }
 */
export function useUndoRedo(initialState, maxHistory = 50) {
    // Current state
    const [state, setStateInternal] = useState(initialState)

    // History stacks
    const pastRef = useRef([])
    const futureRef = useRef([])

    // Track the state before a drag operation started
    const preActionStateRef = useRef(null)

    // Flags for UI
    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)

    // Update can flags
    const updateFlags = useCallback(() => {
        setCanUndo(pastRef.current.length > 0)
        setCanRedo(futureRef.current.length > 0)
    }, [])

    // Set state AND record to history (use for discrete actions like add/delete)
    const setState = useCallback((newState) => {
        setStateInternal(prevState => {
            const nextState = typeof newState === 'function' ? newState(prevState) : newState

            // Don't push to history if state hasn't changed
            if (JSON.stringify(prevState) === JSON.stringify(nextState)) {
                return prevState
            }

            // Push current state to past
            pastRef.current = [...pastRef.current.slice(-(maxHistory - 1)), prevState]

            // Clear future on new action
            futureRef.current = []

            // Clear any pending pre-action state
            preActionStateRef.current = null

            setTimeout(updateFlags, 0)

            return nextState
        })
    }, [maxHistory, updateFlags])

    // Set state WITHOUT recording to history (use during drag operations)
    const setStateSilent = useCallback((newState) => {
        setStateInternal(prevState => {
            const nextState = typeof newState === 'function' ? newState(prevState) : newState

            // Capture the state before this action started (first silent update)
            if (preActionStateRef.current === null) {
                preActionStateRef.current = prevState
            }

            return nextState
        })
    }, [])

    // Explicitly record current state to history (call on drag end)
    const recordState = useCallback(() => {
        if (preActionStateRef.current !== null) {
            // Add the pre-action state to history
            pastRef.current = [...pastRef.current.slice(-(maxHistory - 1)), preActionStateRef.current]
            futureRef.current = []
            preActionStateRef.current = null
            setTimeout(updateFlags, 0)
        }
    }, [maxHistory, updateFlags])

    // Undo: pop from past, push current to future
    const undo = useCallback(() => {
        if (pastRef.current.length === 0) return

        // Clear any pending silent updates
        preActionStateRef.current = null

        // Get the previous state BEFORE calling setState
        const previousState = pastRef.current[pastRef.current.length - 1]

        // Update history stacks BEFORE setState (so it only happens once)
        pastRef.current = pastRef.current.slice(0, -1)

        setStateInternal(currentState => {
            // Push current state to future (this runs twice in StrictMode, but we handle it)
            if (!futureRef.current.includes(currentState)) {
                futureRef.current = [currentState, ...futureRef.current]
            }
            return previousState
        })

        setTimeout(updateFlags, 0)
    }, [updateFlags])

    // Redo: pop from future, push current to past
    const redo = useCallback(() => {
        if (futureRef.current.length === 0) return

        // Get the next state BEFORE calling setState
        const nextState = futureRef.current[0]

        // Update history stacks BEFORE setState (so it only happens once)
        futureRef.current = futureRef.current.slice(1)

        setStateInternal(currentState => {
            // Push current state to past (this runs twice in StrictMode, but we handle it)
            if (!pastRef.current.includes(currentState)) {
                pastRef.current = [...pastRef.current, currentState]
            }
            return nextState
        })

        setTimeout(updateFlags, 0)
    }, [updateFlags])

    // Clear all history
    const clearHistory = useCallback(() => {
        pastRef.current = []
        futureRef.current = []
        preActionStateRef.current = null
        updateFlags()
    }, [updateFlags])

    // Reset to a specific state (clears history)
    const reset = useCallback((newState) => {
        setStateInternal(newState)
        pastRef.current = []
        futureRef.current = []
        preActionStateRef.current = null
        updateFlags()
    }, [updateFlags])

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
    }
}

export default useUndoRedo
