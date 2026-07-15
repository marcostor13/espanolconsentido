import React, { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Menu, X, LogOut, KeyRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
    isActive ? 'bg-primary text-white shadow-soft' : 'text-gray-300 hover:bg-white/10 hover:text-white'
  }`

function Nav({ navItems, onNavigate }) {
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className={linkClass} onClick={onNavigate}>
          <item.icon size={18} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

function AccountFooter({ user, logout, onNavigate }) {
  return (
    <div className="mt-auto pt-6 border-t border-white/10">
      <p className="px-4 text-sm font-bold text-white truncate">{user?.name}</p>
      <p className="px-4 text-xs text-gray-400 truncate mb-3">{user?.email}</p>
      <Link
        to="/cambiar-clave"
        onClick={onNavigate}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all"
      >
        <KeyRound size={18} />
        Cambiar contraseña
      </Link>
      <button
        onClick={logout}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-gray-300 hover:bg-red-500/15 hover:text-red-400 transition-all"
      >
        <LogOut size={18} />
        Cerrar sesión
      </button>
    </div>
  )
}

export default function DashboardLayout({ title, navItems }) {
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const closeMenu = () => setIsMenuOpen(false)

  return (
    <div className="min-h-screen bg-light font-grotesk flex">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex md:flex-col w-72 shrink-0 bg-secondary border-r border-white/10 p-6">
        <Link to="/" className="flex flex-col items-center mb-8">
          <img src="/logo2_nobg2.png" alt="Español con Sentido" className="h-16 md:h-20 w-auto object-contain" />
          <span className="-mt-1 text-[9px] font-grotesk font-semibold tracking-[0.3em] text-white/50 uppercase">
            Comunica · Expresa · Siente
          </span>
        </Link>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 px-4">{title}</p>
        <Nav navItems={navItems} onNavigate={closeMenu} />
        <AccountFooter user={user} logout={logout} onNavigate={closeMenu} />
      </aside>

      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-secondary border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src="/logo2_nobg2.png" alt="Español con Sentido" className="h-11 w-auto object-contain" />
        </Link>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-white">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-secondary pt-20 px-6 pb-6 flex flex-col">
          <Nav navItems={navItems} onNavigate={closeMenu} />
          <AccountFooter user={user} logout={logout} onNavigate={closeMenu} />
        </div>
      )}

      {/* Content */}
      <main className="flex-1 min-w-0 p-6 md:p-10 pt-20 md:pt-10">
        <Outlet />
      </main>
    </div>
  )
}
