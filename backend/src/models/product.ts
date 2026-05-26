import { unlink } from 'fs'
import mongoose, { Document } from 'mongoose'
import { resolvePublicPath } from '../utils/path'

export interface IFile {
    fileName: string
    originalName: string
}

export interface IProduct extends Document {
    title: string
    image: IFile
    category: string
    description: string
    price: number
}

const cardsSchema = new mongoose.Schema<IProduct>(
    {
        title: {
            type: String,
            unique: true,
            required: [true, 'Поле "title" должно быть заполнено'],
            trim: true,
            minlength: [2, 'Минимальная длина поля "title" - 2'],
            maxlength: [30, 'Максимальная длина поля "title" - 30'],
        },
        image: {
            fileName: {
                type: String,
                required: [true, 'Поле "image.fileName" должно быть заполнено'],
            },
            originalName: String,
        },
        category: {
            type: String,
            required: [true, 'Поле "category" должно быть заполнено'],
            trim: true,
            maxlength: [30, 'Максимальная длина поля "category" - 30'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, 'Максимальная длина поля "description" - 1000'],
        },
        price: {
            type: Number,
            default: null,
            min: [0, 'Минимальное значение поля "price" - 0'],
            max: [10000000, 'Максимальное значение поля "price" - 10000000'],
        },
    },
    { versionKey: false }
)

cardsSchema.index({ title: 'text' })

function removeProductImage(fileName: string) {
    try {
        unlink(resolvePublicPath(fileName), () => {})
    } catch (_error) {
        // ignore invalid stored paths
    }
}

// Можно лучше: удалять старое изображением перед обновлением сущности
cardsSchema.pre('findOneAndUpdate', async function deleteOldImage() {
    // @ts-ignore
    const updateImage = this.getUpdate().$set?.image
    const docToUpdate = await this.model.findOne(this.getQuery())
    if (updateImage && docToUpdate) {
        removeProductImage(docToUpdate.image.fileName)
    }
})

// Можно лучше: удалять файл с изображением после удаление сущности
cardsSchema.post('findOneAndDelete', async (doc: IProduct) => {
    if (doc) {
        removeProductImage(doc.image.fileName)
    }
})

export default mongoose.model<IProduct>('product', cardsSchema)
