import React, { useEffect, useState } from 'react'
import { DollarSign, CalendarCheck, GraduationCap, Users, AlertCircle, Clock, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'

function StatTile({ icon, label, value, accent = 'text-primary bg-orange-100' }) {
  const Icon = icon
  return (
    <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${accent}`}>
        <Icon size={22} />
      </div>
      <p className="font-grotesk font-semibold text-4xl text-secondary leading-none mb-2">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}

// Sección expandible de "Reservas por estado": el encabezado muestra el
// contador y, al expandirla, se listan las clases con el nombre del alumno.
function StatusSection({ label, count, bookings, className, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`rounded-xl overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <span className="text-sm font-bold">{label}</span>
        <span className="flex items-center gap-2 font-grotesk font-semibold text-xl">
          {count}
          {(bookings?.length || 0) > 0 && (open ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
        </span>
      </button>
      {open && (bookings?.length || 0) > 0 && (
        <div className="px-4 pb-3 space-y-1.5">
          {bookings.map((b) => (
            <div key={b.bookingId} className="flex items-center justify-between text-xs bg-white/60 rounded-lg px-3 py-2">
              <div className="min-w-0">
                <p className="font-bold truncate">{b.studentName}</p>
                <p className="opacity-70 truncate">{b.serviceTitle}</p>
              </div>
              {b.date && (
                <p className="shrink-0 opacity-70 ml-3">
                  {b.date} · {b.time}
                </p>
              )}
            </div>
          ))}
          {bookings.length >= 30 && <p className="text-[11px] opacity-60 px-1">Mostrando las 30 más recientes.</p>}
        </div>
      )}
    </div>
  )
}

const currency = (n) => `$${Number(n || 0).toLocaleString('es', { maximumFractionDigits: 2 })}`

export default function AdminDashboard() {
  const { user, token } = useAuth()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('admin-stats', { token })
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  const byStatus = stats?.bookingsByStatus || {}
  const activeStudentsList = stats?.activeStudentsList || []

  return (
    <div>
      <h1 className="font-syne font-bold text-3xl text-secondary mb-1">Hola, {user?.name?.split(' ')[0]} 👋</h1>
      <p className="text-gray-500 mb-8">Resumen general de la plataforma.</p>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Cargando estadísticas...</p>
      ) : (
        stats && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
              <StatTile icon={DollarSign} label="Ingresos totales" value={currency(stats.revenue.total)} />
              <StatTile
                icon={CalendarCheck}
                label="Reservas confirmadas"
                value={stats.bookings.paid}
                accent="text-green-700 bg-green-50"
              />
              <StatTile
                icon={GraduationCap}
                label="Clases impartidas"
                value={stats.bookings.completed}
                accent="text-blue-700 bg-blue-50"
              />
              <StatTile
                icon={Users}
                label={`Estudiantes activos (${stats.students.total} total)`}
                value={stats.students.active}
              />
              <StatTile
                icon={RefreshCw}
                label="Clases reprogramadas"
                value={stats.bookings.rescheduled}
                accent="text-amber-700 bg-amber-50"
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6">
                  <h2 className="font-syne font-bold text-lg text-secondary mb-1">Clases por estado</h2>
                  <p className="text-xs text-gray-400 mb-4">Toca un estado para ver los alumnos de cada clase.</p>
                  <div className="space-y-2">
                    <StatusSection
                      label="Confirmadas (próximas)"
                      count={stats.bookings.paid}
                      bookings={byStatus.paid}
                      className="bg-green-50 text-green-700"
                      defaultOpen
                    />
                    <StatusSection
                      label="Impartidas"
                      count={stats.bookings.completed}
                      bookings={byStatus.completed}
                      className="bg-blue-50 text-blue-700"
                    />
                    <StatusSection
                      label="Reprogramadas"
                      count={stats.bookings.rescheduled}
                      bookings={byStatus.rescheduled}
                      className="bg-amber-50 text-amber-700"
                    />
                    <StatusSection
                      label="Canceladas"
                      count={stats.bookings.cancelled}
                      bookings={byStatus.cancelled}
                      className="bg-red-50 text-red-700"
                    />
                  </div>
                  <div className="h-px bg-gray-100 my-4" />
                  <h2 className="font-syne font-bold text-lg text-secondary mb-4">Cursos</h2>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-orange-50 text-primary">
                      <span className="text-sm font-bold">Activos</span>
                      <span className="font-grotesk font-semibold text-xl">{stats.enrollments.active}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-100 text-gray-600">
                      <span className="text-sm font-bold">Finalizados</span>
                      <span className="font-grotesk font-semibold text-xl">{stats.enrollments.finished}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6">
                  <h2 className="font-syne font-bold text-lg text-secondary mb-4">Actividad reciente</h2>
                  {stats.recentBookings.length === 0 ? (
                    <p className="text-sm text-gray-400">Aún no hay reservas.</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.recentBookings.map((b) => (
                        <div key={b.bookingId} className="flex items-center justify-between text-sm">
                          <div>
                            <p className="font-bold text-secondary">{b.userName || b.name}</p>
                            <p className="text-gray-500">{b.serviceTitle}</p>
                          </div>
                          <p className="flex items-center gap-1.5 text-gray-400">
                            {b.date} <Clock size={13} /> {b.time}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 self-start">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-syne font-bold text-lg text-secondary">Estudiantes activos</h2>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-50 text-primary">
                    {activeStudentsList.length}
                  </span>
                </div>
                {activeStudentsList.length === 0 ? (
                  <p className="text-sm text-gray-400">Aún no hay estudiantes activos.</p>
                ) : (
                  <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                    {activeStudentsList.map((s) => (
                      <Link
                        key={s.id}
                        to={`/admin/alumnos/${s.id}`}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/60 hover:border-primary/40 transition"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-secondary text-sm truncate">{s.name}</p>
                          <p className="text-xs text-gray-500 truncate">{s.email}</p>
                        </div>
                        <span
                          className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                            s.remainingClasses > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {s.remainingClasses} clase(s)
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )
      )}
    </div>
  )
}
