import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setCredentials, logout } from './redux/slices/authSlice';
import api from './services/api';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';

// Admin Portal Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageDoctors from './pages/admin/ManageDoctors';
import ManageDepartments from './pages/admin/ManageDepartments';
import ManagePatients from './pages/admin/ManagePatients';
import AdminBloodBank from './pages/admin/AdminBloodBank';
import AdminPharmacy from './pages/admin/AdminPharmacy';

// Doctor Portal Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import ManageAvailability from './pages/doctor/ManageAvailability';
import PrescriptionEditor from './pages/doctor/PrescriptionEditor';
import VideoCall from './pages/VideoCall';

// Patient Portal Pages
import PatientDashboard from './pages/patient/PatientDashboard';
import BookAppointment from './pages/patient/BookAppointment';
import PatientAppointments from './pages/patient/PatientAppointments';
import MedicalRecords from './pages/patient/MedicalRecords';
import Messages from './pages/Messages';

// Role Guard Component
function RoleGuard({ allowedRoles, children }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
}

function App() {
  const theme = useSelector((state) => state.theme.mode);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [initLoading, setInitLoading] = useState(true);

  // Auto-login on mount (using refresh-token cookie)
  useEffect(() => {
    const autoLogin = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setInitLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        if (data.success) {
          dispatch(setCredentials({ user: data.user, accessToken }));
        }
      } catch (err) {
        console.warn('Auto-login session expired or invalid');
        localStorage.removeItem('accessToken');
        dispatch(logout());
      } finally {
        setInitLoading(false);
      }
    };

    autoLogin();
  }, [dispatch]);

  if (initLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-200">
        <Routes>
          {/* Public Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Route>

          {/* Protected Dashboards */}
          <Route element={<DashboardLayout />}>
            {/* Common Protected Routes */}
            <Route path="/video-call/:roomId" element={<VideoCall />} />
            <Route path="/messages" element={<Messages />} />
            
            {/* Admin Portal */}
            <Route
              path="/admin"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <AdminDashboard />
                </RoleGuard>
              }
            />
            <Route
              path="/admin/doctors"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <ManageDoctors />
                </RoleGuard>
              }
            />
            <Route
              path="/admin/departments"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <ManageDepartments />
                </RoleGuard>
              }
            />
            <Route
              path="/admin/patients"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <ManagePatients />
                </RoleGuard>
              }
            />
            <Route
              path="/admin/blood-bank"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <AdminBloodBank />
                </RoleGuard>
              }
            />
            <Route
              path="/admin/pharmacy"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <AdminPharmacy />
                </RoleGuard>
              }
            />

            {/* Doctor Portal */}
            <Route
              path="/doctor"
              element={
                <RoleGuard allowedRoles={['doctor']}>
                  <DoctorDashboard />
                </RoleGuard>
              }
            />
            <Route
              path="/doctor/availability"
              element={
                <RoleGuard allowedRoles={['doctor']}>
                  <ManageAvailability />
                </RoleGuard>
              }
            />
            <Route
              path="/doctor/prescribe"
              element={
                <RoleGuard allowedRoles={['doctor']}>
                  <PrescriptionEditor />
                </RoleGuard>
              }
            />

            {/* Patient Portal */}
            <Route
              path="/patient"
              element={
                <RoleGuard allowedRoles={['patient']}>
                  <PatientDashboard />
                </RoleGuard>
              }
            />
            <Route
              path="/patient/book"
              element={
                <RoleGuard allowedRoles={['patient']}>
                  <BookAppointment />
                </RoleGuard>
              }
            />
            <Route
              path="/patient/appointments"
              element={
                <RoleGuard allowedRoles={['patient']}>
                  <PatientAppointments />
                </RoleGuard>
              }
            />
            <Route
              path="/patient/records"
              element={
                <RoleGuard allowedRoles={['patient']}>
                  <MedicalRecords />
                </RoleGuard>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
