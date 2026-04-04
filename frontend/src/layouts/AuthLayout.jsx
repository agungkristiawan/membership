export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-500 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white drop-shadow">MemberHub</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
