import path from 'path'
import express from 'express'
import { sessionMiddleware } from './config/session'
import { errorHandler } from './middlewares/error'
import { apiRouter } from './routes'

export const app = express()

app.use(express.json())
app.use(sessionMiddleware)

// Servir archivos estáticos subidos
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.use('/api', apiRouter)

app.use(errorHandler)
