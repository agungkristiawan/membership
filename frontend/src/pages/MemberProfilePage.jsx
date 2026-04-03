import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getMember, deleteMember, updateRole } from '../api/members'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../layouts/AppLayout'
import Avatar from '../components/Avatar'
import Toast from '../components/Toast'

export default function MemberProfilePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [roleChanging, setRoleChanging] = useState(false)

  const isAdmin = user?.role === 'admin'
  const canEdit = ['admin', 'editor'].includes(user?.role)
  const canDelete = ['admin', 'editor'].includes(user?.role)
  const isOwnProfile = user?.id === id

  useEffect(() => {
    getMember(id)
      .then(({ data }) => setMember(data))
      .catch(() => navigate('/members'))
      .finally(() => setLoading(false))
  }, [id])

  const handleRoleChange = async (newRole) => {
    if (newRole === member.role) return
    setRoleChanging(true)
    try {
      await updateRole(id, newRole)
      setMember({ ...member, role: newRole })
      setToast({ message: 'Role updated successfully', type: 'success' })
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to update role', type: 'error' })
    } finally {
      setRoleChanging(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this member?')) return
    try {
      await deleteMember(id)
      navigate('/members')
    } catch {
      setToast({ message: 'Failed to remove member', type: 'error' })
    }
  }

  if (loading) return <AppLayout><p className="text-center text-gray-500 py-8">Loading...</p></AppLayout>
  if (!member) return null

  return (
    <AppLayout>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="mb-4">
        <Link to="/members" className="text-sm text-blue-600 hover:underline">&larr; Back to Members</Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="flex items-start gap-6 mb-6">
          <Avatar src={member.photo_url} name={member.full_name} size="lg" />
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">{member.full_name}</h2>
            <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium capitalize
              ${member.status === 'active' ? 'bg-green-100 text-green-700' :
                member.status === 'inactive' ? 'bg-gray-100 text-gray-600' :
                'bg-yellow-100 text-yellow-700'}`}>
              {member.status}
            </span>
            <p className="text-sm text-gray-500 mt-1">
              Member since {new Date(member.join_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Gender</span><p className="capitalize">{member.gender}</p></div>
          <div><span className="text-gray-500">Birthdate</span><p>{member.birthdate ? new Date(member.birthdate).toLocaleDateString() : '—'}</p></div>
          <div><span className="text-gray-500">Email</span><p>{member.email}</p></div>
          <div><span className="text-gray-500">Phone</span><p>{member.phone || '—'}</p></div>
          <div className="col-span-2"><span className="text-gray-500">Address</span><p>{member.address || '—'}</p></div>
          {member.hobbies?.length > 0 && (
            <div className="col-span-2">
              <span className="text-gray-500">Hobbies</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {member.hobbies.map((h) => (
                  <span key={h} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{h}</span>
                ))}
              </div>
            </div>
          )}
          {member.notes && (
            <div className="col-span-2"><span className="text-gray-500">Notes</span><p className="mt-1">{member.notes}</p></div>
          )}
          <div className="col-span-2">
            <span className="text-gray-500">Role</span>
            {isAdmin && !isOwnProfile ? (
              <div className="mt-1">
                <select
                  value={member.role}
                  disabled={roleChanging}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="member">Member</option>
                </select>
              </div>
            ) : (
              <p className="capitalize">{member.role}</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {(canEdit || isOwnProfile) && (
            <Link
              to={isOwnProfile && !canEdit ? '/profile/edit' : `/members/${id}/edit`}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors">
              Edit Profile
            </Link>
          )}
          {canDelete && !isOwnProfile && (
            <button onClick={handleDelete}
              className="bg-red-50 text-red-600 px-4 py-2 rounded text-sm font-medium hover:bg-red-100 transition-colors">
              Remove Member
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
