import { LayoutDashboard, CalendarPlus, CalendarCheck, GraduationCap, FileText } from 'lucide-react'
import DashboardLayout from './DashboardLayout'

const navItems = [
  { to: '/portal', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/portal/reservar', label: 'Reservar clase', icon: CalendarPlus },
  { to: '/portal/clases', label: 'Mis clases', icon: CalendarCheck },
  { to: '/portal/cursos', label: 'Mis cursos', icon: GraduationCap },
  { to: '/portal/material', label: 'Material', icon: FileText },
]

export default function PortalLayout() {
  return <DashboardLayout title="Mi cuenta" navItems={navItems} />
}
