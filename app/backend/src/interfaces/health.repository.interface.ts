/**
 * Comprobación de disponibilidad de la base de datos, usada por el health check
 * del contenedor. No expone datos de la aplicación.
 */
export interface IHealthRepository {
  /** Resuelve si la base de datos responde; lanza si no está disponible. */
  ping(): Promise<void>
}
