'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { StorageAdapter } from '../../types';

const MISSING_PROVIDER_MESSAGE =
    'No StorageAdapter in context. Wrap the VistaCrop views in ' +
    '<StorageAdapterProvider adapter={...}>, e.g. adapter={createApiClient("/api")} ' +
    'for the HTTP-backed adapter.';

const StorageAdapterContext = createContext<StorageAdapter | null>(null);

export interface StorageAdapterProviderProps {
    adapter: StorageAdapter;
    children?: ReactNode;
}

export function StorageAdapterProvider({ adapter, children }: StorageAdapterProviderProps) {
    if (!adapter) {
        throw new Error('StorageAdapterProvider requires an adapter; received none.');
    }

    return (
        <StorageAdapterContext.Provider value={adapter}>
            {children}
        </StorageAdapterContext.Provider>
    );
}

export function useStorageAdapter(): StorageAdapter {
    const adapter = useContext(StorageAdapterContext);
    if (!adapter) {
        throw new Error(MISSING_PROVIDER_MESSAGE);
    }
    return adapter;
}
