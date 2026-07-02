import { Link } from 'react-router-dom'
import { CalendarPlus, CalendarCheck, GraduationCap, FileText } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const shortcuts = [
  { to: '/portal/reservar', label: 'Reservar clase', desc: 'Elige una franja disponible', icon: CalendarPlus },
  { to: '/portal/clases', label: 'Mis clases', desc: 'Revisa tus próximas sesiones', icon: CalendarCheck },
  { to: '/portal/cursos', label: 'Mis cursos', desc: 'Consulta tus créditos comprados', icon: GraduationCap },
  { to: '/portal/material', label: 'Material', desc: 'Documentos y videos de clase', icon: FileText },
]

export default function PortalDashboard() {
  const { user } = useAuth()

  return (
    <div>
      <h1 className="font-syne font-bold text-3xl text-secondary mb-1">Hola, {user?.name?.split(' ')[0]} 👋</h1>
      <p className="text-gray-500 mb-8">Este es tu espacio para gestionar tus clases y material.</p>

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
