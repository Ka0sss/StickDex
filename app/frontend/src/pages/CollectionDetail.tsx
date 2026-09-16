import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api, getFieldErrors } from '../services/api'
import type { Album, Collection, DuplicatedSticker, Sticker } from '../types'

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [missingStickers, setMissingStickers] = useState<Sticker[]>([])
  const [duplicateStickers, setDuplicateStickers] = useState<DuplicatedSticker[]>([])
  const [albumStickers, setAlbumStickers] = useState<Sticker[]>([])

  const [activeTab, setActiveTab] = useState<'collected' | 'missing' | 'duplicates'>('collected')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add Sticker Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedStickerId, setSelectedStickerId] = useState<number | ''>('')
  const [quantity, setQuantity] = useState(1)
  const [stickerErrors, setStickerErrors] = useState<Record<string, string>>({})
  const [modalError, setModalError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Inline confirmations
  const [removingStickerId, setRemovingStickerId] = useState<number | null>(null)
  const [confirmDeleteCollection, setConfirmDeleteCollection] = useState(false)

  const { user } = useAuth()
  const navigate = useNavigate()

  const loadAll = async () => {
    try {
      setLoading(true)
      const col = await api<Collection>(`/collections/${id}`)
      setCollection(col)

      // Fetch reports
      const [missing, duplicates] = await Promise.all([
        api<Sticker[]>(`/collections/${id}/missing`).catch(() => []),
        api<DuplicatedSticker[]>(`/collections/${id}/duplicates`).catch(() => []),
      ])
      setMissingStickers(missing)
      setDuplicateStickers(duplicates)

      // If owner, also load full album stickers for adding
      if (col.albumId) {
        const fullAlbum = await api<Album & { stickers: Sticker[] }>(`/albums/${col.albumId}`)
        setAlbumStickers(fullAlbum.stickers || [])
        if (fullAlbum.stickers?.length > 0 && selectedStickerId === '') {
          setSelectedStickerId(fullAlbum.stickers[0].id)
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
    if (!selectedStickerId) return
    setSubmitting(true)
    setModalError(null)
    setStickerErrors({})

    const localErrors: Record<string, string> = {}
    if (!selectedStickerId) localErrors.stickerId = 'Debes seleccionar una lámina'
    if (!quantity || quantity < 1) localErrors.quantity = 'La cantidad debe ser al menos 1'

    if (Object.keys(localErrors).length > 0) {
      setStickerErrors(localErrors)
      setSubmitting(false)
      return
    }

    try {
      await api(`/collections/${id}/stickers`, {
        method: 'POST',
        body: JSON.stringify({
          stickerId: Number(selectedStickerId),
          quantity: Number(quantity),
          isDuplicated: Number(quantity) > 1,
        }),
      })
      setShowAddModal(false)
      setQuantity(1)
      setStickerErrors({})
      await loadAll()
    } catch (err: unknown) {
      const zErrors = getFieldErrors(err)
      if (Object.keys(zErrors).length > 0) {
        setStickerErrors(zErrors)
      } else {
        setModalError(err instanceof Error ? err.message : 'Error al añadir lámina')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateQuantity = async (stickerId: number, currentQty: number, delta: number) => {
    const newQty = currentQty + delta
    try {
      if (newQty <= 0) {
        await handleRemoveSticker(stickerId)
        return
      }
      await api(`/collections/${id}/stickers/${stickerId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: newQty }),
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
    try {
      const updated = await api<Collection>(`/collections/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPublic: !collection.isPublic }),
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

  if (loading) return <div className="py-12 text-center text-slate-500">Cargando colección...</div>
  if (error) return <div className="py-12 text-center text-red-500">{error}</div>
  if (!collection) return <div className="py-12 text-center text-slate-500">Colección no encontrada</div>

  const progress = collection.progress || { collectedCount: 0, totalStickers: 0, percentage: 0 }

  return (
    <div>
      <Link to="/collections" className="text-xs font-semibold text-indigo-600 hover:underline">
        ← Volver a Colecciones
      </Link>

      {/* Header */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center space-x-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  collection.isPublic
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {collection.isPublic ? 'Pública' : 'Privada'}
              </span>
              <span className="text-xs text-slate-500">
                Coleccionista: <b className="text-slate-800">{collection.user?.username}</b>
              </span>
            </div>

            <h1 className="mt-2 text-3xl font-black text-slate-900">{collection.name}</h1>
            <p className="mt-1 text-sm text-slate-600">
              Álbum:{' '}
              <Link
                to={`/albums/${collection.albumId}`}
                className="font-bold text-indigo-600 hover:underline"
              >
                {collection.album?.name}
              </Link>
            </p>
          </div>

          {/* Owner actions */}
          {isOwner && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setModalError(null)
                  setStickerErrors({})
                  setShowAddModal(true)
                }}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-500"
              >
                + Pegar Lámina
              </button>
              <button
                onClick={handleTogglePublic}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hacer {collection.isPublic ? 'Privada' : 'Pública'}
              </button>
              {!confirmDeleteCollection && (
                <button
                  onClick={() => setConfirmDeleteCollection(true)}
                  className="rounded-lg px-2 py-2 text-xs font-semibold text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Alerta de confirmación de eliminación de colección */}
        {confirmDeleteCollection && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-bold text-red-800">
              ¿Seguro que deseas eliminar la colección "{collection.name}"? Esta acción no se puede deshacer.
            </p>
            <div className="mt-3 flex space-x-3">
              <button
                onClick={handleDeleteCollection}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
              >
                Sí, eliminar colección
              </button>
              <button
                onClick={() => setConfirmDeleteCollection(false)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700">Progreso del Álbum</span>
            <span className="font-bold text-indigo-600">
              {progress.percentage}% ({progress.collectedCount} de {progress.totalStickers} láminas)
            </span>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('collected')}
          className={`border-b-2 px-5 py-3 text-sm font-bold transition ${
            activeTab === 'collected'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Láminas Pegadas ({collection.stickers?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('missing')}
          className={`border-b-2 px-5 py-3 text-sm font-bold transition ${
            activeTab === 'missing'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Faltantes ({missingStickers.length})
        </button>
        <button
          onClick={() => setActiveTab('duplicates')}
          className={`border-b-2 px-5 py-3 text-sm font-bold transition ${
            activeTab === 'duplicates'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Repetidas ({duplicateStickers.length})
        </button>
      </div>

      {/* Tab Content: Láminas Pegadas */}
      {activeTab === 'collected' && (
        <div className="mt-6">
          {!collection.stickers || collection.stickers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500">
              Aún no tienes láminas pegadas en esta colección.
              {isOwner && ' ¡Haz clic en "+ Pegar Lámina" para comenzar!'}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {collection.stickers.map((item) => (
                <div
                  key={item.id}
                  className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-slate-900 px-1.5 py-0.5 text-xs font-black text-white">
                        #{item.sticker.number}
                      </span>
                      {item.quantity > 1 && (
                        <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                          x{item.quantity}
                        </span>
                      )}
                    </div>

                    <div className="my-2 flex h-20 w-full items-center justify-center overflow-hidden rounded bg-slate-50">
                      {item.sticker.imageUrl ? (
                        <img
                          src={item.sticker.imageUrl}
                          alt={item.sticker.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-slate-300">
                          #{item.sticker.number}
                        </span>
                      )}
                    </div>

                    <p className="truncate text-center text-xs font-bold text-slate-800">
                      {item.sticker.name}
                    </p>
                  </div>

                  {/* Owner controls */}
                  {isOwner && (
                    <div className="mt-2 border-t border-slate-100 pt-2">
                      {removingStickerId === item.stickerId ? (
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-red-600">¿Quitar lámina?</p>
                          <div className="mt-1 flex justify-center space-x-1">
                            <button
                              onClick={() => handleRemoveSticker(item.stickerId)}
                              className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-red-700"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setRemovingStickerId(null)}
                              className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-200"
                            >
                              No
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleUpdateQuantity(item.stickerId, item.quantity, -1)}
                              className="h-5 w-5 rounded bg-slate-100 text-xs font-bold hover:bg-slate-200"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.stickerId, item.quantity, 1)}
                              className="h-5 w-5 rounded bg-slate-100 text-xs font-bold hover:bg-slate-200"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => setRemovingStickerId(item.stickerId)}
                            className="text-[10px] text-red-500 hover:underline"
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

      {/* Tab Content: Láminas Faltantes */}
      {activeTab === 'missing' && (
        <div className="mt-6">
          {missingStickers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50 py-12 text-center text-sm font-bold text-emerald-800">
              🎉 ¡Felicidades! ¡Colección completada! No te falta ninguna lámina.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {missingStickers.map((st) => (
                <div
                  key={st.id}
                  className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white p-3 text-center opacity-75"
                >
                  <span className="text-sm font-black text-slate-400">#{st.number}</span>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-700">{st.name}</p>
                  <span className="mt-1 text-[10px] text-slate-400">Faltante</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Láminas Repetidas */}
      {activeTab === 'duplicates' && (
        <div className="mt-6">
          {duplicateStickers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500">
              No tienes láminas repetidas para intercambiar.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {duplicateStickers.map((dup) => (
                <div
                  key={dup.stickerId}
                  className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 text-center shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-amber-600 px-1.5 py-0.5 text-xs font-black text-white">
                      #{dup.number}
                    </span>
                    <span className="text-xs font-extrabold text-amber-700">
                      x{dup.quantity - 1} repetidas
                    </span>
                  </div>
                  <p className="mt-2 truncate text-xs font-bold text-slate-800">{dup.name}</p>
                  <p className="text-[10px] text-slate-500">Total: {dup.quantity} copias</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Añadir Lámina */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Pegar Lámina en tu Colección</h3>

            {modalError && (
              <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-700">{modalError}</div>
            )}

            <form noValidate onSubmit={handleAddSticker} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600">
                  Seleccionar Lámina
                </label>
                <select
                  value={selectedStickerId}
                  onChange={(e) => {
                    setSelectedStickerId(Number(e.target.value))
                    if (stickerErrors.stickerId) setStickerErrors((prev) => ({ ...prev, stickerId: '' }))
                  }}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                    stickerErrors.stickerId
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  }`}
                >
                  {albumStickers.map((st) => (
                    <option key={st.id} value={st.id}>
                      #{st.number} - {st.name} {st.type ? `(${st.type})` : ''}
                    </option>
                  ))}
                </select>
                {stickerErrors.stickerId && (
                  <p className="mt-1 text-xs font-medium text-red-600">{stickerErrors.stickerId}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600">
                  Cantidad (copias obtenidas)
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(Number(e.target.value))
                    if (stickerErrors.quantity) setStickerErrors((prev) => ({ ...prev, quantity: '' }))
                  }}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                    stickerErrors.quantity
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  }`}
                />
                {stickerErrors.quantity && (
                  <p className="mt-1 text-xs font-medium text-red-600">{stickerErrors.quantity}</p>
                )}
                {quantity > 1 && (
                  <p className="mt-1 text-[11px] font-semibold text-amber-600">
                    Se marcará automáticamente como repetida ({quantity - 1} repetidas para intercambio)
                  </p>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Pegar Lámina'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
