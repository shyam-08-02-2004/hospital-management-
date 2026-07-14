import { useState, useEffect } from 'react';
import api from '../../services/api';

function ManageDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Doctor form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    department: '',
    specialization: '',
    qualifications: '',
    experienceYears: 0,
    licenseNumber: '',
    consultationFee: 500,
    bio: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resDocs, resDepts] = await Promise.all([
        api.get('/doctors'),
        api.get('/departments')
      ]);
      if (resDocs.data.success) setDoctors(resDocs.data.doctors);
      if (resDepts.data.success) {
        setDepartments(resDepts.data.departments);
        if (resDepts.data.departments.length > 0) {
          setForm(f => ({ ...f, department: resDepts.data.departments[0]._id }));
        }
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      ...form,
      qualifications: form.qualifications.split(',').map(q => q.trim()),
      experienceYears: Number(form.experienceYears),
      consultationFee: Number(form.consultationFee),
      availability: [
        { day: 'monday', startTime: '09:00', endTime: '17:00' },
        { day: 'tuesday', startTime: '09:00', endTime: '17:00' },
        { day: 'wednesday', startTime: '09:00', endTime: '17:00' },
        { day: 'thursday', startTime: '09:00', endTime: '17:00' },
        { day: 'friday', startTime: '09:00', endTime: '17:00' },
      ]
    };

    try {
      const { data } = await api.post('/doctors', payload);
      if (data.success) {
        setSuccess('Doctor profile created successfully!');
        setModalOpen(false);
        setForm({
          name: '',
          email: '',
          password: '',
          phone: '',
          department: departments[0]?._id || '',
          specialization: '',
          qualifications: '',
          experienceYears: 0,
          licenseNumber: '',
          consultationFee: 500,
          bio: '',
        });
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create doctor account');
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Manage Doctors</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add, edit, or configure profile availability for medical staff.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl shadow-sm text-sm flex items-center space-x-2 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Doctor</span>
        </button>
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

      {/* Doctor list Table */}
      <div className="card overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th className="pb-3">Name</th>
              <th className="pb-3">Department</th>
              <th className="pb-3">Specialization</th>
              <th className="pb-3">License Number</th>
              <th className="pb-3">Consult Fee</th>
              <th className="pb-3">Experience</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-850 text-sm">
            {doctors.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-center text-gray-400">No doctors registered.</td>
              </tr>
            ) : (
              doctors.map((doc) => (
                <tr key={doc._id} className="text-gray-700 dark:text-gray-300">
                  <td className="py-3 font-semibold text-gray-900 dark:text-white">
                    {doc.user?.name || 'N/A'}
                  </td>
                  <td className="py-3">{doc.department?.name || 'N/A'}</td>
                  <td className="py-3 capitalize">{doc.specialization}</td>
                  <td className="py-3 font-mono text-xs">{doc.licenseNumber}</td>
                  <td className="py-3 font-medium">₹{doc.consultationFee}</td>
                  <td className="py-3">{doc.experienceYears} Years</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Doctor Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-950 dark:text-white">Register New Doctor</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Full Name</label>
                  <input type="text" name="name" required value={form.name} onChange={handleInput} className="mt-1 input-field" placeholder="Dr. Jane Smith" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Email Address</label>
                  <input type="email" name="email" required value={form.email} onChange={handleInput} className="mt-1 input-field" placeholder="jane@hms.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Password</label>
                  <input type="password" name="password" required value={form.password} onChange={handleInput} className="mt-1 input-field" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Phone Number</label>
                  <input type="tel" name="phone" value={form.phone} onChange={handleInput} className="mt-1 input-field" placeholder="+15550000" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Department</label>
                  <select name="department" value={form.department} onChange={handleInput} className="mt-1 input-field">
                    {departments.map(d => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Specialization</label>
                  <input type="text" name="specialization" required value={form.specialization} onChange={handleInput} className="mt-1 input-field" placeholder="e.g. Cardiology" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Qualifications (comma-separated)</label>
                  <input type="text" name="qualifications" required value={form.qualifications} onChange={handleInput} className="mt-1 input-field" placeholder="MD, FACC" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Experience (Years)</label>
                  <input type="number" name="experienceYears" required value={form.experienceYears} onChange={handleInput} className="mt-1 input-field" min="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">License Number</label>
                  <input type="text" name="licenseNumber" required value={form.licenseNumber} onChange={handleInput} className="mt-1 input-field" placeholder="LIC-CARD-554" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Consultation Fee (INR)</label>
                  <input type="number" name="consultationFee" required value={form.consultationFee} onChange={handleInput} className="mt-1 input-field" min="0" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Bio / Description</label>
                  <textarea name="bio" value={form.bio} onChange={handleInput} className="mt-1 input-field h-24" placeholder="Brief description of the doctor's experience..."></textarea>
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium">Save Doctor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageDoctors;
