import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { AuthCallback } from './pages/AuthCallback'
import { LanguageProvider } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'
import { SidebarProvider } from './context/SidebarContext'
import { Dashboard } from './pages/Dashboard'
import { Settings } from './pages/Settings'
import { Calendar } from './pages/Calendar'
import { Tasks } from './pages/Tasks'
import { Courses } from './pages/Courses'
import { CourseDetail } from './pages/CourseDetail'
import { Attendance } from './pages/Attendance'
import { Installation } from './pages/Installation'
import { Onboarding } from './pages/Onboarding'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AttendancePopup } from './components/AttendancePopup'

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SidebarProvider>
          <BrowserRouter>
            <Routes>
              {/* Rutas públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/install" element={<Installation />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

              {/* Rutas protegidas: requieren sesión */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
              <Route path="/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
              <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />

              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>

            {/* Global attendance popup — shown after class time if not yet recorded */}
            <AttendancePopup />
          </BrowserRouter>
        </SidebarProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App
