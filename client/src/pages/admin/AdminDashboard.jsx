import { useState, useEffect } from 'react';
import api from '../../services/api';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data } = await api.get('/dashboard');
      if (data.success) {
        setStats(data.stats);
      }
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

  const { totalPatients, totalDoctors, totalAppointments, totalRevenue, statusSplit, recentAppointments } = stats;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Overview of HMS performance, stats, and revenue streams.</p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Revenue */}
        <div className="card flex items-center space-x-4 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-gray-900 border-emerald-100/50 dark:border-emerald-900/10">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Card 2: Patients */}
        <div className="card flex items-center space-x-4">
          <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl text-primary-600 dark:text-primary-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Patients</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalPatients}</p>
          </div>
        </div>

        {/* Card 3: Doctors */}
        <div className="card flex items-center space-x-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Doctors</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalDoctors}</p>
          </div>
        </div>

        {/* Card 4: Appointments */}
        <div className="card flex items-center space-x-4">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Bookings</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalAppointments}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Bookings List */}
        <div className="card lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Appointments</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="pb-3">Patient</th>
                  <th className="pb-3">Doctor</th>
                  <th className="pb-3">Date/Time</th>
                  <th className="pb-3">Fee</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-850 text-sm">
                {recentAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-400">No appointments found.</td>
                  </tr>
                ) : (
                  recentAppointments.map((apt) => (
                    <tr key={apt._id} className="text-gray-700 dark:text-gray-300">
                      <td className="py-3 font-medium text-gray-900 dark:text-white">
                        {apt.patient?.user?.name || 'Deleted Patient'}
                      </td>
                      <td className="py-3">
                        Dr. {apt.doctor?.user?.name || 'Deleted Doctor'}
                      </td>
                      <td className="py-3">
                        {new Date(apt.date).toLocaleDateString()} at {apt.startTime}
                      </td>
                      <td className="py-3">₹{apt.consultationFee}</td>
                      <td className="py-3">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${
                          apt.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400' :
                          apt.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400' :
                          apt.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400'
                        }`}>
                          {apt.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Appointment Status chart */}
        <div className="card space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Booking Status Split</h2>
          
          <div className="space-y-4 pt-2">
            {Object.entries(statusSplit).map(([status, count]) => {
              const total = totalAppointments || 1;
              const pct = Math.round((count / total) * 100);
              
              // Colors
              let color = 'bg-primary-500';
              if (status === 'confirmed') color = 'bg-green-500';
              else if (status === 'completed') color = 'bg-blue-500';
              else if (status === 'cancelled') color = 'bg-red-500';
              else if (status === 'pending') color = 'bg-yellow-500';

              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium capitalize">
                    <span className="text-gray-700 dark:text-gray-300">{status} ({count})</span>
                    <span className="text-gray-500">{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
                    <div className={`${color} h-2.5 rounded-full`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
