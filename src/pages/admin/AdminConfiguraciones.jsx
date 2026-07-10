import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Users,
  Save,
  Wallet,
  DollarSign,
  Clock,
  Mail,
  Video,
  Link2,
  Unlink,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'
import { PACKAGES } from '../../lib/packages'

function Feedback({ error, success }) {
  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-start gap-2">
          <CheckCircle size={18} className="shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}
    </>
  )
}

function SettingsCard({ icon, title, description, children }) {
  const Icon = icon
  return (
    <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-primary shrink-0">
          <Icon size={22} />
        </div>
        <div>
          <h2 className="font-syne font-bold text-lg text-secondary">{title}</h2>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function SaveButton({ saving, label = 'Guardar' }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="bg-primary text-white px-6 py-3.5 rounded-xl font-bold shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
    >
      {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
      {label}
    </button>
  )
}

// Estado local editable que se resetea cuando cambia el valor guardado en el
// servidor (patrón "derived state" recomendado por React, sin efectos).
function useSyncedState(value) {
  const [state, setState] = useState(value)
  const [prev, setPrev] = useState(value)
  if (prev !== value) {
    setPrev(value)
    setState(value)
  }
  return [state, setState]
}

// Hook mínimo para tarjetas que guardan un subconjunto de settings.
function useSaveSettings(token, onSaved) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const save = async (body, successMessage) => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const data = await apiFetch('settings', { method: 'PUT', token, body })
      onSaved(data.settings)
      setSuccess(successMessage)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return { save, saving, error, success }
}

function PricesCard({ token, packagePrices, onSaved }) {
  const [prices, setPrices] = useSyncedState(packagePrices)
  const { save, saving, error, success } = useSaveSettings(token, onSaved)

  const handleSubmit = (e) => {
    e.preventDefault()
    const body = {}
    for (const [id, value] of Object.entries(prices)) body[id] = Number(value)
    save({ packagePrices: body }, 'Precios guardados. Se aplican de inmediato en la web y el portal.')
  }

  return (
    <SettingsCard
      icon={DollarSign}
      title="Precios de paquetes y clases"
      description="Precio en USD de cada servicio. Es el precio que se muestra en la web y el que cobra el sistema (PayPal, crédito de clase de prueba, etc.)."
    >
      <Feedback error={error} success={success} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          {PACKAGES.map((pkg) => (
            <div key={pkg.id}>
              <label className="block text-sm font-bold text-secondary mb-2">{pkg.title}</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  value={prices[pkg.id] ?? ''}
                  onChange={(e) => setPrices((prev) => ({ ...prev, [pkg.id]: e.target.value }))}
                  className="w-full p-3 pl-8 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary"
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400">
          El descuento por clase de prueba en el primer paquete usa el precio configurado de la clase de prueba.
        </p>
        <SaveButton saving={saving} label="Guardar precios" />
      </form>
    </SettingsCard>
  )
}

function BookingNoticeCard({ token, minBookingNoticeHours, trialMinBookingNoticeHours, onSaved }) {
  const [hours, setHours] = useSyncedState(minBookingNoticeHours)
  const [trialHours, setTrialHours] = useSyncedState(trialMinBookingNoticeHours)
  const { save, saving, error, success } = useSaveSettings(token, onSaved)

  const handleSubmit = (e) => {
    e.preventDefault()
    save(
      { minBookingNoticeHours: Number(hours), trialMinBookingNoticeHours: Number(trialHours) },
      'Anticipación mínima guardada.',
    )
  }

  return (
    <SettingsCard
      icon={Clock}
      title="Anticipación mínima de reserva"
      description="Horas mínimas antes del inicio de la clase para poder reservarla. Ejemplo: con 1 hora, una clase de las 15:00 se puede reservar hasta las 14:00."
    >
      <Feedback error={error} success={success} />
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-secondary mb-1">Clases regulares</label>
          <p className="text-xs text-gray-400 mb-2">
            Clases individuales, grupales y las clases de los paquetes reservadas desde el portal.
          </p>
          <input
            type="number"
            min={0}
            max={168}
            step="0.5"
            required
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-secondary mb-1">Clases de prueba</label>
          <p className="text-xs text-gray-400 mb-2">
            Anticipación exclusiva para la clase de prueba del landing.
          </p>
          <input
            type="number"
            min={0}
            max={168}
            step="0.5"
            required
            value={trialHours}
            onChange={(e) => setTrialHours(e.target.value)}
            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary"
          />
        </div>
        <SaveButton saving={saving} />
      </form>
    </SettingsCard>
  )
}

function AdminEmailCard({ token, adminNotifyEmail, onSaved }) {
  const [email, setEmail] = useSyncedState(adminNotifyEmail)
  const { save, saving, error, success } = useSaveSettings(token, onSaved)

  const handleSubmit = (e) => {
    e.preventDefault()
    save({ adminNotifyEmail: email.trim() }, 'Correo de administración guardado.')
  }

  return (
    <SettingsCard
      icon={Mail}
      title="Correo de administración"
      description="A este correo llegan todas las comunicaciones: nuevas reservas, avisos de pagos por Wise, etc."
    >
      <Feedback error={error} success={success} />
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-sm font-bold text-secondary mb-2">Correo</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@espanolconsentido.com"
            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary"
          />
        </div>
        <SaveButton saving={saving} />
      </form>
    </SettingsCard>
  )
}

function GoogleConnectCard({ token, googleConnected, googleAccountEmail, onSaved }) {
  const [working, setWorking] = useState(false)
  const [error, setError] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const googleStatus = searchParams.get('google')

  const clearStatus = () => {
    searchParams.delete('google')
    searchParams.delete('reason')
    setSearchParams(searchParams, { replace: true })
  }

  const handleConnect = async () => {
    setWorking(true)
    setError(null)
    try {
      const data = await apiFetch('google-oauth?action=url', { token })
      window.location.href = data.url
    } catch (err) {
      setError(err.message)
      setWorking(false)
    }
  }

  const handleDisconnect = async () => {
    setWorking(true)
    setError(null)
    try {
      await apiFetch('google-oauth?action=disconnect', { method: 'POST', token })
      const data = await apiFetch('settings', { token })
      onSaved(data.settings)
    } catch (err) {
      setError(err.message)
    } finally {
      setWorking(false)
    }
  }

  return (
    <SettingsCard
      icon={Video}
      title="Google Calendar y Meet"
      description="Conecta tu cuenta de Google para que cada reserva cree el evento en TU calendario con su link de Google Meet. La conexión se renueva sola y no caduca mientras no revoques el acceso."
    >
      <Feedback
        error={error}
        success={googleStatus === 'connected' ? 'Cuenta de Google conectada correctamente.' : null}
      />
      {googleStatus === 'error' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>
            {{
              state: 'La sesión de conexión expiró. Intenta de nuevo.',
              code: 'Google no devolvió el código de autorización. Intenta de nuevo.',
              no_refresh_token:
                'Google no entregó el token de renovación. Revoca el acceso de la app en myaccount.google.com/permissions y vuelve a conectar.',
              token_exchange:
                'Google rechazó el intercambio del código. Revisa que GOOGLE_OAUTH_CLIENT_ID y GOOGLE_OAUTH_CLIENT_SECRET sean correctos, y mira el detalle en Admin > Errores.',
            }[searchParams.get('reason')] || 'No se pudo conectar con Google. Intenta de nuevo.'}
          </span>
          <button onClick={clearStatus} className="ml-auto font-bold underline">
            Cerrar
          </button>
        </div>
      )}

      {googleConnected ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
          <div className="flex items-center gap-2 text-sm text-green-800">
            <CheckCircle size={18} className="shrink-0" />
            <span>
              Conectado{googleAccountEmail ? ` como ${googleAccountEmail}` : ''}. Las nuevas reservas incluirán link
              de Meet.
            </span>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={working}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-xl border-2 border-red-200 text-red-700 hover:bg-red-50 transition disabled:opacity-50"
          >
            {working ? <Loader2 size={14} className="animate-spin" /> : <Unlink size={14} />}
            Desconectar
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={working}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3.5 rounded-xl font-bold shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-50"
        >
          {working ? <Loader2 size={18} className="animate-spin" /> : <Link2 size={18} />}
          Conectar con Google
        </button>
      )}
    </SettingsCard>
  )
}

function GroupCapacityCard({ token, capacity, onSaved }) {
  const [groupClassCapacity, setGroupClassCapacity] = useSyncedState(capacity)
  const { save, saving, error, success } = useSaveSettings(token, onSaved)

  const handleSubmit = (e) => {
    e.preventDefault()
    save({ groupClassCapacity: Number(groupClassCapacity) }, 'Configuración guardada correctamente.')
  }

  return (
    <SettingsCard
      icon={Users}
      title="Clases grupales"
      description="Cantidad máxima de estudiantes que pueden reservar una misma franja grupal. Aplica a las nuevas franjas que abras desde el Calendario; las ya creadas conservan su capacidad original."
    >
      <Feedback error={error} success={success} />
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-sm font-bold text-secondary mb-2">Capacidad por clase grupal</label>
          <input
            type="number"
            min={2}
            step={1}
            required
            value={groupClassCapacity}
            onChange={(e) => setGroupClassCapacity(e.target.value)}
            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary"
          />
        </div>
        <SaveButton saving={saving} />
      </form>
    </SettingsCard>
  )
}

function WiseLinksCard({ token, wiseLinks, onSaved }) {
  const [links, setLinks] = useSyncedState(wiseLinks)
  const { save, saving, error, success } = useSaveSettings(token, onSaved)

  const handleSubmit = (e) => {
    e.preventDefault()
    save({ wiseLinks: links }, 'Enlaces de Wise guardados correctamente.')
  }

  return (
    <SettingsCard
      icon={Wallet}
      title="Enlaces de pago Wise"
      description="Wise no ofrece un checkout automático, así que se usa como enlace manual (igual que PayPal.me): pega aquí el enlace de pago de Wise para cada paquete. Déjalo vacío si no quieres ofrecer Wise para ese paquete."
    >
      <Feedback error={error} success={success} />
      <form onSubmit={handleSubmit} className="space-y-4">
        {PACKAGES.map((pkg) => (
          <div key={pkg.id}>
            <label className="block text-sm font-bold text-secondary mb-2">{pkg.title}</label>
            <input
              type="url"
              value={links[pkg.id] || ''}
              onChange={(e) => setLinks((prev) => ({ ...prev, [pkg.id]: e.target.value }))}
              placeholder="https://wise.com/pay/business/..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary text-sm"
            />
          </div>
        ))}
        <SaveButton saving={saving} label="Guardar enlaces" />
      </form>
    </SettingsCard>
  )
}

export default function AdminConfiguraciones() {
  const { token } = useAuth()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiFetch('settings', { token })
      .then((data) => setSettings(data.settings))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div>
      <h1 className="font-syne font-bold text-3xl text-secondary mb-1">Configuraciones</h1>
      <p className="text-gray-500 mb-8">Ajusta parámetros generales de la plataforma.</p>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading || !settings ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6 items-start max-w-5xl">
          <div className="space-y-6">
            <PricesCard token={token} packagePrices={settings.packagePrices || {}} onSaved={setSettings} />
            <BookingNoticeCard
              token={token}
              minBookingNoticeHours={settings.minBookingNoticeHours ?? 1}
              trialMinBookingNoticeHours={settings.trialMinBookingNoticeHours ?? 1}
              onSaved={setSettings}
            />
            <GroupCapacityCard token={token} capacity={settings.groupClassCapacity} onSaved={setSettings} />
          </div>
          <div className="space-y-6">
            <GoogleConnectCard
              token={token}
              googleConnected={settings.googleConnected}
              googleAccountEmail={settings.googleAccountEmail}
              onSaved={setSettings}
            />
            <AdminEmailCard token={token} adminNotifyEmail={settings.adminNotifyEmail || ''} onSaved={setSettings} />
            <WiseLinksCard token={token} wiseLinks={settings.wiseLinks || {}} onSaved={setSettings} />
          </div>
        </div>
      )}
    </div>
  )
}
