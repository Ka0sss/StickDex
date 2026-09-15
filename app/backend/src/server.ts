import { app } from './app'
import { env } from './config/env'

app.listen(env.PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${env.PORT}`)
})
