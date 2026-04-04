import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getMember, updateMember, uploadPhoto } from '../api/members'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../layouts/AppLayout'
import Avatar from '../components/Avatar'
import TagInput from '../components/TagInput'
import Toast from '../components/Toast'

export default function EditMemberPage() {
  const params = useParams()
  const { user } = useAuth()
  const id = params.id || user?.id
  const navigate = useNavigate()
  const fileRef = useRef()

  const isAdmin = user?.role === 'admin'
  const isEditor = user?.role === 'editor'
  const canEditStatus = isAdmin || isEditor

  const [form, setForm] = useState({
    full_name: '', gender: '', birthdate: '', email: '',
    phone: '', address: '', status: '', hobbies: [], notes: '',
  })
  const [photoUrl, setPhotoUrl] = useState(null)
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getMember(id).then(({ data }) => {
      setForm({
        full_name: data.full_name || '', gender: data.gender || '',
        birthdate: data.birthdate || '', email: data.email || '',
        phone: data.phone || '', address: data.address || '',
        status: data.status || '', hobbies: data.hobbies || [], notes: data.notes || '',
      })
      setPhotoUrl(data.photo_url)
    })
  }, [id])

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setToast({ message: 'Only JPG and PNG formats are allowed', type: 'error' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setToast({ message: 'Photo must not exceed 2MB', type: 'error' })
      return
    }
    try {
      const { data } = await uploadPhoto(id, file)
      setPhotoUrl(data.photo_url)
      setToast({ message: 'Photo updated', type: 'success' })
    } catch {
      setToast({ message: 'Failed to upload photo', type: 'error' })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await updateMember(id, {
        full_name: form.full_name, gender: form.gender,
        ...(form.birthdate && { birthdate: form.birthdate }),
        phone: form.phone, address: form.address, hobbies: form.hobbies,
        notes: form.notes, ...(canEditStatus && { status: form.status }),
      })
      navigate(`/members/${id}`)
    } catch (err) {
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
      else setToast({ message: err.response?.data?.message || 'Failed to save', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="mb-4">
        <Link to={`/members/${id}`} className="text-sm text-blue-600 hover:underline">&larr; Back to Profile</Link>
      </div>

      <div className="bg-slate-100 rounded-lg shadow p-6 max-w-2xl border-t-4 border-indigo-500">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Edit Profile</h2>

        <div className="flex items-center gap-4 mb-6">
          <Avatar src={photoUrl} name={form.full_name} size="lg" />
          <button type="button" onClick={() => fileRef.current.click()}
            className="text-sm text-blue-600 hover:underline">
            Change Photo
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handlePhotoChange} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input type="text" required value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
              <select required value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birthdate</label>
              <input type="date" value={form.birthdate}
                onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input type="text" value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {canEditStatus && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hobbies</label>
            <TagInput value={form.hobbies} onChange={(hobbies) => setForm({ ...form, hobbies })} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} maxLength={500} rows={3}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-xs text-gray-400 text-right">{form.notes.length} / 500</p>
            {errors.notes && <p className="text-xs text-red-500">{errors.notes}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <Link to={`/members/${id}`}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-200 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
