import { Router } from 'express'
import { albumRoutes } from './album.routes'
import { collectionRoutes } from './collection.routes'
import { stickerRoutes } from './sticker.routes'

export const apiRouter = Router()

apiRouter.use('/albums', albumRoutes)
apiRouter.use('/collections', collectionRoutes)
apiRouter.use('/', stickerRoutes)
