import { Request, Express } from 'express'
import multer, { FileFilterCallback } from 'multer'
import { mkdirSync } from 'fs'
import { extname, basename } from 'path'
import crypto from 'crypto'
import BadRequestError from '../errors/bad-request-error'
import { resolvePublicPath, UPLOAD_TEMP_DIR } from '../utils/path'

type DestinationCallback = (error: Error | null, destination: string) => void
type FileNameCallback = (error: Error | null, filename: string) => void

const types: Record<string, string> = {
    'image/png': '.png',
    'image/jpg': '.jpg',
    'image/jpeg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
}

const storage = multer.diskStorage({
    destination: (
        _req: Request,
        _file: Express.Multer.File,
        cb: DestinationCallback
    ) => {
        const destinationPath = resolvePublicPath(UPLOAD_TEMP_DIR)

        mkdirSync(destinationPath, { recursive: true })

        cb(null, destinationPath)
    },

    filename: (
        _req: Request,
        file: Express.Multer.File,
        cb: FileNameCallback
    ) => {
        const originalExt = extname(basename(file.originalname)).toLowerCase()
        const extByMime = types[file.mimetype]
        const safeExt = extByMime || originalExt

        cb(null, `${crypto.randomUUID()}${safeExt}`)
    },
})

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    if (!types[file.mimetype]) {
        return cb(new BadRequestError('Недопустимый тип файла'))
    }

    return cb(null, true)
}

export default multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
    },
})
