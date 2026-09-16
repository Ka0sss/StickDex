import { Router } from 'express'
import { albumRoutes } from '@/routes/album.routes'
import { authRoutes } from '@/routes/auth.routes'
import { collectionRoutes } from '@/routes/collection.routes'
import { stickerRoutes } from '@/routes/sticker.routes'
import { uploadRoutes } from '@/routes/upload.routes'

export const apiRouter = Router()

apiRouter.use('/auth', authRoutes)
apiRouter.use('/albums', albumRoutes)
apiRouter.use('/collections', collectionRoutes)
apiRouter.use('/upload', uploadRoutes)
apiRouter.use('/', stickerRoutes)
