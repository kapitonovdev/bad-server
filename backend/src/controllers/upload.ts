import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import { unlink } from 'fs'
import { basename } from 'path'
import BadRequestError from '../errors/bad-request-error'
import { UPLOAD_DIR } from '../utils/path'
import { sanitizePlainText } from '../utils/sanitize'

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'))
    }
    try {
        if (req.file.size < 2 * 1024) {
            unlink(req.file.path, () => {})
            return next(new BadRequestError('Файл слишком маленький'))
        }

        const fileName = `/${UPLOAD_DIR}/${req.file.filename}`
        return res.status(constants.HTTP_STATUS_CREATED).send({
            fileName,
            originalName: sanitizePlainText(
                basename(req.file.originalname),
                120
            ),
        })
    } catch (error) {
        return next(error)
    }
}

export default {}
