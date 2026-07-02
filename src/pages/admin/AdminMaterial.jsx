import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle, Loader2, PlusCircle, Trash2, ExternalLink, Users, Globe, Upload, Link as LinkIcon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'
import { uploadFileToS3 } from '../../lib/s3Upload'

function NewMaterialForm({ token, onCreated }) {
  const [source, setSource] = useState('file')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [category, setCategory] = useState('')
  const [visibility, setVisibility] = useState('all')
  const [allowedEmails, setAllowedEmails] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const fileInputRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (source === 'file' && !file) {
      setError('Selecciona un archivo para subir')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      let materialUrl = url

      if (source === 'file') {
        setUploadProgress(0)
        const { uploadUrl, publicUrl } = await apiFetch('materials-upload-url', {
          method: 'POST',
          token,
          body: { fileName: file.name, contentType: file.type },
        })
        await uploadFileToS3(uploadUrl, file, file.type, setUploadProgress)
        materialUrl = publicUrl
      }

      await apiFetch('materials', {
        method: 'POST',
        token,
        body: { title, description, url: materialUrl, category, visibility, allowedEmails },
      })
      setSuccess('Material publicado correctamente.')
      setTitle('')
      setDescription('')
      setUrl('')
      setFile(null)
      setUploadProgress(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setCategory('')
      setVisibility('all')
      setAllowedEmails('')
      onCreated()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
      setUploadProgress(null)
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 mb-8">
      <h2 className="font-syne font-bold text-xl text-secondary mb-1">Subir material</h2>
      <p className="text-sm text-gray-500 mb-5">Sube un archivo (PDF, video, audio, imagen) o comparte un enlace externo.</p>

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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setSource('file')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm border-2 transition ${
              source === 'file' ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-secondary'
            }`}
          >
            <Upload size={16} /> Subir archivo
          </button>
          <button
            type="button"
            onClick={() => setSource('link')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm border-2 transition ${
              source === 'link' ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-secondary'
            }`}
          >
            <LinkIcon size={16} /> Enlace externo
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-secondary mb-2">Título</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-secondary mb-2">Categoría</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Gramática, Vocabulario..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary"
            />
          </div>
        </div>

        {source === 'file' ? (
          <div>
            <label className="block text-sm font-bold text-secondary mb-2">Archivo (PDF, video, audio o imagen)</label>
            <input
              ref={fileInputRef}
              type="file"
              required
              accept=".pdf,image/*,video/*,audio/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-orange-100 file:text-primary file:font-bold"
            />
            {uploadProgress !== null && (
              <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-bold text-secondary mb-2">Enlace (Drive, YouTube, PDF...)</label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-secondary mb-2">
            Descripción <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-secondary mb-2">Visibilidad</label>
          <div className="flex gap-3 mb-3">
            <button
              type="button"
              onClick={() => setVisibility('all')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition ${
                visibility === 'all' ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-secondary'
              }`}
            >
              Todos los estudiantes
            </button>
            <button
              type="button"
              onClick={() => setVisibility('selected')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition ${
                visibility === 'selected' ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-secondary'
              }`}
            >
              Solo estudiantes seleccionados
            </button>
          </div>
          {visibility === 'selected' && (
            <input
              type="text"
              value={allowedEmails}
              onChange={(e) => setAllowedEmails(e.target.value)}
              placeholder="email1@ejemplo.com, email2@ejemplo.com"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-secondary"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
          {saving && uploadProgress !== null ? `Subiendo... ${uploadProgress}%` : 'Publicar material'}
        </button>
      </form>
    </div>
  )
}

export default function AdminMaterial() {
  const { token } = useAuth()
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const loadMaterials = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch('materials', { token })
      setMaterials(data.materials || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadMaterials()
  }, [loadMaterials])

  const handleDelete = async (id) => {
    setDeletingId(id)
    setError(null)
    try {
      await apiFetch(`materials?id=${id}`, { method: 'DELETE', token })
      await loadMaterials()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <h1 className="font-syne font-bold text-3xl text-secondary mb-1">Material de clase</h1>
      <p className="text-gray-500 mb-8">Publica documentos, videos y enlaces para tus estudiantes.</p>

      <NewMaterialForm token={token} onCreated={loadMaterials} />

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6">
        <h2 className="font-syne font-bold text-xl text-secondary mb-5">Material publicado</h2>
        {loading ? (
          <p className="text-gray-400">Cargando...</p>
        ) : materials.length === 0 ? (
          <p className="text-gray-400 text-center py-6">Aún no has publicado material.</p>
        ) : (
          <div className="space-y-2">
            {materials.map((m) => (
              <div key={m._id} className="flex items-center justify-between gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/60">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-secondary truncate">{m.title}</h3>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-primary shrink-0">
                      {m.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                    {m.visibility === 'all' ? (
                      <>
                        <Globe size={13} /> Todos los estudiantes
                      </>
                    ) : (
                      <>
                        <Users size={13} /> {m.allowedUserIds.length} estudiante(s) seleccionado(s)
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-primary transition p-2"
                    aria-label="Abrir material"
                  >
                    <ExternalLink size={16} />
                  </a>
                  <button
                    onClick={() => handleDelete(m._id)}
                    disabled={deletingId === m._id}
                    className="text-gray-400 hover:text-red-600 transition p-2"
                    aria-label="Eliminar material"
                  >
                    {deletingId === m._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
