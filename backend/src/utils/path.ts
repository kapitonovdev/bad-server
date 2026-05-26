import { sep, resolve } from 'path'

export const PUBLIC_DIR = resolve(__dirname, '../public')
export const UPLOAD_TEMP_DIR = process.env.UPLOAD_PATH_TEMP || 'temp'
export const UPLOAD_DIR = process.env.UPLOAD_PATH || 'images'

export function resolvePublicPath(relativePath = '') {
    const safeRelativePath = relativePath.replace(/^[/\\]+/, '')
    const targetPath = resolve(PUBLIC_DIR, safeRelativePath)
    const isInsidePublic =
        targetPath === PUBLIC_DIR || targetPath.startsWith(`${PUBLIC_DIR}${sep}`)

    if (!isInsidePublic) {
        throw new Error('Недопустимый путь к файлу')
    }

    return targetPath
}
