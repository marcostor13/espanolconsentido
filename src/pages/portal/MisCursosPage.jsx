import React, { useEffect, useState } from 'react'
import { GraduationCap, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'

export default function MisCursosPage() {
  const { token } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiFetch('enrollments', { token })
      .then((data) => setEnrollments(data.enrollments || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div>
      <h1 className="font-syne font-bold text-3xl text-secondary mb-1">Mis cursos</h1>
      <p className="text-gray-500 mb-8">Los paquetes de clases que has comprado.</p>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Cargando...</p>
      ) : enrollments.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-10 text-center">
          <p className="text-gray-500">Aún no tienes cursos comprados. Contacta a tu profesora para inscribirte.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {enrollments.map((e) => {
            const remaining = e.totalClasses - e.classesUsed
            const pct = Math.round((e.classesUsed / e.totalClasses) * 100)
            return (
              <div key={e._id} className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-primary">
                    <GraduationCap size={22} />
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      e.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {e.status === 'active' ? 'Activo' : 'Finalizado'}
                  </span>
                </div>
                <h3 className="font-syne font-bold text-xl text-secondary mb-1">{e.serviceTitle}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  ${e.finalPrice}
                  {e.appliedPromo && <span className="ml-1 text-green-600">({e.appliedPromo.code})</span>}
                  {e.trialCreditApplied && (
                    <span className="ml-1 text-green-600">(-${e.trialCreditAmount} clase de prueba)</span>
                  )}
                </p>

                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-sm font-bold text-secondary">
                  {remaining} de {e.totalClasses} clases disponibles
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
