import React, { useEffect, useState } from 'react'
import { DollarSign, CalendarCheck, GraduationCap, Users, AlertCircle, Clock } from 'lucide-react'
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

function StatusPill({ label, count, className }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${className}`}>
      <span className="text-sm font-bold">{label}</span>
      <span className="font-grotesk font-semibold text-xl">{count}</span>
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatTile icon={DollarSign} label="Ingresos totales" value={currency(stats.revenue.total)} />
              <StatTile
                icon={CalendarCheck}
                label="Reservas confirmadas"
                value={stats.bookings.paid}
                accent="text-green-700 bg-green-50"
              />
              <StatTile
                icon={GraduationCap}
                label="Clases completadas"
                value={stats.bookings.completed}
                accent="text-blue-700 bg-blue-50"
              />
              <StatTile
                icon={Users}
                label={`Estudiantes activos (${stats.students.total} total)`}
                value={stats.students.active}
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6">
                <h2 className="font-syne font-bold text-lg text-secondary mb-4">Reservas por estado</h2>
                <div className="space-y-2">
                  <StatusPill label="Confirmadas" count={stats.bookings.paid} className="bg-green-50 text-green-700" />
                  <StatusPill label="Completadas" count={stats.bookings.completed} className="bg-blue-50 text-blue-700" />
                  <StatusPill label="Canceladas" count={stats.bookings.cancelled} className="bg-red-50 text-red-700" />
                </div>
                <div className="h-px bg-gray-100 my-4" />
                <h2 className="font-syne font-bold text-lg text-secondary mb-4">Cursos</h2>
                <div className="space-y-2">
                  <StatusPill label="Activos" count={stats.enrollments.active} className="bg-orange-50 text-primary" />
                  <StatusPill label="Finalizados" count={stats.enrollments.finished} className="bg-gray-100 text-gray-600" />
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
          </>
        )
      )}
    </div>
  )
}
