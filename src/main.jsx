import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import PoliciesPage from './pages/PoliciesPage.jsx'
import ReferralPage from './pages/ReferralPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import ChangePasswordPage from './pages/ChangePasswordPage.jsx'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import PortalLayout from './layouts/PortalLayout.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'
import PortalDashboard from './pages/portal/PortalDashboard.jsx'
import ReservarPage from './pages/portal/ReservarPage.jsx'
import MisClasesPage from './pages/portal/MisClasesPage.jsx'
import MisCursosPage from './pages/portal/MisCursosPage.jsx'
import MaterialPage from './pages/portal/MaterialPage.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminCalendario from './pages/admin/AdminCalendario.jsx'
import AdminReservas from './pages/admin/AdminReservas.jsx'
import AdminUsuarios from './pages/admin/AdminUsuarios.jsx'
import AdminMaterial from './pages/admin/AdminMaterial.jsx'
import AdminConfiguraciones from './pages/admin/AdminConfiguraciones.jsx'
import AdminPromocodes from './pages/admin/AdminPromocodes.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/politicas" element={<PoliciesPage />} />
            <Route path="/programa-recomendacion" element={<ReferralPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/olvide-clave" element={<ForgotPasswordPage />} />
            <Route
              path="/cambiar-clave"
              element={
                <ProtectedRoute allowPasswordChange>
                  <ChangePasswordPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/portal"
              element={
                <ProtectedRoute roles={['student']}>
                  <PortalLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<PortalDashboard />} />
              <Route path="reservar" element={<ReservarPage />} />
              <Route path="clases" element={<MisClasesPage />} />
              <Route path="cursos" element={<MisCursosPage />} />
              <Route path="material" element={<MaterialPage />} />
            </Route>

            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="calendario" element={<AdminCalendario />} />
              <Route path="reservas" element={<AdminReservas />} />
              <Route path="usuarios" element={<AdminUsuarios />} />
              <Route path="material" element={<AdminMaterial />} />
              <Route path="promocodes" element={<AdminPromocodes />} />
              <Route path="configuraciones" element={<AdminConfiguraciones />} />
            </Route>
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
