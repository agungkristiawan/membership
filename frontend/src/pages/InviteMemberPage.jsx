import { useState } from 'react'
import { Link } from 'react-router-dom'
import { generateInvitation } from '../api/invitations'
import AppLayout from '../layouts/AppLayout'

export default function InviteMemberPage() {
  const [form, setForm] = useState({ full_name: '', email: '' })
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setLoading(true)
    try {
      const { data } = await generateInvitation(form)
      setResult(data)
    } catch (err) {
      if (err.response?.data?.errors) setFieldErrors(err.response.data.errors)
      else setError(err.response?.data?.message || 'Failed to generate invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result.invitation_link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AppLayout>
      <div className="mb-4">
        <Link to="/members" className="text-sm text-blue-600 hover:underline">&larr; Back to Members</Link>
      </div>

      <div className="bg-slate-100 rounded-lg shadow p-6 max-w-lg border-t-4 border-indigo-500">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Invite New Member</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input type="text" required value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {loading ? 'Generating...' : 'Generate Invitation Link'}
          </button>
        </form>

        {result && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-700 font-medium mb-1">Invitation link generated!</p>
            <p className="text-xs text-gray-500 mb-3">
              Expires: {new Date(result.expires_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <div className="flex items-center gap-2">
              <input readOnly value={result.invitation_link}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-xs bg-white text-gray-700 focus:outline-none" />
              <button onClick={handleCopy}
                className="bg-gray-800 text-white px-3 py-2 rounded text-xs font-medium hover:bg-gray-900 transition-colors whitespace-nowrap">
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
