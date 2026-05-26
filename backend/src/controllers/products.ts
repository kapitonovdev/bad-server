import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import { Error as MongooseError } from 'mongoose'
import BadRequestError from '../errors/bad-request-error'
import ConflictError from '../errors/conflict-error'
import NotFoundError from '../errors/not-found-error'
import Product from '../models/product'
import movingFile from '../utils/movingFile'
import { UPLOAD_DIR, UPLOAD_TEMP_DIR } from '../utils/path'
import { sanitizeObjectFields } from '../utils/sanitize'
import { getQueryNumber } from '../utils/query'

// GET /product
const getProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = getQueryNumber(req.query.page, 1, 1000)
        const limit = getQueryNumber(req.query.limit, 5, 50)
        const options = {
            skip: (page - 1) * limit,
            limit,
        }
        const products = await Product.find({}, null, options)
        const totalProducts = await Product.countDocuments({})
        const totalPages = Math.ceil(totalProducts / limit)
        return res.send({
            items: products,
            pagination: {
                totalProducts,
                totalPages,
                currentPage: page,
                pageSize: limit,
            },
        })
    } catch (err) {
        return next(err)
    }
}

// POST /product
const createProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { image } = req.body
        const { description, category, price, title } = sanitizeObjectFields(
            req.body,
            {
                title: 30,
                category: 30,
                description: 1000,
            }
        )

        // Переносим картинку из временной папки
        if (image) {
            await movingFile(
                image.fileName,
                UPLOAD_TEMP_DIR,
                UPLOAD_DIR
            )
        }

        const product = await Product.create({
            description,
            image,
            category,
            price,
            title,
        })
        return res.status(constants.HTTP_STATUS_CREATED).send(product)
    } catch (error) {
        if (error instanceof MongooseError.ValidationError) {
            return next(new BadRequestError(error.message))
        }
        if (error instanceof Error && error.message.includes('E11000')) {
            return next(
                new ConflictError('Товар с таким заголовком уже существует')
            )
        }
        return next(error)
    }
}

// TODO: Добавить guard admin
// PUT /product
const updateProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { productId } = req.params
        const { image } = req.body
        const productUpdate = sanitizeObjectFields(req.body, {
            title: 30,
            category: 30,
            description: 1000,
        })

        // Переносим картинку из временной папки
        if (image) {
            await movingFile(
                image.fileName,
                UPLOAD_TEMP_DIR,
                UPLOAD_DIR
            )
        }

        const product = await Product.findByIdAndUpdate(
            productId,
            {
                $set: {
                    ...productUpdate,
                    price: req.body.price ? req.body.price : null,
                    image: req.body.image ? req.body.image : undefined,
                },
            },
            { runValidators: true, new: true }
        ).orFail(() => new NotFoundError('Нет товара по заданному id'))
        return res.send(product)
    } catch (error) {
        if (error instanceof MongooseError.ValidationError) {
            return next(new BadRequestError(error.message))
        }
        if (error instanceof MongooseError.CastError) {
            return next(new BadRequestError('Передан не валидный ID товара'))
        }
        if (error instanceof Error && error.message.includes('E11000')) {
            return next(
                new ConflictError('Товар с таким заголовком уже существует')
            )
        }
        return next(error)
    }
}

// TODO: Добавить guard admin
// DELETE /product
const deleteProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { productId } = req.params
        const product = await Product.findByIdAndDelete(productId).orFail(
            () => new NotFoundError('Нет товара по заданному id')
        )
        return res.send(product)
    } catch (error) {
        if (error instanceof MongooseError.CastError) {
            return next(new BadRequestError('Передан не валидный ID товара'))
        }
        return next(error)
    }
}

export { createProduct, deleteProduct, getProducts, updateProduct }
