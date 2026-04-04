import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { validateInvitation, registerViaInvitation } from '../api/invitations'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../layouts/AuthLayout'
import TagInput from '../components/TagInput'

const MIN_AGE = parseInt(import.meta.env.VITE_MEMBER_MIN_AGE ?? '17', 10)
const maxBirthdateStr = (() => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - MIN_AGE)
  return d.toISOString().split('T')[0]
})()

export default function RegisterPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { login } = useAuth()

  const [tokenValid, setTokenValid] = useState(null)
  const [tokenError, setTokenError] = useState('')
  const [form, setForm] = useState({
    full_name: '', username: '', password: '', confirm_password: '',
    gender: '', birthdate: '', phone: '', address: '', hobbies: [], notes: '',
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    validateInvitation(token)
      .then(({ data }) => {
        setTokenValid(true)
        setForm((f) => ({ ...f, full_name: data.full_name }))
      })
      .catch((err) => {
        setTokenValid(false)
        setTokenError(err.response?.data?.message || 'This invitation link is no longer valid')
      })
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    if (form.password !== form.confirm_password) {
      setFieldErrors({ confirm_password: 'Passwords do not match' })
      return
    }
    if (form.birthdate) {
      const birthDate = new Date(form.birthdate)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const m = today.getMonth() - birthDate.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
      if (age < MIN_AGE) {
        setFieldErrors({ birthdate: `You must be at least ${MIN_AGE} years old` })
        return
      }
    }
    setLoading(true)
    try {
      const { data } = await registerViaInvitation(token, {
        full_name: form.full_name, username: form.username, password: form.password,
        gender: form.gender, birthdate: form.birthdate, phone: form.phone,
        address: form.address, hobbies: form.hobbies, notes: form.notes,
      })
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/members')
    } catch (err) {
      if (err.response?.data?.errors) setFieldErrors(err.response.data.errors)
      else setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (tokenValid === null) {
    return <AuthLayout><p className="text-center text-gray-500">Validating invitation...</p></AuthLayout>
  }

  if (tokenValid === false) {
    return (
      <AuthLayout>
        <div className="text-center py-4">
          <p className="text-red-500 font-medium">{tokenError}</p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Complete Your Registration</h2>
      <p className="text-sm text-gray-500 mb-6">Welcome! Fill in your details to join.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Personal Info</p>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Birthdate *</label>
            <input type="date" required max={maxBirthdateStr} value={form.birthdate}
              onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {fieldErrors.birthdate && <p className="text-xs text-red-500 mt-1">{fieldErrors.birthdate}</p>}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hobbies</label>
          <TagInput value={form.hobbies} onChange={(hobbies) => setForm({ ...form, hobbies })} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={form.notes} maxLength={500}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <p className="text-xs text-gray-400 text-right">{form.notes.length} / 500</p>
        </div>

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">Account</p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
          <input type="text" required value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {fieldErrors.username && <p className="text-xs text-red-500 mt-1">{fieldErrors.username}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input type="password" required value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
            <input type="password" required value={form.confirm_password}
              onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {fieldErrors.confirm_password && <p className="text-xs text-red-500 mt-1">{fieldErrors.confirm_password}</p>}
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? 'Creating account...' : 'Complete Registration'}
        </button>
      </form>
    </AuthLayout>
  )
}
