import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

function PatientDashboard() {
  const [stats, setStats] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [resDash, resProfile] = await Promise.all([
        api.get('/dashboard'),
        api.get('/auth/me')
      ]);
      if (resDash.data.success) setStats(resDash.data.stats);
      if (resProfile.data.success) setPatientProfile(resProfile.data.profile);
    } catch (err) {
      setError('Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 rounded-xl">
        {error}
      </div>
    );
  }

  const { totalAppointments, totalPrescriptions, upcomingAppointment, unpaidAppointmentsCount } = stats;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Patient Portal</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Welcome to your patient care panel. View prescriptions, schedule checkups, and check balances.</p>
      </div>

      {/* Grid: Stats & Vitals */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Metric 1 */}
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Bookings</p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{totalAppointments}</p>
        </div>
        {/* Metric 2 */}
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Prescriptions</p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{totalPrescriptions}</p>
        </div>
        {/* Metric 3: Alerts */}
        <div className={`card ${unpaidAppointmentsCount > 0 ? 'bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900/20' : ''}`}>
          <p className="text-sm text-gray-500 dark:text-gray-400">Outstanding Invoices</p>
          <p className={`text-3xl font-extrabold mt-1 ${unpaidAppointmentsCount > 0 ? 'text-red-650' : 'text-gray-900 dark:text-white'}`}>
            {unpaidAppointmentsCount}
          </p>
          {unpaidAppointmentsCount > 0 && (
            <Link to="/patient/appointments" className="text-xs font-semibold text-red-650 dark:text-red-400 hover:underline mt-2 block">
              Pay outstanding bills now &rarr;
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Next/Upcoming Appointment card */}
        <div className="card lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Next Scheduled Appointment</h2>

          {upcomingAppointment ? (
            <div className="bg-primary-50/50 dark:bg-primary-950/20 p-6 rounded-2xl border border-primary-100/50 dark:border-primary-900/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wider">{upcomingAppointment.department?.name}</p>
                <h3 className="text-lg font-bold text-gray-950 dark:text-white">Dr. {upcomingAppointment.doctor?.user?.name}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 pt-1">
                  <span className="flex items-center space-x-1">
                    <span>📅</span>
                    <span>{new Date(upcomingAppointment.date).toLocaleDateString()}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span>🕒</span>
                    <span>{upcomingAppointment.startTime}</span>
                  </span>
                </div>
              </div>
              <div>
                <Link
                  to="/patient/appointments"
                  className="inline-block px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl text-sm transition-all"
                >
                  Manage Booking
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/20 rounded-2xl border border-dashed border-gray-250 dark:border-gray-800 space-y-4">
              <p className="text-gray-500 text-sm">You have no upcoming appointments scheduled.</p>
              <Link
                to="/patient/book"
                className="inline-flex px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl text-sm transition-all"
              >
                Book Checkup Now
              </Link>
            </div>
          )}
        </div>

        {/* Vitals / Health Info */}
        <div className="card space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Medical Card Vitals</h2>
          
          {patientProfile ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-400 font-semibold uppercase">Blood Group</span>
                  <p className="font-bold text-gray-900 dark:text-white text-base mt-0.5">{patientProfile.bloodGroup || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-semibold uppercase">Gender</span>
                  <p className="font-bold text-gray-900 dark:text-white text-base capitalize mt-0.5">{patientProfile.gender || 'N/A'}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                <div>
                  <span className="text-xs text-gray-400 font-semibold uppercase">Known Allergies</span>
                  <p className="text-xs font-semibold text-red-650 mt-1">
                    {patientProfile.allergies?.join(', ') || 'No known drug/food allergies'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-semibold uppercase">Chronic Conditions</span>
                  <p className="text-xs font-semibold text-amber-650 mt-1">
                    {patientProfile.chronicConditions?.join(', ') || 'None reported'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400">Loading patient vitals profile details...</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PatientDashboard;
