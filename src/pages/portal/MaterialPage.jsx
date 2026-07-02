import React, { useEffect, useState } from 'react'
import { FileText, ExternalLink, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'

export default function MaterialPage() {
  const { token } = useAuth()
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiFetch('materials', { token })
      .then((data) => setMaterials(data.materials || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div>
      <h1 className="font-syne font-bold text-3xl text-secondary mb-1">Material de clase</h1>
      <p className="text-gray-500 mb-8">Documentos, videos y enlaces compartidos por tu profesora.</p>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Cargando...</p>
      ) : materials.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-10 text-center">
          <p className="text-gray-500">Aún no hay material disponible para ti.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {materials.map((m) => (
            <a
              key={m._id}
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5 flex items-start gap-4 hover:shadow-soft-lg hover:-translate-y-1 transition-all"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-primary shrink-0">
                <FileText size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-secondary truncate">{m.title}</h3>
                  <ExternalLink size={14} className="text-gray-400 shrink-0" />
                </div>
                {m.description && <p className="text-sm text-gray-500 mt-1">{m.description}</p>}
                <span className="inline-block mt-2 text-xs font-bold px-2 py-0.5 rounded-full bg-orange-50 text-primary">
                  {m.category}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
