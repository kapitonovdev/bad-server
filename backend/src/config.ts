import { CookieOptions } from 'express'
import ms from 'ms'

export const { PORT = '3000' } = process.env
export const { DB_ADDRESS = 'mongodb://127.0.0.1:27017/weblarek' } = process.env
export const COOKIE_SECRET = process.env.COOKIE_SECRET || 'cookie-secret-dev'
export const ORIGIN_ALLOW = (
    process.env.ORIGIN_ALLOW ||
    'http://localhost,http://localhost:80,http://localhost:5173,http://127.0.0.1:5173'
)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
export const ACCESS_TOKEN = {
    secret: process.env.AUTH_ACCESS_TOKEN_SECRET || 'secret-dev',
    expiry: process.env.AUTH_ACCESS_TOKEN_EXPIRY || '10m',
}
export const REFRESH_TOKEN = {
    secret: process.env.AUTH_REFRESH_TOKEN_SECRET || 'secret-dev',
    expiry: process.env.AUTH_REFRESH_TOKEN_EXPIRY || '7d',
    cookie: {
        name: 'refreshToken',
        options: {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            maxAge: ms(process.env.AUTH_REFRESH_TOKEN_EXPIRY || '7d'),
            path: '/',
        } as CookieOptions,
    },
}
export const CSRF_TOKEN = {
    cookie: {
        name: '_csrf',
        options: {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            signed: true,
            maxAge: ms(process.env.CSRF_TOKEN_EXPIRY || '1h'),
            path: '/',
        } as CookieOptions,
    },
}
