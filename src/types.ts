/**
 * Shared TypeScript type definitions for VistaCrop
 */

/**
 * 2D coordinate point [x, y] as percentages or pixels
 */
export type Point2D = [number, number];

/**
 * 2D point coordinate object
 */
export interface Point {
    x: number;
    y: number;
}

/**
 * 2D dimensions object
 */
export interface Dimensions {
    width: number;
    height: number;
}

/**
 * 2D bounding rectangle combining position and dimensions
 */
export interface Rect extends Point, Dimensions {}

/**
 * Supported frame border styles
 */
export type BorderStyle = 'none' | 'solid' | 'dashed' | 'manga';

/**
 * Represents an image crop preset / cut object
 */
export interface Crop extends Rect {
    id: string | number;
    imageId?: string;
    imageData?: string;
    imageDataPath?: string;
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
export interface PlacedItem extends Rect {
    id: string | number;
    cropId: string | number;
    rotation?: number;
    frameRotation?: number;
    frameShape?: string;
    customPoints?: Point2D[];
    borderWidth?: number;
    borderColor?: string;
    borderStyle?: BorderStyle;
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
export interface Panel extends Rect {
    index: number;
    ratioX?: number;
    ratioY?: number;
    ratioWidth?: number;
    ratioHeight?: number;
}

/**
 * Panel ratio within a layout preset definition (values 0-1)
 */
export interface PanelRatio extends Rect {}

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
export interface PagePreset extends Dimensions {
    label: string;
}

/**
 * Preset frame shape polygon definition
 */
export interface FrameShape {
    id: string;
    name: string;
    icon: string;
    points: Point2D[];
}

/**
 * Image filter preset configuration
 */
export interface FilterPreset {
    id: string;
    name: string;
    filter: string;
    description: string;
    /** Tailwind CSS background color class for UI badges */
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
 * Result structure when saving or updating crop records
 */
export interface SaveCropsResponse {
    crops: Crop[];
    updatedAt: number;
}

/**
 * Result structure when creating a canvas
 */
export interface CreateCanvasResponse {
    canvasId: string;
}

/**
 * Result structure for general operation success
 */
export interface OperationSuccessResponse {
    success: boolean;
    message?: string;
}

/**
 * Interface defining persistence storage operations for crops, canvases, and images
 */
export interface CanvasStorageAdapter {
    listCanvases(): Promise<SavedCanvas[]>;
    getCanvas(canvasId: string): Promise<SavedCanvas | null>;
    loadCanvas(canvasId: string): Promise<SavedCanvas | null>;
    createCanvas(options?: { name?: string; mode?: string; [key: string]: unknown }): Promise<CreateCanvasResponse>;
    saveCanvas(canvasId: string, composition: Composition, placedItems?: PlacedItem[]): Promise<OperationSuccessResponse>;
    deleteCanvas(canvasId: string): Promise<OperationSuccessResponse>;
}

export interface ImageStorageAdapter {
    listImages(): Promise<StoredImage[]>;
    getImage(imageId: string): Promise<StoredImage | null>;
    uploadImage(imageId: string, base64Data: string, metadata?: { width?: number; height?: number }): Promise<StoredImage>;
    saveImage(imageId: string, base64Data: string, metadata?: { width?: number; height?: number }): Promise<StoredImage & { success?: boolean; path?: string }>;
    deleteImage(imageId: string, deleteCrops?: boolean): Promise<OperationSuccessResponse & { cropsDeleted?: number }>;
}

export interface CropStorageAdapter {
    loadAllCrops(): Promise<Crop[]>;
    loadCrops(imageId: string): Promise<Crop[]>;
    getCrop(cropId: string | number): Promise<Crop | null>;
    saveCrops(imageId: string, crops: Partial<Crop>[]): Promise<SaveCropsResponse & { success?: boolean; count?: number; imageCreated?: boolean }>;
    updateCrop(imageId: string, cropId: string | number, updates: Partial<Crop>): Promise<Crop>;
    deleteCrop(imageId: string, cropId: string | number): Promise<OperationSuccessResponse>;
}

/**
 * Interface defining persistence storage operations for crops, canvases, and images
 */
export interface StorageAdapter extends CanvasStorageAdapter, ImageStorageAdapter, CropStorageAdapter {}

