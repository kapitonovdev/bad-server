import { NextFunction, Request, Response } from 'express'
import { FilterQuery } from 'mongoose'
import NotFoundError from '../errors/not-found-error'
import Order from '../models/order'
import User, { IUser } from '../models/user'
import {
    getQueryDate,
    getQueryNumber,
    getSafeSearchRegExp,
    getSort,
} from '../utils/query'
import { sanitizeObjectFields } from '../utils/sanitize'

const CUSTOMER_SORT_FIELDS = [
    'createdAt',
    'lastOrderDate',
    'totalAmount',
    'orderCount',
    'name',
] as const

// eslint-disable-next-line max-len
// Get GET /customers?page=2&limit=5&sort=totalAmount&order=desc&registrationDateFrom=2023-01-01&registrationDateTo=2023-12-31&lastOrderDateFrom=2023-01-01&lastOrderDateTo=2023-12-31&totalAmountFrom=100&totalAmountTo=1000&orderCountFrom=1&orderCountTo=10
export const getCustomers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const {
            sortField = 'createdAt',
            sortOrder = 'desc',
            registrationDateFrom,
            registrationDateTo,
            lastOrderDateFrom,
            lastOrderDateTo,
            totalAmountFrom,
            totalAmountTo,
            orderCountFrom,
            orderCountTo,
            search,
        } = req.query
        const page = getQueryNumber(req.query.page, 1, 1000)
        const limit = getQueryNumber(req.query.limit, 10, 10)

        const filters: FilterQuery<Partial<IUser>> = {}

        const registrationStart = getQueryDate(registrationDateFrom)
        const registrationEnd = getQueryDate(registrationDateTo)
        const lastOrderStart = getQueryDate(lastOrderDateFrom)
        const lastOrderEnd = getQueryDate(lastOrderDateTo)

        if (registrationStart) {
            filters.createdAt = {
                ...filters.createdAt,
                $gte: registrationStart,
            }
        }

        if (registrationEnd) {
            registrationEnd.setHours(23, 59, 59, 999)
            filters.createdAt = {
                ...filters.createdAt,
                $lte: registrationEnd,
            }
        }

        if (lastOrderStart) {
            filters.lastOrderDate = {
                ...filters.lastOrderDate,
                $gte: lastOrderStart,
            }
        }

        if (lastOrderEnd) {
            lastOrderEnd.setHours(23, 59, 59, 999)
            filters.lastOrderDate = {
                ...filters.lastOrderDate,
                $lte: lastOrderEnd,
            }
        }

        if (totalAmountFrom) {
            filters.totalAmount = {
                ...filters.totalAmount,
                $gte: Number(totalAmountFrom),
            }
        }

        if (totalAmountTo) {
            filters.totalAmount = {
                ...filters.totalAmount,
                $lte: Number(totalAmountTo),
            }
        }

        if (orderCountFrom) {
            filters.orderCount = {
                ...filters.orderCount,
                $gte: Number(orderCountFrom),
            }
        }

        if (orderCountTo) {
            filters.orderCount = {
                ...filters.orderCount,
                $lte: Number(orderCountTo),
            }
        }

        const searchRegex = getSafeSearchRegExp(search)

        if (searchRegex) {
            const orders = await Order.find(
                {
                    $or: [{ deliveryAddress: searchRegex }],
                },
                '_id'
            )

            const orderIds = orders.map((order) => order._id)

            filters.$or = [
                { name: searchRegex },
                { lastOrder: { $in: orderIds } },
            ]
        }

        const sort = getSort(
            sortField,
            sortOrder,
            CUSTOMER_SORT_FIELDS,
            'createdAt'
        )

        const options = {
            sort,
            skip: (page - 1) * limit,
            limit,
        }

        const users = await User.find(filters, null, options).populate([
            'orders',
            {
                path: 'lastOrder',
                populate: {
                    path: 'products',
                },
            },
            {
                path: 'lastOrder',
                populate: {
                    path: 'customer',
                },
            },
        ])

        const totalUsers = await User.countDocuments(filters)
        const totalPages = Math.ceil(totalUsers / limit)

        res.status(200).json({
            customers: users,
            pagination: {
                totalUsers,
                totalPages,
                currentPage: page,
                pageSize: limit,
            },
        })
    } catch (error) {
        next(error)
    }
}

// Get /customers/:id
export const getCustomerById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = await User.findById(req.params.id).populate([
            'orders',
            'lastOrder',
        ])
        res.status(200).json(user)
    } catch (error) {
        next(error)
    }
}

// Patch /customers/:id
export const updateCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name, phone, roles } = sanitizeObjectFields(req.body, {
            name: 30,
            phone: 20,
        })
        const update: Record<string, unknown> = {}
        Object.entries({ name, phone, roles }).forEach(([key, value]) => {
            if (value !== undefined) {
                update[key] = value
            }
        })
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: update },
            {
                new: true,
                runValidators: true,
            }
        )
            .orFail(
                () =>
                    new NotFoundError(
                        'Пользователь по заданному id отсутствует в базе'
                    )
            )
            .populate(['orders', 'lastOrder'])
        res.status(200).json(updatedUser)
    } catch (error) {
        next(error)
    }
}

// Delete /customers/:id
export const deleteCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id).orFail(
            () =>
                new NotFoundError(
                    'Пользователь по заданному id отсутствует в базе'
                )
        )
        res.status(200).json(deletedUser)
    } catch (error) {
        next(error)
    }
}
