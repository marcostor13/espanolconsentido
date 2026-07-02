import React, { useCallback, useEffect, useState } from 'react'
import { AlertCircle, AlertTriangle, ChevronDown, ChevronLeft, ChevronRight, Search, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'

const PAGE_SIZE = 25

const LEVEL_STYLE = {
  error: { label: 'Error', className: 'bg-red-50 text-red-700', icon: AlertCircle },
  warning: { label: 'Advertencia', className: 'bg-amber-50 text-amber-700', icon: AlertTriangle },
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString()
}

function ErrorRow({ err, token, onDeleted }) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const level = LEVEL_STYLE[err.level] || LEVEL_STYLE.error
  const LevelIcon = level.icon

  const handleDelete = async (e) => {
    e.stopPropagation()
    setDeleting(true)
    try {
      await apiFetch(`admin-errors?id=${err._id}`, { method: 'DELETE', token })
      onDeleted()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex flex-wrap items-center justify-between gap-3 p-4 text-left"
      >
        <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${level.className}`}>
          <LevelIcon size={12} />
          {level.label}
        </span>
        <span className="text-xs font-bold text-gray-500 shrink-0">{err.source}</span>
        <span className="flex-1 min-w-[200px] text-sm text-secondary truncate">{err.message}</span>
        <span className="text-xs text-gray-400 shrink-0">{formatDate(err.createdAt)}</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition shrink-0 disabled:opacity-50"
          aria-label="Eliminar"
        >
          <Trash2 size={14} />
        </button>
        <ChevronDown size={16} className={`text-gray-400 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="px-4 pb-4">
          {(err.method || err.path) && (
            <p className="text-xs text-gray-500 mb-2">
              {err.method} {err.path}
            </p>
          )}
          <pre className="text-xs bg-secondary text-gray-100 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words">
            {err.stack || err.message}
          </pre>
        </div>
      )}
    </div>
  )
}

export default function AdminErrores() {
  const { token } = useAuth()
  const [errors, setErrors] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [clearing, setClearing] = useState(false)

  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const loadErrors = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (levelFilter) params.set('level', levelFilter)
      if (search.trim()) params.set('search', search.trim())

      const data = await apiFetch(`admin-errors?${params.toString()}`, { token })
      setErrors(data.errors || [])
      setTotal(data.total || 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token, page, levelFilter, search])

  useEffect(() => {
    setPage(1)
  }, [search, levelFilter])

  useEffect(() => {
    const timeout = setTimeout(loadErrors, 300)
    return () => clearTimeout(timeout)
  }, [loadErrors])

  const handleClearAll = async () => {
    if (!window.confirm('¿Eliminar todos los errores registrados? Esta acción no se puede deshacer.')) return
    setClearing(true)
    try {
      await apiFetch('admin-errors?all=true', { method: 'DELETE', token })
      setPage(1)
      await loadErrors()
    } catch (err) {
      setError(err.message)
    } finally {
      setClearing(false)
    }
  }

  return (
    <div>
      <h1 className="font-syne font-bold text-3xl text-secondary mb-1">Errores</h1>
      <p className="text-gray-500 mb-8">Errores registrados automáticamente por la plataforma.</p>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="p-6 pb-0 flex items-center justify-between gap-4 flex-wrap">
          <h2 className="font-syne font-bold text-xl text-secondary">Registro de errores</h2>
          {total > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearing}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
            >
              <Trash2 size={14} />
              Limpiar todo
            </button>
          )}
        </div>

        <div className="p-6 pb-0 flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-secondary mb-1.5">Buscar</label>
            <Search size={16} className="absolute left-3 top-[calc(50%+8px)] -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Mensaje o función"
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-secondary outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary mb-1.5">Nivel</label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-secondary outline-none focus:border-primary"
            >
              <option value="">Todos</option>
              <option value="error">Error</option>
              <option value="warning">Advertencia</option>
            </select>
          </div>
          {(search || levelFilter) && (
            <button
              onClick={() => {
                setSearch('')
                setLevelFilter('')
              }}
              className="text-xs font-bold text-gray-400 hover:text-primary transition px-2 py-2.5"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="p-6">
          {loading ? (
            <p className="text-gray-400">Cargando...</p>
          ) : errors.length === 0 ? (
            <p className="text-gray-400 text-center py-6">
              {search || levelFilter ? 'Ningún error coincide con los filtros.' : 'No hay errores registrados. 🎉'}
            </p>
          ) : (
            <div className="space-y-2">
              {errors.map((err) => (
                <ErrorRow key={err._id} err={err} token={token} onDeleted={loadErrors} />
              ))}
            </div>
          )}

          {!loading && total > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-400">
                Página {page} de {totalPages} · {total} error(es)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:border-primary hover:text-primary transition disabled:opacity-30 disabled:pointer-events-none"
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:border-primary hover:text-primary transition disabled:opacity-30 disabled:pointer-events-none"
                  aria-label="Página siguiente"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
