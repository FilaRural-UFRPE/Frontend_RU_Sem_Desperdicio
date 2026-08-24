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
import VoucherPage from './pages/student/VoucherPage'
import QueueCollaboratePage from './pages/student/QueueCollaboratePage'

// Páginas exclusivas do funcionário
import AllSchedulesPage from './pages/staff/AllSchedulesPage'
import ReportsPage from './pages/staff/ReportsPage'
import MenuUploadPage from './pages/staff/MenuUploadPage' // ✅ adicionado
import VoucherValidatePage from './pages/staff/VoucherValidatePage'
import VoucherGeneratePage from './pages/staff/VoucherGeneratePage'

// Ranking / Leaderboard
import RankingPage from './pages/ranking/RankingPage'
import ImportCsvPage from './pages/ranking/ImportCsvPage'
import WinnerPage from './pages/ranking/WinnerPage'
import RaffleCreatePage from './pages/ranking/RaffleCreatePage'

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
            <Route
              path="/voucher"
              element={
                <ProtectedRoute allowedTypes={['estudante', 'convidado']}>
                  <AppLayout><VoucherPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            {/* Colaborar com o status da fila (FilaRural) */}
            <Route
              path="/colaborar"
              element={
                <ProtectedRoute>
                  <AppLayout><QueueCollaboratePage /></AppLayout>
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
            <Route
              path="/voucher/validar"
              element={
                <ProtectedRoute allowedTypes={['funcionario']}>
                  <AppLayout><VoucherValidatePage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/voucher/gerar"
              element={
                <ProtectedRoute allowedTypes={['funcionario']}>
                  <AppLayout><VoucherGeneratePage /></AppLayout>
                </ProtectedRoute>
              }
            />
            {/* Ranking (qualquer usuário logado) */}
            <Route
              path="/ranking"
              element={
                <ProtectedRoute>
                  <AppLayout><RankingPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            {/* Exclusivo funcionário: importar presenças e definir vencedor */}
            <Route
              path="/ranking/importar"
              element={
                <ProtectedRoute allowedTypes={['funcionario']}>
                  <AppLayout><ImportCsvPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/ranking/vencedor"
              element={
                <ProtectedRoute allowedTypes={['funcionario']}>
                  <AppLayout><WinnerPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/ranking/sorteios"
              element={
                <ProtectedRoute allowedTypes={['funcionario']}>
                  <AppLayout><RaffleCreatePage /></AppLayout>
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
