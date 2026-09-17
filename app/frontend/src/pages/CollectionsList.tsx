import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { api, getFieldErrors } from '@/services/api'
import type { Album, CollectionSummary } from '@/types'
import { createCollectionSchema } from '@/validations/collection.schema'
import { fieldErrors as zodFieldErrors } from '@/validations/common'
import '@/validations/errorMap'

/** Errores del servidor: por campo (`fieldErrors`) o de formulario (clave `_form`). */
function serverErrors(
  err: unknown,
  fallback: string,
): { fields: Record<string, string>; form: string | null } {
  const { _form, ...fields } = getFieldErrors(err)
  if (_form) return { fields, form: _form }
  if (Object.keys(fields).length > 0) return { fields, form: null }
  return { fields, form: err instanceof Error ? err.message : fallback }
}

export default function CollectionsList() {
  const [collections, setCollections] = useState<CollectionSummary[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create modal
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | ''>('')
  const [isPublic, setIsPublic] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [modalError, setModalError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { user } = useAuth()

  const loadCollections = async () => {
    try {
      setLoading(true)
      const url =
        activeTab === 'mine' && user
          ? `/collections?userId=${user.id}`
          : '/collections?isPublic=true'
      const data = await api<CollectionSummary[]>(url)
      setCollections(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar colecciones')
    } finally {
      setLoading(false)
    }
  }

  const loadAlbums = async () => {
    try {
      const data = await api<Album[]>('/albums')
      setAlbums(data)
      if (data.length > 0) setSelectedAlbumId(data[0].id)
    } catch {
      // Ignore
    }
  }

  useEffect(() => {
    loadCollections()
  }, [activeTab, user])

  useEffect(() => {
    if (user) loadAlbums()
  }, [user])

  const handleCreateCollection = async (e: FormEvent) => {
    e.preventDefault()
    setModalError(null)
    setFieldErrors({})

    const result = createCollectionSchema.safeParse({
      name,
      albumId: Number(selectedAlbumId),
      isPublic,
    })

    if (!result.success) {
      setFieldErrors(zodFieldErrors(result.error))
      return
    }

    setSubmitting(true)
    try {
      await api<CollectionSummary>('/collections', {
        method: 'POST',
        body: JSON.stringify(result.data),
      })

      setShowModal(false)
      setName('')
      setIsPublic(false)
      setFieldErrors({})
      setActiveTab('mine')
      await loadCollections()
    } catch (err: unknown) {
      const { fields, form } = serverErrors(err, 'Error al crear la colección')
      setFieldErrors(fields)
      setModalError(form)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 pb-6 border-b border-binder-800/80 md:flex-row md:items-end">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-amber-400">
            <span>Comunidad de Coleccionistas</span>
            <span>•</span>
            <span>Álbumes en Proceso</span>
          </div>
          <h1 className="mt-1.5 font-display text-4xl font-black tracking-tight text-white sm:text-5xl">
            Colecciones Activas
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-slate-400">
            Revisa álbumes compartidos por otros usuarios, verifica su avance y organiza tus láminas
            e intercambios.
          </p>
        </div>

        {user && (
          <button
            type="button"
            onClick={() => {
              setModalError(null)
              setFieldErrors({})
              setShowModal(true)
            }}
            className="inline-flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/20 transition hover:brightness-110"
          >
            <span>+</span>
            <span>Nueva Colección</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-binder-800">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`border-b-2 px-6 py-3 text-xs font-black uppercase tracking-wider transition ${
            activeTab === 'all'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Colecciones Públicas
        </button>
        {user && (
          <button
            type="button"
            onClick={() => setActiveTab('mine')}
            className={`border-b-2 px-6 py-3 text-xs font-black uppercase tracking-wider transition ${
              activeTab === 'mine'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Mis Colecciones
          </button>
        )}
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
            No hay colecciones aquí
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            {activeTab === 'mine'
              ? 'Aún no has iniciado ninguna colección. ¡Haz clic en "+ Nueva Colección" para arrancar!'
              : 'No hay colecciones marcadas como públicas.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col) => (
            <div
              key={col.id}
              className="group relative flex flex-col rounded-3xl border border-binder-700/80 bg-binder-900/90 p-6 shadow-card transition-all duration-300 hover:-translate-y-2 hover:border-amber-400/60 hover:shadow-card-hover"
            >
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
                  Por:{' '}
                  <Link
                    to={`/users/${col.user.id}`}
                    className="font-bold text-white transition hover:text-amber-400 hover:underline"
                  >
                    {col.user.username}
                  </Link>
                </span>
              </div>

              <Link to={`/collections/${col.id}`} className="flex flex-1 flex-col justify-between">
                <div className="mt-4">
                  <h3 className="font-display text-xl font-black text-white transition group-hover:text-amber-400">
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
                      {col.progress.percentage}% ({col.progress.collectedCount}/
                      {col.progress.totalStickers})
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-binder-950 border border-binder-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500 shadow-sm"
                      style={{ width: `${Math.min(col.progress.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nueva Colección */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-binder-700 bg-binder-900 p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-binder-800 pb-3">
              <h3 className="font-display text-xl font-black text-white">Iniciar Colección</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            {modalError && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs font-semibold text-red-300">
                {modalError}
              </div>
            )}

            <form noValidate onSubmit={handleCreateCollection} className="mt-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Nombre de tu Colección
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }))
                  }}
                  className={`mt-1.5 w-full rounded-xl border bg-binder-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none ${
                    fieldErrors.name
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-binder-700 focus:border-amber-400'
                  }`}
                  placeholder="Ej. Mi Álbum del Mundial"
                />
                {fieldErrors.name && (
                  <p className="mt-1.5 text-xs font-semibold text-red-400">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Seleccionar Álbum Catálogo
                </label>
                {albums.length === 0 ? (
                  <p className="mt-1.5 text-xs font-medium text-red-400">
                    No hay álbumes creados en el sistema. Primero crea un álbum.
                  </p>
                ) : (
                  <select
                    value={selectedAlbumId}
                    onChange={(e) => {
                      setSelectedAlbumId(Number(e.target.value))
                      if (fieldErrors.albumId) setFieldErrors((prev) => ({ ...prev, albumId: '' }))
                    }}
                    className={`mt-1.5 w-full rounded-xl border bg-binder-950 px-3.5 py-2.5 text-sm text-white focus:outline-none ${
                      fieldErrors.albumId
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-binder-700 focus:border-amber-400'
                    }`}
                  >
                    {albums.map((alb) => (
                      <option key={alb.id} value={alb.id}>
                        {alb.name} ({alb.totalStickers} láminas)
                      </option>
                    ))}
                  </select>
                )}
                {fieldErrors.albumId && (
                  <p className="mt-1.5 text-xs font-semibold text-red-400">{fieldErrors.albumId}</p>
                )}
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 rounded border-binder-700 bg-binder-950 text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="isPublic" className="text-xs font-semibold text-slate-300">
                  Colección pública (compartida con la comunidad)
                </label>
              </div>

              <div className="mt-6 flex justify-end space-x-3 border-t border-binder-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-binder-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-binder-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || albums.length === 0}
                  className="rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-6 py-2 text-xs font-black uppercase tracking-wider text-slate-950 hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? 'Iniciando...' : 'Iniciar Colección'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
