import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './utils/ProtectedRoute'

import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import RegisterPage from './pages/RegisterPage'
import MemberDirectoryPage from './pages/MemberDirectoryPage'
import MemberProfilePage from './pages/MemberProfilePage'
import EditMemberPage from './pages/EditMemberPage'
import MyProfilePage from './pages/MyProfilePage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import InviteMemberPage from './pages/InviteMemberPage'
import UserManagementPage from './pages/UserManagementPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/register/:token" element={<RegisterPage />} />

          {/* All authenticated roles */}
          <Route path="/members" element={<ProtectedRoute><MemberDirectoryPage /></ProtectedRoute>} />
          <Route path="/members/:id" element={<ProtectedRoute><MemberProfilePage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><MyProfilePage /></ProtectedRoute>} />
          <Route path="/profile/edit" element={<ProtectedRoute><EditMemberPage /></ProtectedRoute>} />
          <Route path="/profile/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />

          {/* Admin & Editor */}
          <Route path="/members/invite" element={
            <ProtectedRoute roles={['admin', 'editor']}><InviteMemberPage /></ProtectedRoute>
          } />
          <Route path="/members/:id/edit" element={
            <ProtectedRoute roles={['admin', 'editor']}><EditMemberPage /></ProtectedRoute>
          } />

          {/* Admin only */}
          <Route path="/admin/users" element={
            <ProtectedRoute roles={['admin']}><UserManagementPage /></ProtectedRoute>
          } />

          {/* Default */}
          <Route path="/" element={<Navigate to="/members" replace />} />
          <Route path="*" element={<Navigate to="/members" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
