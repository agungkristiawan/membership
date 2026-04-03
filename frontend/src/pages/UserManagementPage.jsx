import { useState, useEffect } from 'react'
import { getMembers, updateRole } from '../api/members'
import { forgotPassword } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../layouts/AppLayout'
import Avatar from '../components/Avatar'
import Pagination from '../components/Pagination'
import Toast from '../components/Toast'

const ROLES = ['member', 'editor', 'admin']

export default function UserManagementPage() {
  const { user: currentUser } = useAuth()
  const [members, setMembers] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total_pages: 1 })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [resetLink, setResetLink] = useState(null)

  const fetchMembers = async (params) => {
    setLoading(true)
    try {
      const { data } = await getMembers(params)
      setMembers(data.data)
      setPagination(data.pagination)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers({ page, search: search || undefined })
  }, [page])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchMembers({ page: 1, search: search || undefined })
  }

  const handleRoleChange = async (id, role) => {
    try {
      await updateRole(id, role)
      setMembers((prev) => prev.map((m) => m.id === id ? { ...m, role } : m))
      setToast({ message: 'Role updated successfully', type: 'success' })
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to update role', type: 'error' })
    }
  }

  const handleResetPassword = async (email) => {
    try {
      const { data } = await forgotPassword({ email })
      setResetLink(data.reset_url)
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to generate reset link', type: 'error' })
    }
  }

  return (
    <AppLayout>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {resetLink && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-base font-semibold text-gray-800 mb-2">Password Reset Link</h3>
            <p className="text-sm text-gray-500 mb-3">Share this link with the user. It expires in 1 hour.</p>
            <div className="flex gap-2">
              <input readOnly value={resetLink}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none" />
              <button
                onClick={() => { navigator.clipboard.writeText(resetLink); setToast({ message: 'Copied!', type: 'success' }) }}
                className="bg-gray-800 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gray-900 transition-colors">
                Copy
              </button>
            </div>
            <button onClick={() => setResetLink(null)}
              className="mt-4 text-sm text-gray-500 hover:underline">
              Close
            </button>
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold text-gray-800 mb-6">User Management</h2>

      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <input type="text" placeholder="Search by name or email..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button type="submit"
          className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-900 transition-colors">
          Search
        </button>
      </form>

      {loading ? (
        <p className="text-center text-gray-500 py-8">Loading...</p>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Member</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.map((m) => {
                  const isSelf = m.id === currentUser?.id
                  return (
                    <tr key={m.id} className={isSelf ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar src={m.photo_url} name={m.full_name} size="sm" />
                          <div>
                            <span className="font-medium text-gray-800">{m.full_name}</span>
                            {isSelf && <span className="ml-2 text-xs text-blue-500">(you)</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{m.email}</td>
                      <td className="px-4 py-3">
                        {isSelf ? (
                          <span className="capitalize text-gray-500">{m.role}</span>
                        ) : (
                          <select value={m.role || 'member'}
                            onChange={(e) => handleRoleChange(m.id, e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize">
                            {ROLES.map((r) => (
                              <option key={r} value={r} className="capitalize">{r}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!isSelf && (
                          <button onClick={() => handleResetPassword(m.email)}
                            className="text-sm text-blue-600 hover:underline">
                            Reset Password
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={pagination.total_pages} onPageChange={setPage} />
        </>
      )}
    </AppLayout>
  )
}
