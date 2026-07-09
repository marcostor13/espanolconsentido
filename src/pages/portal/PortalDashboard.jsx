import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarPlus, CalendarCheck, GraduationCap, FileText } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'

const shortcuts = [
  { to: '/portal/reservar', label: 'Reservar clase', desc: 'Elige una franja disponible', icon: CalendarPlus },
  { to: '/portal/clases', label: 'Mis clases', desc: 'Revisa tus próximas sesiones', icon: CalendarCheck },
  { to: '/portal/cursos', label: 'Mis cursos', desc: 'Consulta tus créditos y compra más', icon: GraduationCap },
  { to: '/portal/material', label: 'Material', desc: 'Documentos y videos de clase', icon: FileText },
]

export default function PortalDashboard() {
  const { user, token } = useAuth()
  const [enrollments, setEnrollments] = useState([])

  useEffect(() => {
    apiFetch('enrollments', { token })
      .then((data) => setEnrollments((data.enrollments || []).filter((e) => e.status === 'active')))
      .catch(() => {})
  }, [token])

  return (
    <div>
      <h1 className="font-syne font-bold text-3xl text-secondary mb-1">Hola, {user?.name?.split(' ')[0]} 👋</h1>
      <p className="text-gray-500 mb-8">Este es tu espacio para gestionar tus clases y material.</p>

      {enrollments.length > 0 && (
        <div className="mb-8">
          <h2 className="font-bold text-secondary mb-3">Tu progreso</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {enrollments.map((e) => {
              const pct = Math.min(100, Math.round(((e.classesUsed || 0) / (e.totalClasses || 1)) * 100))
              return (
                <Link
                  key={e._id}
                  to="/portal/cursos"
                  className="bg-white rounded-3xl shadow-soft border border-gray-100 p-5 hover:shadow-soft-lg transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-secondary">{e.serviceTitle}</h3>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-50 text-primary">
                      {e.classesUsed} de {e.totalClasses} clases usadas
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-1.5">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-gray-500">
                    Te quedan {Math.max(0, e.totalClasses - e.classesUsed)} clase(s) por reservar.
                  </p>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-6">
        {shortcuts.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 flex items-start gap-4 hover:shadow-soft-lg hover:-translate-y-1 transition-all"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-primary shrink-0">
              <s.icon size={22} />
            </div>
            <div>
              <h3 className="font-bold text-secondary">{s.label}</h3>
              <p className="text-sm text-gray-500">{s.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
