import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingScreen from './components/shared/LoadingScreen'

const AppLayout = lazy(() => import('./components/layout/AppLayout'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const PasswordRecoverPage = lazy(() => import('./pages/auth/PasswordRecoverPage'))
const PasswordResetPage = lazy(() => import('./pages/auth/PasswordResetPage'))
const DashboardRouter = lazy(() => import('./pages/DashboardRouter'))
const SchedulePage = lazy(() => import('./pages/student/SchedulePage'))
const HistoryPage = lazy(() => import('./pages/student/HistoryPage'))
const ProfilePage = lazy(() => import('./pages/student/ProfilePage'))
const ChangePasswordPage = lazy(() => import('./pages/student/ChangePasswordPage'))
const MenuPage = lazy(() => import('./pages/student/MenuPage'))
const VoucherPage = lazy(() => import('./pages/student/VoucherPage'))
const QueueCollaboratePage = lazy(() => import('./pages/student/QueueCollaboratePage'))
const AllSchedulesPage = lazy(() => import('./pages/staff/AllSchedulesPage'))
const ReportsPage = lazy(() => import('./pages/staff/ReportsPage'))
const MenuUploadPage = lazy(() => import('./pages/staff/MenuUploadPage'))
const VoucherValidatePage = lazy(() => import('./pages/staff/VoucherValidatePage'))
const VoucherGeneratePage = lazy(() => import('./pages/staff/VoucherGeneratePage'))
const AnnouncementsPage = lazy(() => import('./pages/staff/AnnouncementsPage'))
const RankingPage = lazy(() => import('./pages/ranking/RankingPage'))
const ImportCsvPage = lazy(() => import('./pages/ranking/ImportCsvPage'))
const WinnerPage = lazy(() => import('./pages/ranking/WinnerPage'))
const RaffleCreatePage = lazy(() => import('./pages/ranking/RaffleCreatePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<LoadingScreen />}>
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
                    <AppLayout>
                      <DashboardRouter />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agendar"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <SchedulePage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/historico"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <HistoryPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/perfil"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ProfilePage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/alterar-senha"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ChangePasswordPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              {/* Cardápio da Semana — estudantes e convidados */}
              <Route
                path="/cardapio"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <MenuPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/voucher"
                element={
                  <ProtectedRoute allowedTypes={['estudante', 'convidado']}>
                    <AppLayout>
                      <VoucherPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              {/* Colaborar com o status da fila (FilaRural) */}
              <Route
                path="/colaborar"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <QueueCollaboratePage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Exclusivo funcionário */}
              <Route
                path="/agendamentos"
                element={
                  <ProtectedRoute allowedTypes={['funcionario']}>
                    <AppLayout>
                      <AllSchedulesPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/relatorios"
                element={
                  <ProtectedRoute allowedTypes={['funcionario']}>
                    <AppLayout>
                      <ReportsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              {/* ✅ Upload do cardápio — exclusivo funcionário */}
              <Route
                path="/cardapio-upload"
                element={
                  <ProtectedRoute allowedTypes={['funcionario']}>
                    <AppLayout>
                      <MenuUploadPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/voucher/validar"
                element={
                  <ProtectedRoute allowedTypes={['funcionario']}>
                    <AppLayout>
                      <VoucherValidatePage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/voucher/gerar"
                element={
                  <ProtectedRoute allowedTypes={['funcionario']}>
                    <AppLayout>
                      <VoucherGeneratePage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              {/* Avisos administrativos → e-mail dos cadastrados */}
              <Route
                path="/avisos"
                element={
                  <ProtectedRoute allowedTypes={['funcionario']}>
                    <AppLayout>
                      <AnnouncementsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              {/* Ranking (qualquer usuário logado) */}
              <Route
                path="/ranking"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <RankingPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              {/* Exclusivo funcionário: importar presenças e definir vencedor */}
              <Route
                path="/ranking/importar"
                element={
                  <ProtectedRoute allowedTypes={['funcionario']}>
                    <AppLayout>
                      <ImportCsvPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ranking/vencedor"
                element={
                  <ProtectedRoute allowedTypes={['funcionario']}>
                    <AppLayout>
                      <WinnerPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ranking/sorteios"
                element={
                  <ProtectedRoute allowedTypes={['funcionario']}>
                    <AppLayout>
                      <RaffleCreatePage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
