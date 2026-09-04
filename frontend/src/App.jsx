import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { useEffect } from 'react';
import Landing from './pages/Landing';
import Login from './features/auth/pages/Login';
import ForgotPassword from './features/auth/pages/ForgotPassword';
import DashboardLayout from './components/layout/DashboardLayout';
import Overview from './features/dashboard/pages/Overview';
import Movements from './features/movements/pages/Movements';
import CreatePermit from './features/movements/pages/CreatePermit';
import UserManagement from './features/users/pages/UserManagement';
import NationalReports from './features/analytics/pages/NationalReports';
import PerformanceAudit from './features/analytics/pages/PerformanceAudit';
import PoliceCases from './features/police/pages/PoliceCases';
import VetRecords from './features/vet/pages/VetRecords';
import CreateVetRecord from './features/vet/pages/CreateVetRecord';
import TrackingMap from './features/gps/pages/TrackingMap';
import Geofencing from './features/geofencing/pages/Geofencing';

import Notifications from './features/notifications/pages/Notifications';
import SystemSettings from './features/settings/pages/SystemSettings';
import DriverTripPage from './features/driver/DriverTripPage';
import api from './lib/api';
import { connectSocket } from './lib/socket';

const ProtectedRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" replace />;
  return children;
};

const PermittedRoute = ({ permKey, children }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" replace />;
  const user = JSON.parse(userStr);

  const DEFAULT_ROLE_PERMISSIONS = {
    RAB: ['overview', 'cases', 'gps', 'movements', 'geofencing', 'national_reports', 'performance_audit', 'notifications', 'system_settings', 'user_management'],
    DARO: ['overview', 'gps', 'movements', 'geofencing', 'notifications', 'user_management'],
    SARO: ['overview', 'gps', 'movements', 'geofencing', 'notifications'],
    POLICE: ['cases', 'gps', 'notifications']
  };

  const perms = (user.permissions !== null && user.permissions !== undefined && Array.isArray(user.permissions))
    ? user.permissions
    : (DEFAULT_ROLE_PERMISSIONS[user.role] || []);

  if (!perms.includes(permKey)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const VetRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  if (user?.role !== 'DARO' && user?.role !== 'SARO' && user?.role !== 'RAB') return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    
    const socket = connectSocket();
    socket.on('connect', () => {
      socket.emit('joinRoom', `user_${user.id}`);
    });
    
    socket.on('notification', (data) => {
      toast.success(
        (t) => (
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-sm">New Update</span>
            <span className="text-xs">{data.message.split('/dashboard/gps')[0]}</span>
            {data.message.includes('/dashboard/gps') && (
              <a 
                href={data.message.substring(data.message.indexOf('/dashboard/gps'))}
                className="text-white underline font-medium mt-1 text-xs"
                onClick={() => toast.dismiss(t.id)}
              >
                Track Live on Map →
              </a>
            )}
          </div>
        ),
        { duration: 10000 }
      );
    });

    return () => socket.disconnect();
  }, []);

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

          <Route path="notifications" element={<PermittedRoute permKey="notifications"><Notifications /></PermittedRoute>} />
          <Route path="movements" element={<PermittedRoute permKey="movements"><Movements /></PermittedRoute>} />
          <Route path="movements/new" element={<PermittedRoute permKey="movements"><CreatePermit key="new" /></PermittedRoute>} />
          <Route path="movements/edit/:id" element={<PermittedRoute permKey="movements"><CreatePermit key="edit" /></PermittedRoute>} />
          <Route path="movements/view/:id" element={<PermittedRoute permKey="movements"><CreatePermit key="view" /></PermittedRoute>} />
          <Route path="users" element={<PermittedRoute permKey="user_management"><UserManagement /></PermittedRoute>} />
          <Route path="system-settings" element={<PermittedRoute permKey="system_settings"><SystemSettings /></PermittedRoute>} />
          <Route path="national-reports" element={<PermittedRoute permKey="national_reports"><NationalReports /></PermittedRoute>} />
          <Route path="performance-audit" element={<PermittedRoute permKey="performance_audit"><PerformanceAudit /></PermittedRoute>} />
          <Route path="cases" element={<PermittedRoute permKey="cases"><PoliceCases /></PermittedRoute>} />
          <Route path="vet-records" element={<VetRoute><VetRecords /></VetRoute>} />
          <Route path="vet-records/create" element={<VetRoute><CreateVetRecord /></VetRoute>} />
          <Route path="gps" element={<PermittedRoute permKey="gps"><TrackingMap /></PermittedRoute>} />
          <Route path="geofencing" element={<PermittedRoute permKey="geofencing"><Geofencing /></PermittedRoute>} />

        </Route>
      </Routes>
    </>
  );
}

export default App;
