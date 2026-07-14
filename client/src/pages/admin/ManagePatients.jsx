import { useState, useEffect } from 'react';
import api from '../../services/api';

function ManagePatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/patients');
      if (data.success) {
        setPatients(data.patients);
      }
    } catch (err) {
      setError('Failed to fetch patients list');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (userRecord) => {
    setError('');
    setSuccess('');
    try {
      const { data } = await api.patch(`/users/${userRecord._id}/status`);
      if (data.success) {
        setSuccess(data.message);
        fetchPatients();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Manage Patients</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">View patient details, histories, and handle status controls.</p>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-xl">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 text-sm text-green-700 bg-green-50 dark:bg-green-950/20 dark:text-green-400 rounded-xl">
          {success}
        </div>
      )}

      {/* Grid: Patient List + Details Pane */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Patients Table */}
        <div className="card lg:col-span-2 overflow-x-auto space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Registered Patients</h2>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="pb-3">Name</th>
                <th className="pb-3">Gender / DOB</th>
                <th className="pb-3">Blood Group</th>
                <th className="pb-3">Contact</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-850 text-sm">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-400">No patients registered.</td>
                </tr>
              ) : (
                patients.map((pat) => (
                  <tr key={pat._id} className="text-gray-700 dark:text-gray-300">
                    <td className="py-3 font-semibold text-gray-900 dark:text-white">
                      {pat.user?.name || 'N/A'}
                    </td>
                    <td className="py-3 capitalize">
                      {pat.gender} {pat.dateOfBirth && `(${new Date(pat.dateOfBirth).toLocaleDateString()})`}
                    </td>
                    <td className="py-3 font-mono font-bold text-primary-600 dark:text-primary-400">
                      {pat.bloodGroup}
                    </td>
                    <td className="py-3 text-xs">{pat.user?.phone || 'N/A'}</td>
                    <td className="py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        pat.user?.isActive ? 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400'
                      }`}>
                        {pat.user?.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 text-right space-x-2">
                      <button
                        onClick={() => setSelectedPatient(pat)}
                        className="text-xs font-medium text-primary-600 hover:text-primary-500"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => toggleStatus(pat.user)}
                        className="text-xs font-medium text-gray-500 hover:text-gray-700"
                      >
                        Toggle Status
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Patient Details Side Panel */}
        <div className="card h-fit space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Patient Record Card</h2>
          
          {selectedPatient ? (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-xl flex items-center justify-center font-bold text-lg">
                  {selectedPatient.user?.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">{selectedPatient.user?.name}</h3>
                  <p className="text-xs">{selectedPatient.user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase">Blood Group</span>
                  <p className="font-bold text-gray-850 dark:text-white">{selectedPatient.bloodGroup}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase">Gender</span>
                  <p className="capitalize font-bold text-gray-850 dark:text-white">{selectedPatient.gender}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase">Emergency Contact</span>
                  <p className="font-semibold text-gray-850 dark:text-white">
                    {selectedPatient.emergencyContact?.name || 'N/A'} ({selectedPatient.emergencyContact?.relation || 'N/A'})
                  </p>
                  <p className="text-xs">{selectedPatient.emergencyContact?.phone}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase">Allergies</span>
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">
                    {selectedPatient.allergies?.join(', ') || 'No known allergies'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase">Chronic Conditions</span>
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    {selectedPatient.chronicConditions?.join(', ') || 'None'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase">Medical History Summary</span>
                  <p className="text-xs mt-1 leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                    {selectedPatient.medicalHistorySummary || 'No history provided.'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center py-12 text-gray-400 text-sm">Select a patient from the list to view their clinical medical record.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ManagePatients;
