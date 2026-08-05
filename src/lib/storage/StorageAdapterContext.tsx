'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { StorageAdapter } from '../../types';

const SUPPLY_ADAPTER_HINT =
    'Pass a StorageAdapter, e.g. adapter={createApiClient("/api")} for the HTTP-backed adapter.';

const MISSING_PROVIDER_MESSAGE =
    `No StorageAdapter in context. Wrap the VistaCrop views in <StorageAdapterProvider adapter={...}>. ${SUPPLY_ADAPTER_HINT}`;

const StorageAdapterContext = createContext<StorageAdapter | null>(null);

export interface StorageAdapterProviderProps {
    adapter: StorageAdapter;
    children?: ReactNode;
}

export function StorageAdapterProvider({ adapter, children }: StorageAdapterProviderProps) {
    if (!adapter) {
        throw new Error(`StorageAdapterProvider received no adapter. ${SUPPLY_ADAPTER_HINT}`);
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
