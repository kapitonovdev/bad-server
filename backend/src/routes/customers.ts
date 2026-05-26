import { Router } from 'express'
import {
    deleteCustomer,
    getCustomerById,
    getCustomers,
    updateCustomer,
} from '../controllers/customers'
import auth, { roleGuardMiddleware } from '../middlewares/auth'
import { validateCustomerId, validateUpdateCustomerBody } from '../middlewares/validations'
import { Role } from '../models/user'

const customerRouter = Router()

customerRouter.use(auth, roleGuardMiddleware(Role.Admin))
customerRouter.get('/', getCustomers)
customerRouter.get('/:id', validateCustomerId, getCustomerById)
customerRouter.patch('/:id', validateCustomerId, validateUpdateCustomerBody, updateCustomer)
customerRouter.delete('/:id', validateCustomerId, deleteCustomer)

export default customerRouter
