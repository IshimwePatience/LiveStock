import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import Landing from './pages/Landing'
import Login from './features/auth/pages/Login'
import ForgotPassword from './features/auth/pages/ForgotPassword'
import DashboardLayout from './components/layout/DashboardLayout'
import Overview from './features/dashboard/pages/Overview'
import Movements from './features/movements/pages/Movements';
import UserManagement from './features/users/pages/UserManagement';
import NationalReports from './features/analytics/pages/NationalReports';
import PerformanceAudit from './features/analytics/pages/PerformanceAudit';
import PoliceCases from './features/police/pages/PoliceCases';
import VetRecords from './features/vet/pages/VetRecords';
import api from './lib/api'

// Simple Auth Guard component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#15803d',
            color: '#fff',
            borderRadius: '4px',
            boxShadow: '0px 4px 0px 0px #14532d',
            padding: '16px 24px',
            fontSize: '14px',
            fontWeight: '600',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#15803d',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      {/* Protected Dashboard Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Overview />} />
        <Route path="movements" element={<Movements />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="national-reports" element={<NationalReports />} />
        <Route path="performance-audit" element={<PerformanceAudit />} />
        <Route path="cases" element={<PoliceCases />} />
        <Route path="vet-records" element={<VetRecords />} />
      </Route>
      </Routes>
    </>
  )
}

export default App
