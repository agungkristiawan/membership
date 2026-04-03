import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

// Redirects to /members/:id/edit using the logged-in user's ID
export default function EditMyProfilePage() {
  const { user } = useAuth()
  if (!user) return null
  return <Navigate to={`/members/${user.id}/edit`} replace />
}
