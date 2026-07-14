import { useState, useEffect } from 'react';
import api from '../../services/api';

function ManageDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Department form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    icon: 'StethoscopeIcon',
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/departments');
      if (data.success) {
        setDepartments(data.departments);
      }
    } catch (err) {
      setError('Failed to fetch departments');
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

    try {
      const { data } = await api.post('/departments', form);
      if (data.success) {
        setSuccess('Department created successfully!');
        setModalOpen(false);
        setForm({ name: '', description: '', icon: 'StethoscopeIcon' });
        fetchDepartments();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create department');
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
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Manage Departments</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage clinical departments and specializations.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl shadow-sm text-sm flex items-center space-x-2 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Department</span>
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

      {/* Department Grid Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => (
          <div key={dept._id} className="card flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 flex items-center justify-center rounded-xl font-bold">
                {dept.icon === 'HeartIcon' && '❤️'}
                {dept.icon === 'BrainIcon' && '🧠'}
                {dept.icon === 'BabyIcon' && '👶'}
                {dept.icon === 'BoneIcon' && '🦴'}
                {dept.icon === 'StethoscopeIcon' && '🩺'}
              </div>
              <h3 className="text-lg font-bold text-gray-950 dark:text-white">{dept.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">{dept.description}</p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs">
              <span className="text-gray-400">Slug: {dept.slug}</span>
              <span className="bg-primary-100 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 font-semibold px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Department Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-950 dark:text-white">Create New Department</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Department Name</label>
                <input type="text" name="name" required value={form.name} onChange={handleInput} className="mt-1 input-field" placeholder="e.g. Pediatrics" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Description</label>
                <textarea name="description" required value={form.description} onChange={handleInput} className="mt-1 input-field h-24" placeholder="Briefly describe the department services..."></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Icon Category</label>
                <select name="icon" value={form.icon} onChange={handleInput} className="mt-1 input-field">
                  <option value="HeartIcon">Heart / Cardiology</option>
                  <option value="BrainIcon">Brain / Neurology</option>
                  <option value="BabyIcon">Child / Pediatrics</option>
                  <option value="BoneIcon">Bone / Orthopedics</option>
                  <option value="StethoscopeIcon">General / Stethoscope</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageDepartments;
