import crypto from 'crypto'
import { NextFunction, Request, Response } from 'express'
import { CSRF_TOKEN } from '../config'
import ForbiddenError from '../errors/forbidden-error'

const PROTECTED_GET_PATHS = new Set(['/auth/token', '/auth/logout'])
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

function safeCompare(left: string, right: string) {
    const leftBuffer = Buffer.from(left)
    const rightBuffer = Buffer.from(right)

    return (
        leftBuffer.length === rightBuffer.length &&
        crypto.timingSafeEqual(leftBuffer, rightBuffer)
    )
}

export function createCsrfToken(res: Response) {
    const csrfToken = crypto.randomBytes(32).toString('base64url')
    res.cookie(
        CSRF_TOKEN.cookie.name,
        csrfToken,
        CSRF_TOKEN.cookie.options
    )
    return csrfToken
}

export function getCsrfToken(_req: Request, res: Response) {
    return res.json({
        success: true,
        csrfToken: createCsrfToken(res),
    })
}

export default function csrfProtection(
    req: Request,
    _res: Response,
    next: NextFunction
) {
    const shouldSkip =
        SAFE_METHODS.has(req.method) && !PROTECTED_GET_PATHS.has(req.path)

    if (shouldSkip) {
        return next()
    }

    const cookieToken = req.signedCookies?.[CSRF_TOKEN.cookie.name]
    const headerToken = req.get('X-CSRF-Token')

    if (
        !cookieToken ||
        !headerToken ||
        !safeCompare(cookieToken, headerToken)
    ) {
        return next(new ForbiddenError('Невалидный CSRF-токен'))
    }

    return next()
}
