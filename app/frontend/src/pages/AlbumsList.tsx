import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { api, getFieldErrors } from '@/services/api'
import type { Album } from '@/types'
import { createAlbumSchema, updateAlbumSchema } from '@/validations/album.schema'
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

export default function AlbumsList() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [totalStickers, setTotalStickers] = useState<number | ''>(10)
  const [releaseDate, setReleaseDate] = useState('')
  const [stickerType, setStickerType] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [modalError, setModalError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { user } = useAuth()

  const loadAlbums = async () => {
    try {
      setLoading(true)
      const data = await api<Album[]>('/albums')
      setAlbums(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar álbumes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlbums()
  }, [])

  /** Abre el modal en modo creación (`null`) o edición, precargando el formulario. */
  const openModal = (album: Album | null) => {
    setName(album?.name ?? '')
    setDescription(album?.description ?? '')
    setTotalStickers(album?.totalStickers ?? 10)
    setReleaseDate(album?.releaseDate ? album.releaseDate.slice(0, 10) : '')
    setStickerType(album?.stickerType ?? '')
    setImageFile(null)
    setFieldErrors({})
    setModalError(null)
    setEditingAlbum(album)
    setShowModal(true)
  }

  const handleSubmitAlbum = async (e: FormEvent) => {
    e.preventDefault()
    setModalError(null)
    setFieldErrors({})

    const schema = editingAlbum ? updateAlbumSchema : createAlbumSchema
    const result = schema.safeParse({
      name,
      description,
      stickerType,
      totalStickers: Number(totalStickers),
      releaseDate: releaseDate || null,
    })

    if (!result.success) {
      setFieldErrors(zodFieldErrors(result.error))
      return
    }

    setSubmitting(true)
    try {
      let imageUrl: string | undefined = undefined

      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)
        const uploadRes = await api<{ imageUrl: string }>('/upload', {
          method: 'POST',
          body: formData,
        })
        imageUrl = uploadRes.imageUrl
      }

      await api<Album>(editingAlbum ? `/albums/${editingAlbum.id}` : '/albums', {
        method: editingAlbum ? 'PUT' : 'POST',
        body: JSON.stringify({ ...result.data, imageUrl }),
      })

      setShowModal(false)
      setEditingAlbum(null)
      await loadAlbums()
    } catch (err: unknown) {
      const { fields, form } = serverErrors(
        err,
        editingAlbum ? 'Error al actualizar el álbum' : 'Error al crear el álbum',
      )
      setFieldErrors(fields)
      setModalError(form)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-10">
      {/* Editorial Collector Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-binder-700/80 bg-gradient-to-br from-binder-900 via-binder-900/90 to-indigo-950/40 p-8 shadow-2xl md:p-12">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-20 h-60 w-60 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1 text-xs font-black uppercase tracking-widest text-amber-400 backdrop-blur-md">
            <span>Plataforma Oficial para Coleccionistas</span>
          </div>

          <h1 className="mt-4 font-display text-4xl font-black tracking-tight text-white sm:text-6xl leading-[1.08]">
            El arte de coleccionar, <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              en tu pantalla.
            </span>
          </h1>

          <p className="mt-4 text-base font-medium text-slate-300 leading-relaxed max-w-2xl">
            Catálogos de torneos, cromos holográficos de edición especial y gestión inteligente de
            repetidas para intercambio entre coleccionistas.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {user ? (
              <button
                type="button"
                onClick={() => openModal(null)}
                className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-6 py-3 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/25 transition hover:brightness-110"
              >
                <span>+</span>
                <span>Crear Nuevo Álbum</span>
              </button>
            ) : (
              <Link
                to="/register"
                className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-6 py-3 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/25 transition hover:brightness-110"
              >
                <span>Empezar a Coleccionar</span>
              </Link>
            )}

            <Link
              to="/collections"
              className="rounded-xl border border-binder-700 bg-binder-800/80 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-200 transition hover:bg-binder-700 hover:text-white"
            >
              Ver Colecciones de la Comunidad
            </Link>
          </div>

          {/* Stats Ribbon */}
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-binder-800/80 pt-6 text-xs text-slate-400">
            <div>
              <span className="block font-mono text-xl font-black text-white">{albums.length}</span>
              <span className="text-[11px] font-semibold text-slate-400">Álbumes Registrados</span>
            </div>
            <div>
              <span className="block font-mono text-xl font-black text-amber-400">100%</span>
              <span className="text-[11px] font-semibold text-slate-400">Cálculo de Repetidas</span>
            </div>
            <div>
              <span className="block font-mono text-xl font-black text-indigo-400">HD</span>
              <span className="text-[11px] font-semibold text-slate-400">Láminas Vectoriales</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-xs font-semibold text-red-300">
          {error}
        </div>
      )}

      {/* Catalog Grid Section */}
      <div>
        <div className="flex items-center justify-between border-b border-binder-800/80 pb-4">
          <div>
            <h2 className="font-display text-2xl font-black text-white">Catálogo de Álbumes</h2>
            <p className="text-xs font-medium text-slate-400">
              Selecciona un álbum para explorar sus cromos o armar tu colección
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block h-9 w-9 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
            <p className="mt-3 text-xs font-bold tracking-widest text-slate-400">
              CARGANDO CATÁLOGO...
            </p>
          </div>
        ) : albums.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-binder-700/80 bg-binder-900/40 py-24 text-center">
            <h3 className="mt-3 font-display text-xl font-black text-white">
              No hay álbumes disponibles
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              ¡Sé el primero en publicar un catálogo de colección!
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => (
              <div
                key={album.id}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-binder-700/80 bg-binder-900/90 shadow-card transition-all duration-300 hover:-translate-y-2 hover:border-amber-400/60 hover:shadow-card-hover"
              >
                {user && album.userId === user.id && (
                  <button
                    type="button"
                    onClick={() => openModal(album)}
                    className="absolute right-3 top-3 z-10 rounded-lg border border-amber-400/30 bg-black/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300 backdrop-blur-md transition hover:bg-black/90 hover:text-amber-200"
                    title="Editar este álbum"
                  >
                    Editar
                  </button>
                )}

                <Link to={`/albums/${album.id}`} className="flex flex-1 flex-col">
                  {/* Physical Album Cover (Lomo encuadernado y portada deluxe) */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-binder-950 binder-spine">
                    {album.imageUrl ? (
                      <img
                        src={album.imageUrl}
                        alt={album.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-binder-800 to-binder-950 p-6 text-center">
                        <p className="mt-2 font-display text-lg font-black text-slate-300">
                          {album.name}
                        </p>
                      </div>
                    )}

                    {/* Badges Flotantes sobre portada */}
                    <div className="absolute inset-0 bg-gradient-to-t from-binder-950 via-transparent to-transparent opacity-90" />

                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                      <span className="rounded-lg bg-black/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300 backdrop-blur-md border border-amber-400/30">
                        {album.stickerType || 'Fútbol'}
                      </span>
                      <span className="rounded-lg bg-black/70 px-2.5 py-1 font-mono text-[11px] font-black text-white backdrop-blur-md border border-white/10">
                        {album.totalStickers} LÁMINAS
                      </span>
                    </div>
                  </div>

                  {/* Info del Álbum */}
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-xl font-black text-white transition group-hover:text-amber-400">
                      {album.name}
                    </h3>

                    {album.description && (
                      <p className="mt-2 line-clamp-2 text-xs font-medium text-slate-400 leading-relaxed">
                        {album.description}
                      </p>
                    )}

                    <div className="mt-auto pt-5 flex items-center justify-between border-t border-binder-800/80 text-[11px] font-semibold text-slate-400">
                      <span>
                        {album.releaseDate
                          ? new Date(album.releaseDate).toLocaleDateString()
                          : 'Edición oficial'}
                      </span>
                      <span className="inline-flex items-center space-x-1 font-black uppercase tracking-wider text-amber-400 group-hover:translate-x-1 transition-transform">
                        <span>Explorar</span>
                        <span>→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal crear álbum */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-binder-700 bg-binder-900 p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-binder-800 pb-4">
              <div>
                <h3 className="font-display text-2xl font-black text-white">
                  {editingAlbum ? 'Editar Álbum' : 'Publicar Nuevo Álbum'}
                </h3>
                <p className="text-xs text-slate-400">
                  {editingAlbum
                    ? 'Actualiza los datos del catálogo oficial'
                    : 'Crea el catálogo oficial con su capacidad de láminas'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-binder-800 text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            {modalError && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs font-semibold text-red-300">
                {modalError}
              </div>
            )}

            <form noValidate onSubmit={handleSubmitAlbum} className="mt-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Nombre del Álbum
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
                  placeholder="Ej. Copa Mundial FIFA 2026"
                />
                {fieldErrors.name && (
                  <p className="mt-1.5 text-xs font-semibold text-red-400">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    if (fieldErrors.description)
                      setFieldErrors((prev) => ({ ...prev, description: '' }))
                  }}
                  className={`mt-1.5 w-full rounded-xl border bg-binder-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none ${
                    fieldErrors.description
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-binder-700 focus:border-amber-400'
                  }`}
                  rows={2}
                  placeholder="Reseña del torneo o colección..."
                />
                {fieldErrors.description && (
                  <p className="mt-1.5 text-xs font-semibold text-red-400">
                    {fieldErrors.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    Total Láminas
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={totalStickers}
                    onChange={(e) => {
                      setTotalStickers(e.target.value === '' ? '' : Number(e.target.value))
                      if (fieldErrors.totalStickers)
                        setFieldErrors((prev) => ({ ...prev, totalStickers: '' }))
                    }}
                    className={`mt-1.5 w-full rounded-xl border bg-binder-950 px-3.5 py-2 text-sm text-white focus:outline-none ${
                      fieldErrors.totalStickers
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-binder-700 focus:border-amber-400'
                    }`}
                  />
                  {fieldErrors.totalStickers && (
                    <p className="mt-1.5 text-xs font-semibold text-red-400">
                      {fieldErrors.totalStickers}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    Categoría / Deporte
                  </label>
                  <input
                    type="text"
                    value={stickerType}
                    onChange={(e) => {
                      setStickerType(e.target.value)
                      if (fieldErrors.stickerType)
                        setFieldErrors((prev) => ({ ...prev, stickerType: '' }))
                    }}
                    className={`mt-1.5 w-full rounded-xl border bg-binder-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none ${
                      fieldErrors.stickerType
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-binder-700 focus:border-amber-400'
                    }`}
                    placeholder="Fútbol, Básquetbol..."
                  />
                  {fieldErrors.stickerType && (
                    <p className="mt-1.5 text-xs font-semibold text-red-400">
                      {fieldErrors.stickerType}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Fecha de Lanzamiento
                </label>
                <input
                  type="date"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-binder-700 bg-binder-950 px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Foto de Portada (opcional)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="mt-1.5 block w-full text-xs text-slate-400 file:mr-3 file:rounded-xl file:border-0 file:bg-binder-800 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-amber-400 hover:file:bg-binder-700"
                />
                {editingAlbum?.imageUrl && !imageFile && (
                  <p className="mt-1.5 text-[11px] font-medium text-slate-500">
                    Déjalo vacío para conservar la portada actual.
                  </p>
                )}
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
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-6 py-2 text-xs font-black uppercase tracking-wider text-slate-950 hover:brightness-110 disabled:opacity-50"
                >
                  {submitting
                    ? 'Guardando...'
                    : editingAlbum
                      ? 'Guardar Cambios'
                      : 'Publicar Álbum'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
