import { useAuth } from '../contexts/AuthContext'
import StudentDashboard from './student/DashboardPage'
import StaffDashboard from './staff/StaffDashboard'

export default function DashboardRouter() {
  const { user } = useAuth()
  return user?.type === 'funcionario' ? <StaffDashboard /> : <StudentDashboard />
}
