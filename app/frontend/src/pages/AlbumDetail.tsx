import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { api, getFieldErrors, getIssues, isApiError } from '@/services/api'
import type { Album, Sticker } from '@/types'
import {
  createStickerSchema,
  createStickersBulkSchema,
  MAX_BULK_STICKERS,
  updateStickerSchema,
} from '@/validations/sticker.schema'
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

/** Lámina leída del textarea, junto al número de línea del que proviene. */
interface ParsedBulkRow {
  line: number
  sticker: { number: number; name: string; type?: string }
}

/** Error de la carga masiva: `line` es la línea del textarea, o `null` si es general. */
interface BulkIssue {
  line: number | null
  message: string
}

export default function AlbumDetail() {
  const { id } = useParams<{ id: string }>()
  const [album, setAlbum] = useState<Album | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Zoom / Acrylic Display Inspector Modal
  const [inspectedSticker, setInspectedSticker] = useState<Sticker | null>(null)

  // Add / Edit Sticker Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSticker, setEditingSticker] = useState<Sticker | null>(null)
  const [stickerNumber, setStickerNumber] = useState<number | ''>('')
  const [stickerName, setStickerName] = useState('')
  const [stickerType, setStickerType] = useState('')
  const [stickerFile, setStickerFile] = useState<File | null>(null)
  const [stickerErrors, setStickerErrors] = useState<Record<string, string>>({})
  const [modalError, setModalError] = useState<string | null>(null)

  // Bulk Modal
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkInput, setBulkInput] = useState('')
  const [bulkIssues, setBulkIssues] = useState<BulkIssue[]>([])

  // Inline confirmations
  const [deletingStickerId, setDeletingStickerId] = useState<number | null>(null)
  const [confirmDeleteAlbum, setConfirmDeleteAlbum] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const loadAlbum = async () => {
    try {
      setLoading(true)
      const data = await api<Album>(`/albums/${id}`)
      setAlbum(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar el álbum')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadAlbum()
  }, [id])

  const isOwner = user && album && album.userId === user.id

  /** Abre el modal de lámina en modo creación (`null`) o edición, precargando el formulario. */
  const openStickerModal = (sticker: Sticker | null) => {
    setStickerNumber(sticker?.number ?? '')
    setStickerName(sticker?.name ?? '')
    setStickerType(sticker?.type ?? '')
    setStickerFile(null)
    setStickerErrors({})
    setModalError(null)
    setEditingSticker(sticker)
    setShowAddModal(true)
  }

  const handleSubmitSticker = async (e: FormEvent) => {
    e.preventDefault()
    if (!album) return
    setModalError(null)
    setStickerErrors({})

    const schema = editingSticker ? updateStickerSchema : createStickerSchema
    const result = schema.safeParse({
      number: Number(stickerNumber),
      name: stickerName,
      type: stickerType,
    })

    if (!result.success) {
      setStickerErrors(zodFieldErrors(result.error))
      return
    }

    setSubmitting(true)
    try {
      let imageUrl: string | undefined = undefined
      if (stickerFile) {
        const formData = new FormData()
        formData.append('file', stickerFile)
        const uploadRes = await api<{ imageUrl: string }>('/upload', {
          method: 'POST',
          body: formData,
        })
        imageUrl = uploadRes.imageUrl
      }

      await api<Sticker>(
        editingSticker ? `/stickers/${editingSticker.id}` : `/albums/${album.id}/stickers`,
        {
          method: editingSticker ? 'PUT' : 'POST',
          body: JSON.stringify({ ...result.data, imageUrl }),
        },
      )

      setShowAddModal(false)
      setEditingSticker(null)
      await loadAlbum()
    } catch (err: unknown) {
      // 409: ya existe una lámina con ese número dentro del álbum.
      if (isApiError(err) && err.status === 409) {
        setStickerErrors({ number: err.message })
        return
      }

      const { fields, form } = serverErrors(
        err,
        editingSticker ? 'Error al actualizar la lámina' : 'Error al agregar lámina',
      )
      setStickerErrors(fields)
      setModalError(form)
    } finally {
      setSubmitting(false)
    }
  }

  const handleBulkCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!album) return
    setBulkIssues([])

    // Cada línea no vacía del textarea es una lámina con formato `Número, Nombre, Tipo`.
    const rows: ParsedBulkRow[] = []
    bulkInput.split('\n').forEach((raw, index) => {
      if (raw.trim() === '') return
      const parts = raw.split(/[,;\t]/).map((part) => part.trim())
      rows.push({
        line: index + 1,
        sticker: { number: Number(parts[0]), name: parts[1] ?? '', type: parts[2] || undefined },
      })
    })

    const result = createStickersBulkSchema.safeParse({ stickers: rows.map((row) => row.sticker) })
    if (!result.success) {
      setBulkIssues(
        result.error.issues.map((issue) => ({
          line: rows[Number(issue.path[1])]?.line ?? null,
          message: issue.message,
        })),
      )
      return
    }

    setSubmitting(true)
    try {
      await api(`/albums/${album.id}/stickers/bulk`, {
        method: 'POST',
        body: JSON.stringify(result.data),
      })

      setShowBulkModal(false)
      setBulkInput('')
      setBulkIssues([])
      await loadAlbum()
    } catch (err: unknown) {
      const apiIssues = getIssues(err)
      setBulkIssues(
        apiIssues.length > 0
          ? apiIssues.map((issue) => ({
              line: rows[Number(issue.path.split('.')[1])]?.line ?? null,
              message: issue.message,
            }))
          : [{ line: null, message: err instanceof Error ? err.message : 'Error en carga masiva' }],
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSticker = async (stickerId: number) => {
    try {
      await api(`/stickers/${stickerId}`, { method: 'DELETE' })
      setDeletingStickerId(null)
      await loadAlbum()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al eliminar lámina')
    }
  }

  const handleDeleteAlbum = async () => {
    if (!album) return
    try {
      await api(`/albums/${album.id}`, { method: 'DELETE' })
      navigate('/albums')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al eliminar álbum')
      setConfirmDeleteAlbum(false)
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block h-9 w-9 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
        <p className="mt-3 text-xs font-bold tracking-widest text-slate-400">CARGANDO ÁLBUM...</p>
      </div>
    )
  }

  if (!album) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-xl font-black text-red-400">Álbum no encontrado</p>
        <Link
          to="/albums"
          className="mt-4 inline-block text-xs font-bold text-amber-400 hover:underline"
        >
          ← Volver al catálogo de álbumes
        </Link>
      </div>
    )
  }

  const stickers = album.stickers ?? []
  const stickersCount = stickers.length
  const isCatalogComplete = stickersCount >= album.totalStickers

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <Link
        to="/albums"
        className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400 transition hover:text-amber-400"
      >
        <span>←</span>
        <span>Volver a Catálogo de Álbumes</span>
      </Link>

      {/* Deluxe Album Inner Cover Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-binder-700/90 bg-gradient-to-br from-binder-900 via-binder-900 to-indigo-950/40 p-6 shadow-2xl md:p-8">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center">
          {/* Hardcover Cover Card with Binder Spine */}
          <div className="relative aspect-[16/11] w-full flex-shrink-0 overflow-hidden rounded-2xl border border-binder-700 bg-binder-950 shadow-2xl binder-spine md:w-72">
            {album.imageUrl ? (
              <img src={album.imageUrl} alt={album.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-binder-800 to-binder-950 p-6 text-center">
                <span className="text-6xl">🏆</span>
                <p className="mt-2 font-display text-lg font-black text-white">{album.name}</p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-binder-950 via-transparent to-transparent opacity-80" />
            <span className="absolute bottom-3 left-3 rounded-lg bg-black/75 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-400 backdrop-blur-md border border-amber-400/30">
              {album.stickerType || 'Fútbol'}
            </span>
          </div>

          {/* Album Details */}
          <div className="flex flex-1 flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center space-x-1.5 rounded-full bg-amber-400/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-400 border border-amber-400/30">
                    <span>★</span>
                    <span>Colección Oficial</span>
                  </span>
                  {isCatalogComplete && (
                    <span className="rounded-full border border-emerald-500/40 bg-emerald-950/40 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-400">
                      ✓ Catálogo 100%
                    </span>
                  )}
                </div>

                {isOwner && !confirmDeleteAlbum && (
                  <button
                    onClick={() => setConfirmDeleteAlbum(true)}
                    className="rounded-xl border border-red-900/60 bg-red-950/40 px-3.5 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-900/60 hover:text-white"
                  >
                    Eliminar Álbum
                  </button>
                )}
              </div>

              <h1 className="mt-3 font-display text-3xl font-black tracking-tight text-white sm:text-5xl">
                {album.name}
              </h1>
              {album.description && (
                <p className="mt-2 text-sm font-medium text-slate-300 leading-relaxed max-w-2xl">
                  {album.description}
                </p>
              )}
            </div>

            {/* Metrics Pills */}
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-binder-800/80 pt-5">
              <div className="rounded-2xl border border-binder-700/80 bg-binder-950/70 px-4 py-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Capacidad Total
                </span>
                <p className="font-mono text-lg font-black text-white">
                  {album.totalStickers} láminas
                </p>
              </div>

              <div className="rounded-2xl border border-binder-700/80 bg-binder-950/70 px-4 py-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Láminas en Catálogo
                </span>
                <p className="font-mono text-lg font-black text-amber-400">
                  {stickersCount} de {album.totalStickers}
                </p>
              </div>

              {album.releaseDate && (
                <div className="rounded-2xl border border-binder-700/80 bg-binder-950/70 px-4 py-2.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Lanzamiento
                  </span>
                  <p className="text-xs font-bold text-slate-200">
                    {new Date(album.releaseDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation of Delete */}
      {confirmDeleteAlbum && (
        <div className="rounded-2xl border border-red-500/50 bg-red-950/70 p-5 shadow-2xl">
          <p className="text-sm font-bold text-red-200">
            ⚠️ ¿Confirmas que deseas eliminar el álbum "{album.name}" y todas sus láminas asociadas?
          </p>
          <div className="mt-3 flex space-x-3">
            <button
              onClick={handleDeleteAlbum}
              className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-red-500"
            >
              Sí, eliminar definitivamente
            </button>
            <button
              onClick={() => setConfirmDeleteAlbum(false)}
              className="rounded-xl border border-binder-700 bg-binder-900 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-binder-800"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-xs font-semibold text-red-300">
          {error}
        </div>
      )}

      {/* Action Toolbar for Owner */}
      {isOwner && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => openStickerModal(null)}
            className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-110"
          >
            <span>+</span>
            <span>Añadir Lámina</span>
          </button>
          <button
            onClick={() => {
              setBulkIssues([])
              setShowBulkModal(true)
            }}
            className="inline-flex items-center space-x-1.5 rounded-xl border border-binder-700 bg-binder-800/80 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-binder-700 hover:text-white"
          >
            <span>⚡</span>
            <span>Carga Masiva</span>
          </button>
        </div>
      )}

      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-binder-800/80 pb-3 pt-4">
        <div>
          <h2 className="font-display text-2xl font-black text-white">
            Colección de Láminas ({stickersCount})
          </h2>
          <p className="text-xs font-medium text-slate-400">
            Haz clic en cualquier cromo para examinarlo en el visor de alta resolución
          </p>
        </div>
      </div>

      {/* Sticker Grid: Grandes, Proporcionadas y con Acabado Coleccionista */}
      {stickers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-binder-700/80 bg-binder-900/40 py-20 text-center">
          <span className="text-4xl">🃏</span>
          <h3 className="mt-3 font-display text-xl font-black text-white">Álbum vacío</h3>
          <p className="mt-1 text-xs text-slate-400">
            Aún no se han publicado láminas para este álbum.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
          {stickers.map((st) => {
            const isSpecial =
              st.type?.toLowerCase().includes('brillante') ||
              st.type?.toLowerCase().includes('especial') ||
              st.type?.toLowerCase().includes('capitán') ||
              st.type?.toLowerCase().includes('oro')

            return (
              <div
                key={st.id}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-binder-900/90 p-3 shadow-card transition-all duration-300 hover:-translate-y-2 hover:shadow-card-hover ${
                  isSpecial
                    ? 'border-amber-400/50 hover:border-amber-300 holo-foil'
                    : 'border-binder-700/80 hover:border-indigo-400/60'
                }`}
              >
                {/* Visual en Aspect Ratio 3:4 con Zoom */}
                <div
                  onClick={() => setInspectedSticker(st)}
                  className="relative aspect-[3/4] w-full cursor-zoom-in overflow-hidden rounded-xl bg-binder-950 shadow-inner"
                >
                  {st.imageUrl ? (
                    <img
                      src={st.imageUrl}
                      alt={st.name}
                      className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center p-3 text-center">
                      <span className="font-mono text-3xl font-black text-slate-700">
                        #{st.number}
                      </span>
                      <p className="mt-2 font-display text-xs font-bold text-slate-300">
                        {st.name}
                      </p>
                      {st.type && (
                        <span className="mt-1 text-[10px] font-bold text-amber-400">{st.type}</span>
                      )}
                    </div>
                  )}

                  {/* Shimmer overlay al hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 flex items-end justify-center pb-2.5">
                    <span className="rounded-lg bg-black/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-400 backdrop-blur-md border border-amber-400/30">
                      🔍 Inspeccionar
                    </span>
                  </div>
                </div>

                {/* Pie del Cromo */}
                <div className="mt-3 flex items-center justify-between px-1">
                  <span className="font-mono text-xs font-black text-amber-400">
                    #{st.number < 10 ? `0${st.number}` : st.number}
                  </span>
                  <p
                    className="truncate px-2 text-center text-xs font-black text-white"
                    title={st.name}
                  >
                    {st.name}
                  </p>
                  {st.type ? (
                    <span className="rounded-md bg-binder-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-300">
                      {st.type}
                    </span>
                  ) : (
                    <span />
                  )}
                </div>

                {/* Delete button for Owner */}
                {isOwner && (
                  <div className="mt-2 border-t border-binder-800/80 pt-2 text-center">
                    {deletingStickerId === st.id ? (
                      <div className="flex items-center justify-center space-x-1.5">
                        <span className="text-[10px] font-bold text-red-400">¿Borrar?</span>
                        <button
                          onClick={() => handleDeleteSticker(st.id)}
                          className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-red-500"
                        >
                          Sí
                        </button>
                        <button
                          onClick={() => setDeletingStickerId(null)}
                          className="rounded bg-binder-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 hover:bg-binder-700"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-3">
                        <button
                          onClick={() => openStickerModal(st)}
                          className="text-[10px] font-bold text-slate-500 transition hover:text-amber-400 hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeletingStickerId(st.id)}
                          className="text-[10px] font-bold text-slate-500 transition hover:text-red-400 hover:underline"
                        >
                          Eliminar lámina
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Collector Display Slab Modal (INSPECTOR DE ALTA RESOLUCIÓN) */}
      {inspectedSticker && (
        <div
          onClick={() => setInspectedSticker(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex w-full max-w-md flex-col items-center rounded-3xl border-2 border-amber-400/50 bg-binder-900 p-7 shadow-foil"
          >
            <button
              onClick={() => setInspectedSticker(null)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-binder-800 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <span className="font-mono text-[10px] font-black uppercase tracking-[0.25em] text-amber-400">
              COLECCIONABLE OFICIAL • STICKDEX
            </span>

            {/* Carta física ampliada */}
            <div className="mt-5 aspect-[3/4] w-full max-w-[320px] overflow-hidden rounded-2xl border-2 border-amber-400/60 bg-binder-950 shadow-2xl">
              {inspectedSticker.imageUrl ? (
                <img
                  src={inspectedSticker.imageUrl}
                  alt={inspectedSticker.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                  <span className="font-mono text-7xl font-black text-slate-700">
                    #{inspectedSticker.number}
                  </span>
                  <p className="mt-4 font-display text-2xl font-black text-white">
                    {inspectedSticker.name}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 text-center">
              <h3 className="font-display text-2xl font-black text-white">
                #{inspectedSticker.number} — {inspectedSticker.name}
              </h3>
              {inspectedSticker.type && (
                <span className="mt-2.5 inline-block rounded-full bg-amber-400/15 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-amber-300 border border-amber-400/40">
                  {inspectedSticker.type}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Añadir Lámina */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-binder-700 bg-binder-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-binder-800 pb-3">
              <div>
                <h3 className="font-display text-xl font-black text-white">
                  {editingSticker ? 'Editar Lámina' : 'Añadir Lámina al Álbum'}
                </h3>
                <p className="text-xs text-slate-400">
                  {editingSticker
                    ? `Lámina #${editingSticker.number} de este álbum`
                    : 'La lámina se publica en el catálogo oficial'}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs font-semibold text-red-300">
                {modalError}
              </div>
            )}

            <form noValidate onSubmit={handleSubmitSticker} className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    Nº
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={stickerNumber}
                    onChange={(e) => {
                      setStickerNumber(e.target.value === '' ? '' : Number(e.target.value))
                      if (stickerErrors.number)
                        setStickerErrors((prev) => ({ ...prev, number: '' }))
                    }}
                    className={`mt-1.5 w-full rounded-xl border bg-binder-950 px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none ${
                      stickerErrors.number
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-binder-700 focus:border-amber-400'
                    }`}
                    placeholder="1"
                  />
                  {stickerErrors.number && (
                    <p className="mt-1 text-xs font-semibold text-red-400">
                      {stickerErrors.number}
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    Tipo / Rol
                  </label>
                  <input
                    type="text"
                    value={stickerType}
                    onChange={(e) => setStickerType(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-binder-700 bg-binder-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                    placeholder="Brillante, Capitán..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Nombre del Jugador / Elemento
                </label>
                <input
                  type="text"
                  value={stickerName}
                  onChange={(e) => {
                    setStickerName(e.target.value)
                    if (stickerErrors.name) setStickerErrors((prev) => ({ ...prev, name: '' }))
                  }}
                  className={`mt-1.5 w-full rounded-xl border bg-binder-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none ${
                    stickerErrors.name
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-binder-700 focus:border-amber-400'
                  }`}
                  placeholder="Lionel Messi"
                />
                {stickerErrors.name && (
                  <p className="mt-1 text-xs font-semibold text-red-400">{stickerErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Foto de la Lámina (opcional)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setStickerFile(e.target.files?.[0] || null)}
                  className="mt-1.5 block w-full text-xs text-slate-400 file:mr-3 file:rounded-xl file:border-0 file:bg-binder-800 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-amber-400 hover:file:bg-binder-700"
                />
                {editingSticker?.imageUrl && !stickerFile && (
                  <p className="mt-1.5 text-[11px] font-medium text-slate-500">
                    Déjalo vacío para conservar la imagen actual.
                  </p>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3 border-t border-binder-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-binder-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-binder-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-5 py-2 text-xs font-black uppercase tracking-wider text-slate-950 hover:brightness-110 disabled:opacity-50"
                >
                  {submitting
                    ? 'Guardando...'
                    : editingSticker
                      ? 'Guardar Cambios'
                      : 'Añadir Lámina'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Carga Masiva */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-binder-700 bg-binder-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-binder-800 pb-3">
              <h3 className="font-display text-xl font-black text-white">
                Carga Masiva de Láminas
              </h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-xs font-medium text-slate-400">
              Ingresa una lámina por línea en formato:{' '}
              <code className="rounded bg-binder-950 px-1.5 py-0.5 font-mono text-amber-300">
                Número, Nombre, Tipo
              </code>{' '}
              (hasta {MAX_BULK_STICKERS} láminas por carga)
            </p>

            {bulkIssues.length > 0 && (
              <ul className="mt-3 space-y-1 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs font-semibold text-red-300">
                {bulkIssues.map((issue, index) => (
                  <li key={index}>
                    {issue.line === null ? issue.message : `Fila ${issue.line}: ${issue.message}`}
                  </li>
                ))}
              </ul>
            )}

            <form noValidate onSubmit={handleBulkCreate} className="mt-4 space-y-4">
              <textarea
                rows={7}
                value={bulkInput}
                onChange={(e) => {
                  setBulkInput(e.target.value)
                  if (bulkIssues.length > 0) setBulkIssues([])
                }}
                className={`w-full rounded-xl border bg-binder-950 p-3 font-mono text-xs text-white placeholder-slate-600 focus:outline-none ${
                  bulkIssues.length > 0
                    ? 'border-red-500'
                    : 'border-binder-700 focus:border-amber-400'
                }`}
                placeholder={`1, Escudo FIFA, Brillante\n2, Lionel Messi, Capitán\n3, Kylian Mbappé, Delantero`}
              />

              <div className="flex justify-end space-x-3 border-t border-binder-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="rounded-xl border border-binder-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-binder-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-5 py-2 text-xs font-black uppercase tracking-wider text-slate-950 hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? 'Procesando...' : 'Cargar Láminas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
