import escapeRegExp from './escapeRegExp'

export function getQueryString(value: unknown, maxLength = 100) {
    return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

export function getQueryNumber(value: unknown, fallback: number, max: number) {
    const parsed = Number(value)

    if (!Number.isFinite(parsed) || parsed < 1) {
        return fallback
    }

    return Math.min(Math.floor(parsed), max)
}

export function getQueryDate(value: unknown) {
    const dateString = getQueryString(value, 30)

    if (!dateString) {
        return null
    }

    const date = new Date(dateString)
    return Number.isNaN(date.getTime()) ? null : date
}

export function getSafeSearchRegExp(value: unknown) {
    const search = getQueryString(value, 80)

    if (!search) {
        return null
    }

    return new RegExp(escapeRegExp(search), 'i')
}

export function getSort<T extends string>(
    sortField: unknown,
    sortOrder: unknown,
    allowedFields: readonly T[],
    fallback: T
) {
    const field = getQueryString(sortField, 40) as T
    const safeField = allowedFields.includes(field) ? field : fallback

    return {
        [safeField]: sortOrder === 'asc' ? 1 : -1,
    } as Record<T, 1 | -1>
}
