import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'

const navItems = [
  { label: 'Members', path: '/members', roles: ['admin', 'editor', 'member'] },
  { label: 'Admin', path: '/admin/users', roles: ['admin'] },
]

export default function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const visibleNav = navItems.filter((item) => item.roles.includes(user?.role))

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-gradient-to-b from-slate-900 to-indigo-900 flex flex-col">
        <div className="px-6 py-5 border-b border-white/10">
          <h1 className="text-xl font-bold text-white">MemberHub</h1>
        </div>
        <nav className="flex-1 py-4">
          {visibleNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-6 py-3 text-sm font-medium transition-colors ${
                location.pathname.startsWith(item.path)
                  ? 'bg-white/20 text-white border-r-2 border-white'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="bg-[rgb(224,231,255)] border-b border-[rgb(207,214,250)] px-6 py-3 flex justify-end items-center gap-3">
          <Link to="/profile" className="flex items-center gap-2 hover:opacity-80">
            <Avatar src={user?.photo_url} name={user?.full_name} size="sm" />
            <span className="text-sm font-medium text-gray-700">{user?.full_name}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            Logout
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
