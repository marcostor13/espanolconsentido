import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Search, GraduationCap, ChevronRight, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'

const PLAN_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'active', label: 'Con plan activo' },
  { id: 'none', label: 'Sin plan activo' },
]

const ACCOUNT_FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'active', label: 'Activas' },
  { id: 'inactive', label: 'Desactivadas' },
]

const SORT_OPTIONS = [
  { id: 'name-asc', label: 'Nombre (A-Z)' },
  { id: 'name-desc', label: 'Nombre (Z-A)' },
  { id: 'created-desc', label: 'Registro (recientes primero)' },
  { id: 'created-asc', label: 'Registro (antiguos primero)' },
  { id: 'remaining-desc', label: 'Clases restantes (más a menos)' },
  { id: 'remaining-asc', label: 'Clases restantes (menos a más)' },
]

function buildStudentSummary(user, enrollments) {
  const own = enrollments.filter((e) => e.userId === String(user._id))
  const active = own.filter((e) => e.status === 'active')
  const remaining = active.reduce((sum, e) => sum + Math.max(0, e.totalClasses - e.classesUsed), 0)
  const classesUsed = own.reduce((sum, e) => sum + (e.classesUsed || 0), 0)
  const totalClasses = own.reduce((sum, e) => sum + (e.totalClasses || 0), 0)
  const sorted = [...own].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const currentPlan = active[0] || sorted[0] || null

  return {
    ...user,
    enrollments: own,
    hasActivePlan: active.length > 0,
    remaining,
    classesUsed,
    totalClasses,
    currentPlan,
  }
}

export default function AdminAlumnos() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [students, setStudents] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [accountFilter, setAccountFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created-desc')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [usersData, enrollmentsData] = await Promise.all([
        apiFetch('admin-users?role=student', { token }),
        apiFetch('enrollments', { token }),
      ])
      setStudents(usersData.users || [])
      setEnrollments(enrollmentsData.enrollments || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadData()
  }, [loadData])

  const summaries = useMemo(
    () => students.map((s) => buildStudentSummary(s, enrollments)),
    [students, enrollments],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    let list = summaries.filter((s) => {
      if (term && !`${s.name} ${s.email}`.toLowerCase().includes(term)) return false
      if (planFilter === 'active' && !s.hasActivePlan) return false
      if (planFilter === 'none' && s.hasActivePlan) return false
      if (accountFilter === 'active' && !s.active) return false
      if (accountFilter === 'inactive' && s.active) return false
      return true
    })

    const [field, dir] = sortBy.split('-')
    const mult = dir === 'asc' ? 1 : -1
    list = [...list].sort((a, b) => {
      if (field === 'name') return mult * a.name.localeCompare(b.name)
      if (field === 'remaining') return mult * (a.remaining - b.remaining)
      return mult * (new Date(a.createdAt) - new Date(b.createdAt))
    })
    return list
  }, [summaries, search, planFilter, accountFilter, sortBy])

  const hasFilters = search || planFilter !== 'all' || accountFilter !== 'all'

  return (
    <div>
      <h1 className="font-syne font-bold text-3xl text-secondary mb-1">Alumnos</h1>
      <p className="text-gray-500 mb-8">Consulta y gestiona a todos los estudiantes registrados.</p>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="p-6 pb-4 flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <label className="block text-xs font-bold text-secondary mb-1.5">Buscar</label>
            <Search size={16} className="absolute left-3 top-[calc(50%+7px)] -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nombre o email"
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-secondary outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary mb-1.5">Plan</label>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-secondary outline-none focus:border-primary"
            >
              {PLAN_FILTERS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary mb-1.5">Cuenta</label>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-secondary outline-none focus:border-primary"
            >
              {ACCOUNT_FILTERS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary mb-1.5">Ordenar por</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-secondary outline-none focus:border-primary"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {hasFilters && (
            <button
              onClick={() => {
                setSearch('')
                setPlanFilter('all')
                setAccountFilter('all')
              }}
              className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-primary transition px-2 py-2.5"
            >
              <X size={13} /> Limpiar filtros
            </button>
          )}
        </div>

        <div className="p-6 pt-0">
          {loading ? (
            <p className="text-gray-400">Cargando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-gray-400 text-center py-6">
              {hasFilters ? 'Ningún alumno coincide con los filtros.' : 'Aún no hay estudiantes registrados.'}
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((s) => (
                <button
                  key={s._id}
                  onClick={() => navigate(`/admin/alumnos/${s._id}`)}
                  className="w-full flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/60 hover:border-primary/40 hover:bg-orange-50/40 transition text-left"
                >
                  <div className="min-w-[180px]">
                    <p className="font-bold text-secondary flex items-center gap-2">
                      {s.name}
                      {!s.active && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">
                          Desactivada
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">{s.email}</p>
                  </div>

                  <div className="text-sm">
                    {s.currentPlan ? (
                      <>
                        <p className="font-bold text-secondary">{s.currentPlan.serviceTitle}</p>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            s.hasActivePlan ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {s.hasActivePlan ? 'Activo' : 'Finalizado'}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                        Sin plan
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-gray-600 text-center">
                    <p className="font-bold text-secondary">
                      {s.classesUsed}/{s.totalClasses}
                    </p>
                    <p className="text-xs text-gray-400">clases usadas</p>
                  </div>

                  <div className="text-sm text-center">
                    <p className={`font-bold ${s.remaining > 0 ? 'text-primary' : 'text-gray-400'}`}>{s.remaining}</p>
                    <p className="text-xs text-gray-400">restantes</p>
                  </div>

                  <div className="text-sm text-gray-500">
                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </div>

                  <span className="flex items-center gap-1 text-xs font-bold text-primary shrink-0">
                    <GraduationCap size={14} /> Ver detalle <ChevronRight size={14} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
