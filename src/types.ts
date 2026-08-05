/**
 * Shared TypeScript type definitions for VistaCrop
 */

/**
 * Represents an image crop preset / cut object
 */
export interface Crop {
    id: string | number;
    imageId?: string;
    imageData?: string;
    imageDataPath?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    originalImageWidth?: number;
    originalImageHeight?: number;
    rotation?: number;
    sourceRotation?: number;
    filter?: string;
    tags?: string[];
    notes?: string;
    createdAt?: number;
    updatedAt?: number;
}

/**
 * Represents an item placed onto a freeform canvas
 */
export interface PlacedItem {
    id: string | number;
    cropId: string | number;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    frameRotation?: number;
    frameShape?: string;
    customPoints?: Array<[number, number]>;
    borderWidth?: number;
    borderColor?: string;
    borderStyle?: 'none' | 'solid' | 'dashed' | 'manga' | string;
    cropOffsetX?: number;
    cropOffsetY?: number;
    editingCorners?: boolean;
    phoneMockup?: boolean;
    phoneColor?: string;
    phoneStyle?: string;
}

/**
 * Assignment of a crop to a specific panel index within a composition
 */
export interface PanelAssignment {
    panelIndex: number;
    cropId: string | number | null;
    zoom: number;
    offsetX: number;
    offsetY: number;
}

/**
 * Canvas composition definition containing layout, dimensions, and assignments
 */
export interface Composition {
    id: string | number;
    name: string;
    layoutId: string;
    pagePreset: string;
    pageWidth: number;
    pageHeight: number;
    margin: number;
    backgroundColor: string;
    assignments: PanelAssignment[];
    createdAt?: number;
    updatedAt?: number;
}

/**
 * Panel positioning and bounding rectangle inside a composition
 */
export interface Panel {
    index: number;
    x: number;
    y: number;
    width: number;
    height: number;
    ratioX?: number;
    ratioY?: number;
    ratioWidth?: number;
    ratioHeight?: number;
}

/**
 * Panel ratio within a layout preset definition
 */
export interface PanelRatio {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Manga panel layout preset configuration
 */
export interface PanelLayout {
    id: string;
    name: string;
    description: string;
    panels: PanelRatio[];
}

/**
 * Preset page dimension configuration
 */
export interface PagePreset {
    width: number;
    height: number;
    label: string;
}

/**
 * Preset frame shape polygon definition
 */
export interface FrameShape {
    id: string;
    name: string;
    icon: string;
    points: Array<[number, number]>;
}

/**
 * Image filter preset configuration
 */
export interface FilterPreset {
    id: string;
    name: string;
    filter: string;
    description: string;
    vibe: string;
}

/**
 * Stored image record metadata
 */
export interface StoredImage {
    id: string;
    data?: string;
    width?: number;
    height?: number;
    createdAt?: number;
    updatedAt?: number;
}

/**
 * Saved canvas record containing composition and freeform placed items
 */
export interface SavedCanvas {
    id: string | number;
    name?: string;
    mode?: string;
    composition: Composition;
    placedItems?: PlacedItem[];
    createdAt?: number;
    updatedAt?: number;
}

/**
 * Interface defining persistence storage operations for crops, canvases, and images
 */
export interface StorageAdapter {
    saveCrops(imageId: string, crops: Crop[]): Promise<any>;
    loadAllCrops(): Promise<Crop[]>;
    loadCrops(imageId: string): Promise<Crop[]>;
    updateCrop(imageId: string, cropId: string | number, updates: Partial<Crop>): Promise<any>;
    deleteCrop(imageId: string, cropId: string | number): Promise<any>;
    uploadImage(imageId: string, base64Data: string, metadata?: { width?: number; height?: number }): Promise<any>;
    listImages(): Promise<StoredImage[]>;
    getImage(imageId: string): Promise<StoredImage | null>;
    deleteImage(imageId: string, deleteCrops?: boolean): Promise<any>;
    createCanvas(options?: Record<string, any>): Promise<{ canvasId: string }>;
    saveCanvas(canvasId: string, composition: Composition, placedItems?: PlacedItem[]): Promise<any>;
    loadCanvas(canvasId: string): Promise<SavedCanvas | null>;
    listCanvases(): Promise<SavedCanvas[]>;
    deleteCanvas(canvasId: string): Promise<any>;
}
