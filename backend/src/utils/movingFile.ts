import { existsSync, mkdirSync } from 'fs'
import { rename } from 'fs/promises'
import { basename, join } from 'path'
import { resolvePublicPath } from './path'

async function movingFile(imagePath: string, from: string, to: string) {
    const fileName = basename(imagePath)
    const imagePathTemp = resolvePublicPath(join(from, fileName))
    const imagePathPermanent = resolvePublicPath(join(to, fileName))

    mkdirSync(resolvePublicPath(to), { recursive: true })
    if (!existsSync(imagePathTemp)) {
        throw new Error('Ошибка при сохранении файла')
    }

    await rename(imagePathTemp, imagePathPermanent)
}

export default movingFile
