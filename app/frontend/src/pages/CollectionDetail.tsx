import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { api, getFieldErrors } from '@/services/api'
import type {
  Album,
  CollectionDetail as CollectionDetailData,
  CollectionSummary,
  DuplicatedSticker,
  Sticker,
} from '@/types'
import {
  addCollectedStickerSchema,
  updateCollectedStickerSchema,
  updateCollectionSchema,
} from '@/validations/collection.schema'
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

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>()
  const [collection, setCollection] = useState<CollectionDetailData | null>(null)
  const [missingStickers, setMissingStickers] = useState<Sticker[]>([])
  const [duplicateStickers, setDuplicateStickers] = useState<DuplicatedSticker[]>([])
  const [albumStickers, setAlbumStickers] = useState<Sticker[]>([])

  const [activeTab, setActiveTab] = useState<'collected' | 'missing' | 'duplicates'>('collected')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Zoom / Card Inspector Modal
  const [inspectedSticker, setInspectedSticker] = useState<Sticker | null>(null)

  // Add Sticker Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedStickerId, setSelectedStickerId] = useState<number | ''>('')
  const [quantity, setQuantity] = useState<number | ''>(1)
  const [stickerErrors, setStickerErrors] = useState<Record<string, string>>({})
  const [modalError, setModalError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Rename Modal
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [renameName, setRenameName] = useState('')
  const [renameErrors, setRenameErrors] = useState<Record<string, string>>({})
  const [renameFormError, setRenameFormError] = useState<string | null>(null)

  // Inline confirmations
  const [removingStickerId, setRemovingStickerId] = useState<number | null>(null)
  const [confirmDeleteCollection, setConfirmDeleteCollection] = useState(false)

  const { user } = useAuth()
  const navigate = useNavigate()

  const loadAll = async () => {
    try {
      setLoading(true)
      const col = await api<CollectionDetailData>(`/collections/${id}`)
      setCollection(col)

      // Fetch reports
      const [missing, duplicates] = await Promise.all([
        api<Sticker[]>(`/collections/${id}/missing`).catch(() => []),
        api<DuplicatedSticker[]>(`/collections/${id}/duplicates`).catch(() => []),
      ])
      setMissingStickers(missing)
      setDuplicateStickers(duplicates)

      // If owner, load album stickers for adding
      if (col.albumId) {
        const fullAlbum = await api<Album>(`/albums/${col.albumId}`)
        const albumStickerList = fullAlbum.stickers ?? []
        setAlbumStickers(albumStickerList)
        if (albumStickerList.length > 0 && selectedStickerId === '') {
          setSelectedStickerId(albumStickerList[0].id)
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar la colección')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadAll()
  }, [id])

  const isOwner = user && collection && collection.userId === user.id

  const handleAddSticker = async (e: FormEvent) => {
    e.preventDefault()
    setModalError(null)
    setStickerErrors({})

    const result = addCollectedStickerSchema.safeParse({
      stickerId: Number(selectedStickerId),
      quantity: Number(quantity),
    })

    if (!result.success) {
      setStickerErrors(zodFieldErrors(result.error))
      return
    }

    setSubmitting(true)
    try {
      await api(`/collections/${id}/stickers`, {
        method: 'POST',
        body: JSON.stringify(result.data),
      })
      setShowAddModal(false)
      setQuantity(1)
      setStickerErrors({})
      await loadAll()
    } catch (err: unknown) {
      const { fields, form } = serverErrors(err, 'Error al añadir lámina')
      setStickerErrors(fields)
      setModalError(form)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRenameCollection = async (e: FormEvent) => {
    e.preventDefault()
    setRenameFormError(null)
    setRenameErrors({})

    const result = updateCollectionSchema.safeParse({ name: renameName })
    if (!result.success) {
      setRenameErrors(zodFieldErrors(result.error))
      return
    }

    setSubmitting(true)
    try {
      const updated = await api<CollectionSummary>(`/collections/${id}`, {
        method: 'PUT',
        body: JSON.stringify(result.data),
      })
      setCollection((prev) => (prev ? { ...prev, name: updated.name } : null))
      setShowRenameModal(false)
    } catch (err: unknown) {
      const { fields, form } = serverErrors(err, 'Error al renombrar la colección')
      setRenameErrors(fields)
      setRenameFormError(form)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateQuantity = async (stickerId: number, currentQty: number, delta: number) => {
    const newQty = currentQty + delta

    if (newQty <= 0) {
      await handleRemoveSticker(stickerId)
      return
    }

    const parsed = updateCollectedStickerSchema.safeParse({ quantity: newQty })
    if (!parsed.success) {
      setError(zodFieldErrors(parsed.error).quantity ?? 'Cantidad no válida')
      return
    }

    try {
      await api(`/collections/${id}/stickers/${stickerId}`, {
        method: 'PUT',
        body: JSON.stringify(parsed.data),
      })
      await loadAll()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar cantidad')
    }
  }

  const handleRemoveSticker = async (stickerId: number) => {
    try {
      await api(`/collections/${id}/stickers/${stickerId}`, { method: 'DELETE' })
      setRemovingStickerId(null)
      await loadAll()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al quitar lámina')
    }
  }

  const handleTogglePublic = async () => {
    if (!collection) return

    const parsed = updateCollectionSchema.safeParse({ isPublic: !collection.isPublic })
    if (!parsed.success) {
      setError(zodFieldErrors(parsed.error).isPublic ?? 'Visibilidad no válida')
      return
    }

    try {
      const updated = await api<CollectionSummary>(`/collections/${id}`, {
        method: 'PUT',
        body: JSON.stringify(parsed.data),
      })
      setCollection((prev) => (prev ? { ...prev, isPublic: updated.isPublic } : null))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cambiar visibilidad')
    }
  }

  const handleDeleteCollection = async () => {
    if (!collection) return
    try {
      await api(`/collections/${id}`, { method: 'DELETE' })
      navigate('/collections')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al eliminar colección')
      setConfirmDeleteCollection(false)
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
        <p className="mt-3 text-xs font-bold tracking-widest text-slate-400">
          CARGANDO COLECCIÓN...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-xl font-black text-red-400">{error}</p>
        <Link
          to="/collections"
          className="mt-4 inline-block text-xs font-bold text-amber-400 hover:underline"
        >
          ← Volver a colecciones
        </Link>
      </div>
    )
  }

  if (!collection) return null

  const { progress } = collection
  const isFinished = progress.percentage === 100

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <Link
        to="/collections"
        className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400 transition hover:text-amber-400"
      >
        <span>←</span>
        <span>Volver a Colecciones</span>
      </Link>

      {/* Deluxe Collection Header with Stadium Progress Meter */}
      <div className="relative overflow-hidden rounded-3xl border border-binder-700/90 bg-gradient-to-br from-binder-900 via-binder-900 to-indigo-950/40 p-6 shadow-2xl md:p-8">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="flex items-center space-x-2.5">
              <span
                className={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                  collection.isPublic
                    ? 'border border-emerald-500/30 bg-emerald-950/50 text-emerald-400'
                    : 'border border-amber-500/30 bg-amber-950/50 text-amber-400'
                }`}
              >
                {collection.isPublic ? 'Colección Pública' : 'Colección Privada'}
              </span>
              <span className="text-xs text-slate-400">
                Coleccionista: <b className="text-white">{collection.user.username}</b>
              </span>
            </div>

            <h1 className="mt-3 font-display text-3xl font-black tracking-tight text-white sm:text-5xl">
              {collection.name}
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-400">
              Álbum Oficial:{' '}
              <Link
                to={`/albums/${collection.albumId}`}
                className="font-bold text-amber-400 transition hover:underline"
              >
                {collection.album.name}
              </Link>
            </p>
          </div>

          {/* Owner Action Buttons */}
          {isOwner && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setModalError(null)
                  setStickerErrors({})
                  setShowAddModal(true)
                }}
                className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-110"
              >
                <span>+</span>
                <span>Pegar Lámina</span>
              </button>
              <button
                onClick={() => {
                  setRenameName(collection.name)
                  setRenameErrors({})
                  setRenameFormError(null)
                  setShowRenameModal(true)
                }}
                className="rounded-xl border border-binder-700 bg-binder-800/80 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-binder-700"
              >
                Renombrar
              </button>
              <button
                onClick={handleTogglePublic}
                className="rounded-xl border border-binder-700 bg-binder-800/80 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-binder-700"
              >
                Hacer {collection.isPublic ? 'Privada' : 'Pública'}
              </button>
              {!confirmDeleteCollection && (
                <button
                  onClick={() => setConfirmDeleteCollection(true)}
                  className="rounded-xl px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-950/40"
                >
                  Eliminar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Confirmation of Collection Delete */}
        {confirmDeleteCollection && (
          <div className="mt-6 rounded-2xl border border-red-500/50 bg-red-950/70 p-5 shadow-2xl">
            <p className="text-sm font-bold text-red-200">
              ⚠️ ¿Seguro que deseas eliminar la colección "{collection.name}"? Se perderá el
              registro de láminas pegadas.
            </p>
            <div className="mt-3 flex space-x-3">
              <button
                onClick={handleDeleteCollection}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-red-500"
              >
                Sí, eliminar colección
              </button>
              <button
                onClick={() => setConfirmDeleteCollection(false)}
                className="rounded-xl border border-binder-700 bg-binder-900 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-binder-800"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Progress Gauge */}
        <div className="mt-8 border-t border-binder-800/80 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex items-center space-x-2.5">
              <span className="text-xl">{isFinished ? '🏆' : '⭐'}</span>
              <span className="font-display text-sm font-bold uppercase tracking-wider text-slate-300">
                {isFinished ? '¡Álbum 100% Completado!' : 'Progreso de Colección'}
              </span>
            </div>
            <div className="font-mono text-base font-black text-amber-400">
              {progress.percentage}%{' '}
              <span className="text-xs font-medium text-slate-400">
                ({progress.collectedCount} de {progress.totalStickers} láminas pegadas)
              </span>
            </div>
          </div>

          <div className="mt-3 h-4 w-full overflow-hidden rounded-full bg-binder-950 border border-binder-800 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-700 shadow-lg ${
                isFinished
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-amber-500/50'
                  : 'bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 shadow-amber-500/30'
              }`}
              style={{ width: `${Math.min(progress.percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-binder-800">
        <button
          onClick={() => setActiveTab('collected')}
          className={`border-b-2 px-6 py-3 text-xs font-black uppercase tracking-wider transition ${
            activeTab === 'collected'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Láminas Pegadas ({collection.stickers.length})
        </button>
        <button
          onClick={() => setActiveTab('missing')}
          className={`border-b-2 px-6 py-3 text-xs font-black uppercase tracking-wider transition ${
            activeTab === 'missing'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Faltantes ({missingStickers.length})
        </button>
        <button
          onClick={() => setActiveTab('duplicates')}
          className={`border-b-2 px-6 py-3 text-xs font-black uppercase tracking-wider transition ${
            activeTab === 'duplicates'
              ? 'border-indigo-400 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Repetidas para Cambio ({duplicateStickers.length})
        </button>
      </div>

      {/* Tab 1: Láminas Pegadas (3:4 Ratio, Proporcionadas y con Acabado de Álbum) */}
      {activeTab === 'collected' && (
        <div>
          {collection.stickers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-binder-700/80 bg-binder-900/40 py-20 text-center">
              <span className="text-4xl">📖</span>
              <h3 className="mt-3 font-display text-xl font-black text-white">
                Tu álbum está vacío
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Aún no has pegado láminas en esta colección.
                {isOwner && ' ¡Haz clic en "+ Pegar Lámina" para empezar a llenarlo!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
              {collection.stickers.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-binder-700/80 bg-binder-900/90 p-3 shadow-card transition-all duration-300 hover:-translate-y-2 hover:border-amber-400/60 hover:shadow-card-hover"
                >
                  {/* Card en proporción 3:4 con Zoom */}
                  <div
                    onClick={() => setInspectedSticker(item.sticker)}
                    className="relative aspect-[3/4] w-full cursor-zoom-in overflow-hidden rounded-xl bg-binder-950 shadow-inner"
                  >
                    {item.sticker.imageUrl ? (
                      <img
                        src={item.sticker.imageUrl}
                        alt={item.sticker.name}
                        className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center p-3 text-center">
                        <span className="font-mono text-3xl font-black text-slate-700">
                          #{item.sticker.number}
                        </span>
                        <p className="mt-2 font-display text-xs font-bold text-slate-300">
                          {item.sticker.name}
                        </p>
                      </div>
                    )}

                    {/* Badge de Repetida estilo Moneda Dorada */}
                    {item.quantity > 1 && (
                      <div className="absolute right-2 top-2 flex h-7 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-2.5 shadow-lg shadow-amber-500/40">
                        <span className="font-mono text-xs font-black text-slate-950">
                          ×{item.quantity}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 flex items-end justify-center pb-2.5">
                      <span className="rounded-lg bg-black/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-400 backdrop-blur-md border border-amber-400/30">
                        🔍 Inspeccionar
                      </span>
                    </div>
                  </div>

                  {/* Pie de Lámina */}
                  <div className="mt-3 flex items-center justify-between px-1">
                    <span className="font-mono text-xs font-black text-amber-400">
                      #{item.sticker.number < 10 ? `0${item.sticker.number}` : item.sticker.number}
                    </span>
                    <p
                      className="truncate px-2 text-center text-xs font-black text-white"
                      title={item.sticker.name}
                    >
                      {item.sticker.name}
                    </p>
                    <span className="font-mono text-[10px] text-slate-500">x{item.quantity}</span>
                  </div>

                  {/* Stepper para dueño */}
                  {isOwner && (
                    <div className="mt-2.5 border-t border-binder-800/80 pt-2">
                      {removingStickerId === item.stickerId ? (
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-rose-400">¿Despegar lámina?</p>
                          <div className="mt-1 flex justify-center space-x-1.5">
                            <button
                              onClick={() => handleRemoveSticker(item.stickerId)}
                              className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-rose-500"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setRemovingStickerId(null)}
                              className="rounded bg-binder-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 hover:bg-binder-700"
                            >
                              No
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() =>
                                handleUpdateQuantity(item.stickerId, item.quantity, -1)
                              }
                              className="flex h-6 w-6 items-center justify-center rounded-lg bg-binder-800 text-xs font-black text-slate-300 transition hover:bg-binder-700"
                              title="Restar una copia"
                            >
                              -
                            </button>
                            <span className="w-5 text-center font-mono text-xs font-black text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.stickerId, item.quantity, 1)}
                              className="flex h-6 w-6 items-center justify-center rounded-lg bg-binder-800 text-xs font-black text-amber-400 transition hover:bg-binder-700"
                              title="Sumar una copia (repetida)"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => setRemovingStickerId(item.stickerId)}
                            className="text-[10px] font-bold text-slate-500 hover:text-rose-400 hover:underline"
                          >
                            Quitar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Láminas Faltantes (Casillas vacías de álbum físico) */}
      {activeTab === 'missing' && (
        <div>
          {missingStickers.length === 0 ? (
            <div className="rounded-3xl border border-emerald-500/40 bg-emerald-950/20 py-20 text-center shadow-lg">
              <span className="text-5xl">🏆</span>
              <h3 className="mt-4 font-display text-3xl font-black text-emerald-400">
                ¡ÁLBUM 100% COMPLETADO!
              </h3>
              <p className="mt-1 text-sm text-emerald-300">
                ¡Increíble logro! Has pegado todas las láminas del álbum oficial.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
              {missingStickers.map((st) => (
                <div
                  key={st.id}
                  className="flex aspect-[3/4] flex-col items-center justify-between rounded-2xl border-2 border-dashed border-binder-700/80 bg-binder-950/50 p-4 text-center slot-pattern transition hover:border-rose-500/50"
                >
                  <span className="font-mono text-[11px] font-black tracking-widest text-slate-500">
                    SLOT #{st.number < 10 ? `0${st.number}` : st.number}
                  </span>

                  <div className="flex flex-col items-center">
                    <span className="font-mono text-6xl font-black text-slate-800">
                      #{st.number}
                    </span>
                    <p className="mt-2 font-display text-xs font-black text-slate-400 line-clamp-2">
                      {st.name}
                    </p>
                    {st.type && (
                      <span className="mt-1 text-[10px] font-bold text-slate-500">{st.type}</span>
                    )}
                  </div>

                  <span className="rounded-md bg-rose-950/40 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-rose-400 border border-rose-900/50">
                    Por Pegar
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Láminas Repetidas (Pila de intercambio con insignia dorada) */}
      {activeTab === 'duplicates' && (
        <div>
          {duplicateStickers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-binder-700/80 bg-binder-900/40 py-20 text-center text-sm text-slate-400">
              <span className="text-3xl">🔄</span>
              <p className="mt-2 font-display text-base font-bold text-white">
                No tienes láminas repetidas para intercambio
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Cuando pegues más de 1 copia de un cromo, aparecerán aquí para negociar con otros
                coleccionistas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
              {duplicateStickers.map((dup) => (
                <div
                  key={dup.stickerId}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-amber-400/50 bg-gradient-to-b from-binder-900 to-amber-950/20 p-3 shadow-card"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-binder-950">
                    {dup.imageUrl ? (
                      <img
                        src={dup.imageUrl}
                        alt={dup.name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="font-mono text-5xl font-black text-amber-500/30">
                          #{dup.number}
                        </span>
                      </div>
                    )}

                    <div className="absolute top-2 right-2 rounded-lg bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-2.5 py-1 shadow-md shadow-amber-500/30">
                      <span className="font-mono text-xs font-black text-slate-950">
                        +{dup.quantity - 1} para cambio
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-center">
                    <p className="truncate text-xs font-black text-white" title={dup.name}>
                      #{dup.number} — {dup.name}
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold text-slate-400">
                      Total: {dup.quantity} copias físicas
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Card Inspector Lightbox */}
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
              LÁMINA EN TU COLECCIÓN
            </span>

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
          <div className="w-full max-w-md rounded-3xl border border-binder-700 bg-binder-900 p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-binder-800 pb-3">
              <div>
                <h3 className="font-display text-xl font-black text-white">
                  Pegar Lámina en tu Álbum
                </h3>
                <p className="text-xs text-slate-400">Selecciona el cromo del catálogo oficial</p>
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

            <form noValidate onSubmit={handleAddSticker} className="mt-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Seleccionar Lámina del Catálogo
                </label>
                <select
                  value={selectedStickerId}
                  onChange={(e) => {
                    setSelectedStickerId(Number(e.target.value))
                    if (stickerErrors.stickerId)
                      setStickerErrors((prev) => ({ ...prev, stickerId: '' }))
                  }}
                  className={`mt-1.5 w-full rounded-xl border bg-binder-950 px-3.5 py-2.5 text-sm text-white focus:outline-none ${
                    stickerErrors.stickerId
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-binder-700 focus:border-amber-400'
                  }`}
                >
                  {albumStickers.map((st) => (
                    <option key={st.id} value={st.id}>
                      #{st.number} - {st.name} {st.type ? `(${st.type})` : ''}
                    </option>
                  ))}
                </select>
                {stickerErrors.stickerId && (
                  <p className="mt-1.5 text-xs font-semibold text-red-400">
                    {stickerErrors.stickerId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Cantidad de copias
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value === '' ? '' : Number(e.target.value))
                    if (stickerErrors.quantity)
                      setStickerErrors((prev) => ({ ...prev, quantity: '' }))
                  }}
                  className={`mt-1.5 w-full rounded-xl border bg-binder-950 px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none ${
                    stickerErrors.quantity
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-binder-700 focus:border-amber-400'
                  }`}
                />
                {Number(quantity) > 1 && (
                  <p className="mt-1.5 text-[11px] font-bold text-amber-400">
                    ⚡ Se marcará con {Number(quantity) - 1} repetida(s) para intercambio
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
                  className="rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-6 py-2 text-xs font-black uppercase tracking-wider text-slate-950 hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? 'Pegando...' : 'Pegar en el Álbum'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Renombrar Colección */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-binder-700 bg-binder-900 p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-binder-800 pb-3">
              <div>
                <h3 className="font-display text-xl font-black text-white">Renombrar Colección</h3>
                <p className="text-xs text-slate-400">
                  El nombre que verá el resto de la comunidad
                </p>
              </div>
              <button
                onClick={() => setShowRenameModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {renameFormError && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs font-semibold text-red-300">
                {renameFormError}
              </div>
            )}

            <form noValidate onSubmit={handleRenameCollection} className="mt-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Nombre de la Colección
                </label>
                <input
                  type="text"
                  value={renameName}
                  onChange={(e) => {
                    setRenameName(e.target.value)
                    if (renameErrors.name) setRenameErrors((prev) => ({ ...prev, name: '' }))
                  }}
                  className={`mt-1.5 w-full rounded-xl border bg-binder-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none ${
                    renameErrors.name
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-binder-700 focus:border-amber-400'
                  }`}
                  placeholder="Ej. Mi Álbum del Mundial"
                />
                {renameErrors.name && (
                  <p className="mt-1.5 text-xs font-semibold text-red-400">{renameErrors.name}</p>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3 border-t border-binder-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRenameModal(false)}
                  className="rounded-xl border border-binder-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-binder-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-6 py-2 text-xs font-black uppercase tracking-wider text-slate-950 hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Guardar Nombre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
