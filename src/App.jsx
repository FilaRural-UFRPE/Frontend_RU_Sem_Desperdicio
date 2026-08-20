import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'

// Páginas públicas
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import PasswordRecoverPage from './pages/auth/PasswordRecoverPage'
import PasswordResetPage from './pages/auth/PasswordResetPage'

// Páginas autenticadas
import DashboardRouter from './pages/DashboardRouter'
import SchedulePage from './pages/student/SchedulePage'
import HistoryPage from './pages/student/HistoryPage'
import ProfilePage from './pages/student/ProfilePage'
import ChangePasswordPage from './pages/student/ChangePasswordPage'
import MenuPage from './pages/student/MenuPage'

// Páginas exclusivas do funcionário
import AllSchedulesPage from './pages/staff/AllSchedulesPage'
import ReportsPage from './pages/staff/ReportsPage'
import MenuUploadPage from './pages/staff/MenuUploadPage' // ✅ adicionado

// Utilitários
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Público */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro" element={<RegisterPage />} />
            <Route path="/recuperar-senha" element={<PasswordRecoverPage />} />
            <Route path="/redefinir-senha" element={<PasswordResetPage />} />

            {/* Raiz → login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Autenticado */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout><DashboardRouter /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/agendar"
              element={
                <ProtectedRoute>
                  <AppLayout><SchedulePage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/historico"
              element={
                <ProtectedRoute>
                  <AppLayout><HistoryPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <AppLayout><ProfilePage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/alterar-senha"
              element={
                <ProtectedRoute>
                  <AppLayout><ChangePasswordPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            {/* Cardápio da Semana — estudantes e convidados */}
            <Route
              path="/cardapio"
              element={
                <ProtectedRoute>
                  <AppLayout><MenuPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Exclusivo funcionário */}
            <Route
              path="/agendamentos"
              element={
                <ProtectedRoute allowedTypes={['funcionario']}>
                  <AppLayout><AllSchedulesPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/relatorios"
              element={
                <ProtectedRoute allowedTypes={['funcionario']}>
                  <AppLayout><ReportsPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            {/* ✅ Upload do cardápio — exclusivo funcionário */}
            <Route
              path="/cardapio-upload"
              element={
                <ProtectedRoute allowedTypes={['funcionario']}>
                  <AppLayout><MenuUploadPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
