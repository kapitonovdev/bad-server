import { NextFunction, Request, Response } from 'express'

type PlainObject = Record<string, unknown>

const TAG_REGEXP = /<[^>]*>/g

function isPlainObject(value: unknown): value is PlainObject {
    return Object.prototype.toString.call(value) === '[object Object]'
}

export function sanitizePlainText(value: string, maxLength = 1000) {
    return value
        .replace(TAG_REGEXP, '')
        .split('')
        .filter((char) => {
            const code = char.charCodeAt(0)
            return code >= 32 && code !== 127
        })
        .join('')
        .trim()
        .slice(0, maxLength)
}

export function sanitizeInput<T>(input: T): T {
    if (typeof input === 'string') {
        return sanitizePlainText(input) as T
    }

    if (Array.isArray(input)) {
        return input.map((item) => sanitizeInput(item)) as T
    }

    if (isPlainObject(input)) {
        return Object.entries(input).reduce<PlainObject>((acc, [key, value]) => {
            if (key.startsWith('$') || key.includes('.')) {
                return acc
            }
            acc[key] = sanitizeInput(value)
            return acc
        }, {}) as T
    }

    return input
}

export function sanitizeRequest(
    req: Request,
    _res: Response,
    next: NextFunction
) {
    req.body = sanitizeInput(req.body)
    req.params = sanitizeInput(req.params)
    Object.defineProperty(req, 'query', {
        value: sanitizeInput(req.query),
        configurable: true,
    })
    next()
}

export function sanitizeObjectFields<T extends PlainObject>(
    input: T,
    limits: Partial<Record<keyof T, number>>
) {
    return Object.entries(input).reduce<PlainObject>((acc, [key, value]) => {
        if (typeof value === 'string') {
            acc[key] = sanitizePlainText(value, limits[key as keyof T] || 1000)
        } else {
            acc[key] = value
        }
        return acc
    }, {}) as T
}
