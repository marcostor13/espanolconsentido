import { LayoutDashboard, Calendar, ClipboardList, Users, FileText, Settings, Tag, AlertTriangle } from 'lucide-react'
import DashboardLayout from './DashboardLayout'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/calendario', label: 'Calendario', icon: Calendar },
  { to: '/admin/reservas', label: 'Reservas', icon: ClipboardList },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/material', label: 'Material', icon: FileText },
  { to: '/admin/promocodes', label: 'Descuentos', icon: Tag },
  { to: '/admin/configuraciones', label: 'Configuraciones', icon: Settings },
  { to: '/admin/errores', label: 'Errores', icon: AlertTriangle },
]

export default function AdminLayout() {
  return <DashboardLayout title="Panel administrador" navItems={navItems} />
}
