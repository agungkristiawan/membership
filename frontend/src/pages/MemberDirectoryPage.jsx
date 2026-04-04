import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMembers } from '../api/members'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../layouts/AppLayout'
import Avatar from '../components/Avatar'
import Pagination from '../components/Pagination'

const STATUS_OPTIONS = ['', 'active', 'inactive', 'pending']

export default function MemberDirectoryPage() {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total_pages: 1 })
  const [loading, setLoading] = useState(false)

  const canInvite = ['admin', 'editor'].includes(user?.role)

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
    fetchMembers({ page, search: search || undefined, status: status || undefined })
  }, [page, search, status])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchMembers({ page: 1, search: search || undefined, status: status || undefined })
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Members</h2>
        {canInvite && (
          <Link to="/members/invite"
            className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700 transition-colors">
            + Invite Member
          </Link>
        )}
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>
        <button type="submit"
          className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-900 transition-colors">
          Search
        </button>
      </form>

      {loading ? (
        <p className="text-center text-gray-500 py-8">Loading...</p>
      ) : members.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No members found</p>
      ) : (
        <>
          <div className="bg-slate-100 rounded-lg shadow overflow-hidden border-t-4 border-indigo-500">
            <table className="w-full text-sm">
              <thead className="bg-indigo-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-200">Member</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-200">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-200">Status</th>
                  <th className="px-4 py-3"></th>
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize
                        ${m.status === 'active' ? 'bg-emerald-500 text-white' :
                          m.status === 'inactive' ? 'bg-slate-400 text-white' :
                          'bg-amber-500 text-white'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/members/${m.id}`}
                        className="text-blue-600 hover:underline text-sm">
                        View
                      </Link>
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
