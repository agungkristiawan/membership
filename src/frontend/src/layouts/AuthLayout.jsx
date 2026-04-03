export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">MemberHub</h1>
        </div>
        <div className="bg-white rounded-lg shadow p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
