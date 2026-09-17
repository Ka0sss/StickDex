import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError, api } from '@/services/api'
import type { CollectionSummary } from '@/types'

export default function UserProfile() {
  const { id } = useParams<{ id: string }>()
  const [collections, setCollections] = useState<CollectionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let active = true

    const loadCollections = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await api<CollectionSummary[]>(`/collections?userId=${id}`)
        if (active) setCollections(data)
      } catch (err: unknown) {
        if (active) {
          setError(
            err instanceof ApiError ? err.message : 'Error al cargar las colecciones públicas',
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadCollections()

    return () => {
      active = false
    }
  }, [id])

  const collectorName = collections[0]?.user.username

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 border-b border-binder-800/80 pb-6 md:flex-row md:items-end">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-amber-400">
            <span>Coleccionista</span>
            <span>•</span>
            <span>Colecciones Públicas</span>
          </div>
          <h1 className="mt-1.5 font-display text-4xl font-black tracking-tight text-white sm:text-5xl">
            {collectorName ?? 'Perfil de coleccionista'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-slate-400">
            Álbumes compartidos públicamente por este coleccionista, con su avance actual.
          </p>
        </div>

        <Link
          to="/collections"
          className="inline-flex items-center justify-center rounded-xl border border-binder-700 bg-binder-800/60 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-300 transition hover:border-amber-400/60 hover:text-amber-400"
        >
          Ver la comunidad
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-xs font-semibold text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
          <p className="mt-3 text-xs font-bold tracking-widest text-slate-400">
            CARGANDO COLECCIONES...
          </p>
        </div>
      ) : collections.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-binder-700/80 bg-binder-900/40 py-20 text-center">
          <h3 className="mt-3 font-display text-xl font-black text-white">
            Este coleccionista no tiene colecciones públicas
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Sus álbumes están marcados como privados o todavía no ha iniciado ninguno.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col) => {
            const collected = col.progress.collectedCount
            const total = col.progress.totalStickers
            const pct = Math.round(col.progress.percentage)

            return (
              <Link
                key={col.id}
                to={`/collections/${col.id}`}
                className="group relative flex flex-col justify-between rounded-3xl border border-binder-700/80 bg-binder-900/90 p-6 shadow-card transition-all duration-300 hover:-translate-y-2 hover:border-amber-400/60 hover:shadow-card-hover"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                        col.isPublic
                          ? 'border border-emerald-500/30 bg-emerald-950/50 text-emerald-400'
                          : 'border border-amber-500/30 bg-amber-950/50 text-amber-400'
                      }`}
                    >
                      {col.isPublic ? 'Pública' : 'Privada'}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      Por: <b className="text-white">{col.user.username}</b>
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-xl font-black text-white transition group-hover:text-amber-400">
                    {col.name}
                  </h3>

                  <p className="mt-1 text-xs font-medium text-slate-400">
                    Álbum Base: <span className="font-bold text-slate-200">{col.album.name}</span>
                  </p>
                </div>

                {/* Progress Bar & Meter */}
                <div className="mt-6 border-t border-binder-800/80 pt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Progreso
                    </span>
                    <span className="font-mono font-black text-amber-400">
                      {pct}% ({collected}/{total})
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full border border-binder-800 bg-binder-950">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 shadow-sm transition-all duration-500"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
