import { app } from '@/app'
import { env } from '@/config/env'

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en http://127.0.0.1:${env.PORT}`)
})
