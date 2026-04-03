import { Link } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Forgot Password</h2>
      <p className="text-sm text-gray-600 mb-2">
        Password resets are handled by an administrator.
      </p>
      <p className="text-sm text-gray-600 mb-6">
        Please contact an admin and ask them to generate a reset link for you from the User Management page.
      </p>
      <Link to="/login" className="text-blue-600 hover:underline text-sm">
        &larr; Back to Login
      </Link>
    </AuthLayout>
  )
}
