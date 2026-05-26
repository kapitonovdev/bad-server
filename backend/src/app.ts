import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors, { CorsOptions } from 'cors'
import 'dotenv/config'
import express, { json, urlencoded } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import mongoose from 'mongoose'
import path from 'path'
import { COOKIE_SECRET, DB_ADDRESS, ORIGIN_ALLOW } from './config'
import csrfProtection from './middlewares/csrf'
import errorHandler from './middlewares/error-handler'
import { sanitizeRequest } from './utils/sanitize'
import routes from './routes'

const { PORT = 3000 } = process.env
const app = express()

const corsOptions: CorsOptions = {
    origin(origin, callback) {
        if (!origin || ORIGIN_ALLOW.includes(origin)) {
            return callback(null, true)
        }

        return callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
}

app.disable('x-powered-by')
app.set('trust proxy', 1)

app.use(helmet())
app.use(
    rateLimit({
        windowMs: 60 * 1000,
        limit: 600,
        standardHeaders: true,
        legacyHeaders: false,
        message: { message: 'Слишком много запросов' },
    })
)
app.use(cookieParser(COOKIE_SECRET))
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))
app.use(
    express.static(path.join(__dirname, 'public'), {
        dotfiles: 'deny',
        fallthrough: true,
        index: false,
        maxAge: '1h',
    })
)

app.use(urlencoded({ extended: true, limit: '10kb' }))
app.use(json({ limit: '10kb' }))
app.use(sanitizeRequest)
app.use(csrfProtection)
app.use(routes)
app.use(errors())
app.use(errorHandler)

const bootstrap = async () => {
    try {
        await mongoose.connect(DB_ADDRESS)
        await app.listen(PORT, () => console.log('ok'))
    } catch (error) {
        console.error(error)
    }
}

bootstrap()
