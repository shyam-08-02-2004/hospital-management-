import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

function DoctorDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);

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

  const handleStatusUpdate = async (id, status) => {
    try {
      const { data } = await api.put(`/appointments/${id}/status`, { status });
      if (data.success) {
        fetchDashboardData();
        setSelectedAppointment(null);
      }
    } catch (err) {
      setError('Failed to update status');
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

  const { todaysAppointments, totalAppointments, completedAppointments, uniquePatientsCount, recentPrescriptions } = stats;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Doctor Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">View today's check-ins, consult schedules, and recent prescriptions.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Consultations</p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{totalAppointments}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Completed Sessions</p>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{completedAppointments}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Unique Patients</p>
          <p className="text-3xl font-extrabold text-primary-650 dark:text-primary-400 mt-1">{uniquePatientsCount}</p>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Today's appointments schedule */}
        <div className="card lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Today's Consultation Schedule</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="pb-3">Time</th>
                  <th className="pb-3">Patient</th>
                  <th className="pb-3">Reason</th>
                  <th className="pb-3">Payment</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-850 text-sm">
                {todaysAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">No appointments scheduled for today.</td>
                  </tr>
                ) : (
                  todaysAppointments.map((apt) => (
                    <tr key={apt._id} className="text-gray-700 dark:text-gray-300">
                      <td className="py-3 font-semibold text-primary-600 dark:text-primary-400">{apt.startTime}</td>
                      <td className="py-3 font-semibold text-gray-900 dark:text-white">{apt.patient?.user?.name}</td>
                      <td className="py-3 max-w-xs truncate">{apt.reasonForVisit || 'Checkup'}</td>
                      <td className="py-3">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                          apt.isPaid ? 'bg-green-100 text-green-800 dark:bg-green-950/20' : 'bg-red-100 text-red-800 dark:bg-red-950/20'
                        }`}>
                          {apt.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="py-3 capitalize">{apt.status}</td>
                      <td className="py-3 text-right space-x-2">
                        {apt.status === 'confirmed' && (
                          <Link to={`/video-call/${apt._id}`} className="text-xs font-bold text-blue-600 hover:text-blue-700 mr-2">
                            Join Call
                          </Link>
                        )}
                        <button onClick={() => setSelectedAppointment(apt)} className="text-xs text-primary-600 hover:underline">
                          Manage
                        </button>
                        {apt.status !== 'completed' && (
                          <Link
                            to={`/doctor/prescribe?aptId=${apt._id}&patId=${apt.patient?._id}`}
                            className="text-xs font-medium text-emerald-650 hover:underline ml-2"
                          >
                            Prescribe
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected consultation management sidebar pane */}
        <div className="card space-y-6 h-fit">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Active Consultation</h2>
          {selectedAppointment ? (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-400 uppercase">Patient Name</p>
                <p className="font-bold text-gray-950 dark:text-white text-base mt-1">{selectedAppointment.patient?.user?.name}</p>
                <p className="text-xs mt-0.5">DOB: {selectedAppointment.patient?.dateOfBirth ? new Date(selectedAppointment.patient.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                <p className="text-xs mt-0.5">Blood Group: {selectedAppointment.patient?.bloodGroup || 'N/A'}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">Reason for Visit</p>
                <p className="mt-1 leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl">{selectedAppointment.reasonForVisit || 'General health consult.'}</p>
              </div>

              <div className="pt-2 flex flex-col space-y-2">
                <button
                  onClick={() => handleStatusUpdate(selectedAppointment._id, 'confirmed')}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-medium"
                >
                  Confirm Check-in
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedAppointment._id, 'no_show')}
                  className="w-full py-2 bg-yellow-600 hover:bg-yellow-750 text-white rounded-xl text-xs font-medium"
                >
                  Mark No-Show
                </button>
                <Link
                  to={`/doctor/prescribe?aptId=${selectedAppointment._id}&patId=${selectedAppointment.patient?._id}`}
                  className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-medium text-center block"
                >
                  Write Prescription & Complete
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-center py-12 text-gray-400 text-sm">Select an active consult from the list to view vitals, confirm check-in, or manage checkups.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DoctorDashboard;
