import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import Landing from './pages/Landing'
import Login from './features/auth/pages/Login'
import ForgotPassword from './features/auth/pages/ForgotPassword'
import DashboardLayout from './components/layout/DashboardLayout'
import Overview from './features/dashboard/pages/Overview'
import Movements from './features/movements/pages/Movements';
import CreatePermit from './features/movements/pages/CreatePermit';
import UserManagement from './features/users/pages/UserManagement';
import NationalReports from './features/analytics/pages/NationalReports';
import PerformanceAudit from './features/analytics/pages/PerformanceAudit';
import PoliceCases from './features/police/pages/PoliceCases';
import VetRecords from './features/vet/pages/VetRecords';
import TrackingMap from './features/gps/pages/TrackingMap';
import DriverTripPage from './features/driver/DriverTripPage';
import api from './lib/api'

// Simple Auth Guard component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

const AdminRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  if (user?.role !== 'RAB') return <Navigate to="/dashboard" replace />;
  return children;
}

const PoliceRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  if (user?.role !== 'POLICE' && user?.role !== 'RAB') return <Navigate to="/dashboard" replace />;
  return children;
}

const UserManagementRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  if (user?.role !== 'RAB' && user?.role !== 'DARO') return <Navigate to="/dashboard" replace />;
  return children;
}

const VetRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  if (user?.role !== 'DARO' && user?.role !== 'SARO' && user?.role !== 'RAB') return <Navigate to="/dashboard" replace />;
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
        <Route path="/driver/trip/:token" element={<DriverTripPage />} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Overview />} />
          <Route path="movements" element={<Movements />} />
          <Route path="movements/new" element={<CreatePermit key="new" />} />
          <Route path="movements/edit/:id" element={<CreatePermit key="edit" />} />
          <Route path="users" element={<UserManagementRoute><UserManagement /></UserManagementRoute>} />
          <Route path="national-reports" element={<AdminRoute><NationalReports /></AdminRoute>} />
          <Route path="performance-audit" element={<AdminRoute><PerformanceAudit /></AdminRoute>} />
          <Route path="cases" element={<PoliceRoute><PoliceCases /></PoliceRoute>} />
          <Route path="vet-records" element={<VetRoute><VetRecords /></VetRoute>} />
          <Route path="gps" element={<TrackingMap />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
