import path from 'path'
import express from 'express'
import { healthController } from '@/config/container'
import { sessionMiddleware } from '@/config/session'
import { errorHandler } from '@/middlewares/error'
import { notFoundHandler } from '@/middlewares/notFound'
import { apiRouter } from '@/routes'

export const app = express()

app.use(express.json())
app.use(sessionMiddleware)

// Estado del servicio (lo consulta el health check de Docker Compose)
app.get('/health', healthController.check)

// Servir archivos estáticos subidos
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.use('/api', apiRouter)

app.use(notFoundHandler)
app.use(errorHandler)
