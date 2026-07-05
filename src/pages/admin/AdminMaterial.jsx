import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, CheckCircle, Loader2, PlusCircle, Trash2, ExternalLink, Users, Globe, Upload, Link as LinkIcon, Search, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'
import { uploadFileToS3 } from '../../lib/s3Upload'

function StudentPicker({ students, selectedEmails, onChange }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return students
    return students.filter((s) => `${s.name} ${s.email}`.toLowerCase().includes(term))
  }, [students, search])

  const toggle = (email) => {
    if (selectedEmails.includes(email)) onChange(selectedEmails.filter((e) => e !== email))
    else onChange([...selectedEmails, email])
  }

  return (
    <div>
      {selectedEmails.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedEmails.map((email) => {
            const s = students.find((st) => st.email === email)
            return (
              <span
                key={email}
                className="flex items-center gap-1 text-xs font-bold pl-2.5 pr-1.5 py-1 rounded-full bg-orange-100 text-primary"
              >
                {s?.name || email}
                <button
                  type="button"
                  onClick={() => toggle(email)}
                  className="hover:bg-orange-200 rounded-full p-0.5"
                  aria-label={`Quitar ${s?.name || email}`}
                >
                  <X size={11} />
                </button>
              </span>
            )
          })}
        </div>
      )}
      <div className="relative mb-2">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar estudiante por nombre o email"
          className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-secondary outline-none focus:border-primary"
        />
      </div>
      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No se encontraron estudiantes.</p>
        ) : (
          filtered.map((s) => (
            <label key={s._id} className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition">
              <input
                type="checkbox"
                checked={selectedEmails.includes(s.email)}
                onChange={() => toggle(s.email)}
                className="h-4 w-4 shrink-0 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary/30"
              />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-secondary truncate">{s.name}</span>
                <span className="block text-xs text-gray-400 truncate">{s.email}</span>
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  )
}

function NewMaterialForm({ token, students, onCreated }) {
  const [source, setSource] = useState('file')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [category, setCategory] = useState('')
  const [visibility, setVisibility] = useState('all')
  const [selectedEmails, setSelectedEmails] = useState([])
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
    if (visibility === 'selected' && selectedEmails.length === 0) {
      setError('Selecciona al menos un estudiante')
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
        body: { title, description, url: materialUrl, category, visibility, allowedEmails: selectedEmails },
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
      setSelectedEmails([])
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
            <StudentPicker students={students} selectedEmails={selectedEmails} onChange={setSelectedEmails} />
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
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [filterStudentId, setFilterStudentId] = useState('')

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

  useEffect(() => {
    apiFetch('admin-users?role=student', { token })
      .then((data) => setStudents(data.users || []))
      .catch(() => {})
  }, [token])

  const studentsById = useMemo(() => Object.fromEntries(students.map((s) => [s._id, s])), [students])

  const filteredMaterials = useMemo(() => {
    if (!filterStudentId) return materials
    return materials.filter((m) => m.visibility === 'all' || m.allowedUserIds?.includes(filterStudentId))
  }, [materials, filterStudentId])

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

      <NewMaterialForm token={token} students={students} onCreated={loadMaterials} />

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h2 className="font-syne font-bold text-xl text-secondary">Material publicado</h2>
          <div>
            <label className="block text-xs font-bold text-secondary mb-1.5">Filtrar por alumno</label>
            <select
              value={filterStudentId}
              onChange={(e) => setFilterStudentId(e.target.value)}
              className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-secondary outline-none focus:border-primary min-w-[220px]"
            >
              <option value="">Todos los alumnos</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <p className="text-gray-400">Cargando...</p>
        ) : filteredMaterials.length === 0 ? (
          <p className="text-gray-400 text-center py-6">
            {filterStudentId ? 'Este alumno no tiene material asignado.' : 'Aún no has publicado material.'}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredMaterials.map((m) => (
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
                        <Users size={13} />
                        {m.allowedUserIds
                          .map((uid) => studentsById[uid]?.name)
                          .filter(Boolean)
                          .join(', ') || `${m.allowedUserIds.length} estudiante(s) seleccionado(s)`}
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
