import { Joi, celebrate } from 'celebrate'
import { Types } from 'mongoose'

export const phoneRegExp = /^\+?[0-9() -]{7,20}$/
const objectIdValidator = (value: string, helpers: any) => {
    if (Types.ObjectId.isValid(value)) {
        return value
    }
    return helpers.message({ any: 'Невалидный id' })
}

export enum PaymentType {
    Card = 'card',
    Online = 'online',
}

// валидация id
export const validateOrderBody = celebrate({
    body: Joi.object().keys({
        items: Joi.array()
            .items(
                Joi.string().custom((value, helpers) => {
                    if (Types.ObjectId.isValid(value)) {
                        return value
                    }
                    return helpers.message({ custom: 'Невалидный id' })
                })
            )
            .min(1)
            .max(50)
            .required()
            .messages({
                'array.empty': 'Не указаны товары',
            }),
        payment: Joi.string()
            .valid(...Object.values(PaymentType))
            .required()
            .messages({
                'string.valid':
                    'Указано не валидное значение для способа оплаты, возможные значения - "card", "online"',
                'string.empty': 'Не указан способ оплаты',
            }),
        email: Joi.string().trim().email().max(254).required().messages({
            'string.empty': 'Не указан email',
        }),
        phone: Joi.string().trim().max(20).required().pattern(phoneRegExp).messages({
            'string.empty': 'Не указан телефон',
        }),
        address: Joi.string().trim().min(2).max(200).required().messages({
            'string.empty': 'Не указан адрес',
        }),
        total: Joi.number().min(0).max(10000000).required().messages({
            'string.empty': 'Не указана сумма заказа',
        }),
        comment: Joi.string().trim().max(500).optional().allow(''),
    }),
})

// валидация товара.
// name и link - обязательные поля, name - от 2 до 30 символов, link - валидный url
export const validateProductBody = celebrate({
    body: Joi.object().keys({
        title: Joi.string().trim().required().min(2).max(30).messages({
            'string.min': 'Минимальная длина поля "name" - 2',
            'string.max': 'Максимальная длина поля "name" - 30',
            'string.empty': 'Поле "title" должно быть заполнено',
        }),
        image: Joi.object().keys({
            fileName: Joi.string().trim().max(200).required(),
            originalName: Joi.string().trim().max(120).required(),
        }),
        category: Joi.string().trim().max(30).required().messages({
            'string.empty': 'Поле "category" должно быть заполнено',
        }),
        description: Joi.string().trim().max(1000).required().messages({
            'string.empty': 'Поле "description" должно быть заполнено',
        }),
        price: Joi.number().min(0).max(10000000).allow(null),
    }),
})

export const validateProductUpdateBody = celebrate({
    body: Joi.object().keys({
        title: Joi.string().trim().min(2).max(30).messages({
            'string.min': 'Минимальная длина поля "name" - 2',
            'string.max': 'Максимальная длина поля "name" - 30',
        }),
        image: Joi.object().keys({
            fileName: Joi.string().trim().max(200).required(),
            originalName: Joi.string().trim().max(120).required(),
        }),
        category: Joi.string().trim().max(30),
        description: Joi.string().trim().max(1000),
        price: Joi.number().min(0).max(10000000).allow(null),
    }),
})

export const validateObjId = celebrate({
    params: Joi.object().keys({
        productId: Joi.string().required().custom(objectIdValidator),
    }),
})

export const validateCustomerId = celebrate({
    params: Joi.object().keys({
        id: Joi.string().required().custom(objectIdValidator),
    }),
})

export const validateUserBody = celebrate({
    body: Joi.object().keys({
        name: Joi.string().trim().min(2).max(30).messages({
            'string.min': 'Минимальная длина поля "name" - 2',
            'string.max': 'Максимальная длина поля "name" - 30',
        }),
        password: Joi.string().min(6).max(128).required().messages({
            'string.empty': 'Поле "password" должно быть заполнено',
        }),
        email: Joi.string()
            .trim()
            .required()
            .email()
            .max(254)
            .message('Поле "email" должно быть валидным email-адресом')
            .messages({
                'string.empty': 'Поле "email" должно быть заполнено',
            }),
    }),
})

export const validateAuthentication = celebrate({
    body: Joi.object().keys({
        email: Joi.string()
            .trim()
            .required()
            .email()
            .max(254)
            .message('Поле "email" должно быть валидным email-адресом')
            .messages({
                'string.required': 'Поле "email" должно быть заполнено',
            }),
        password: Joi.string().max(128).required().messages({
            'string.empty': 'Поле "password" должно быть заполнено',
        }),
    }),
})

export const validateUpdateUserBody = celebrate({
    body: Joi.object()
        .keys({
            name: Joi.string().trim().min(2).max(30),
            phone: Joi.string().trim().max(20).pattern(phoneRegExp),
            email: Joi.string().trim().email().max(254),
        })
        .min(1),
})

export const validateUpdateCustomerBody = celebrate({
    body: Joi.object()
        .keys({
            name: Joi.string().trim().min(2).max(30),
            phone: Joi.string().trim().max(20).pattern(phoneRegExp).allow(''),
            roles: Joi.array().items(Joi.string().valid('customer', 'admin')).max(2),
        })
        .min(1),
})
