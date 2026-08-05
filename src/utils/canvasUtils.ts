import { Crop } from '../types'
import { FILTERS } from './filters'

export function getFilterStyle(filterName?: string): string {
    if (!filterName) return 'none'
    const filter = FILTERS.find(f => f.id === filterName)
    return filter ? filter.filter : 'none'
}

export function idsEqual(a?: string | number | null, b?: string | number | null): boolean {
    return String(a) === String(b)
}

export function getCropById(crops: Crop[], cropId: string | number): Crop | undefined {
    return crops.find(c => idsEqual(c.id, cropId))
}
