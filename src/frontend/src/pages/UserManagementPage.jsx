import { useState, useEffect } from 'react'
import { getMembers, updateRole } from '../api/members'
import { forgotPassword } from '../api/auth'
import AppLayout from '../layouts/AppLayout'
import Avatar from '../components/Avatar'
import Pagination from '../components/Pagination'
import Toast from '../components/Toast'

const ROLES = ['member', 'editor', 'admin']

export default function UserManagementPage() {
  const [members, setMembers] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total_pages: 1 })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

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
      await forgotPassword({ email })
      setToast({ message: 'Password reset link sent', type: 'success' })
    } catch {
      setToast({ message: 'Failed to send reset link', type: 'error' })
    }
  }

  return (
    <AppLayout>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
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
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={m.photo_url} name={m.full_name} size="sm" />
                        <span className="font-medium text-gray-800">{m.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{m.email}</td>
                    <td className="px-4 py-3">
                      <select value={m.role || 'member'}
                        onChange={(e) => handleRoleChange(m.id, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize">
                        {ROLES.map((r) => (
                          <option key={r} value={r} className="capitalize">{r}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleResetPassword(m.email)}
                        className="text-sm text-blue-600 hover:underline">
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={pagination.total_pages} onPageChange={setPage} />
        </>
      )}
    </AppLayout>
  )
}
