import { useState, useEffect } from 'react';
import api from '../../services/api';

function AdminBloodBank() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editGroup, setEditGroup] = useState(null);
  const [editUnits, setEditUnits] = useState(0);
  const [success, setSuccess] = useState('');

  const allGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      const { data } = await api.get('/inventory/blood');
      if (data.success) {
        setStock(data.stock);
      }
    } catch (err) {
      console.error('Failed to load blood stock');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put('/inventory/blood', { bloodGroup: editGroup, units: Number(editUnits) });
      setSuccess(`${editGroup} updated to ${editUnits} units`);
      setEditGroup(null);
      fetchStock();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to update');
    }
  };

  const getUnits = (group) => {
    const found = stock.find((s) => s.bloodGroup === group);
    return found ? found.units : 0;
  };

  const getBarColor = (units) => {
    if (units >= 20) return 'bg-emerald-500';
    if (units >= 10) return 'bg-yellow-500';
    if (units > 0) return 'bg-orange-500';
    return 'bg-red-500';
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
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">🩸 Blood Bank</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage blood group stock levels across the hospital.</p>
      </div>

      {success && (
        <div className="p-3 text-sm text-green-700 bg-green-50 dark:bg-green-950/20 dark:text-green-400 rounded-xl">
          {success}
        </div>
      )}

      {/* Blood Group Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {allGroups.map((group) => {
          const units = getUnits(group);
          const maxUnits = 50;
          const barWidth = Math.min((units / maxUnits) * 100, 100);

          return (
            <div
              key={group}
              onClick={() => { setEditGroup(group); setEditUnits(units); }}
              className="card cursor-pointer hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-extrabold text-red-600 dark:text-red-400">{group}</span>
                <span className="text-xs text-gray-400 group-hover:text-primary-500 transition-colors">Edit</span>
              </div>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">{units}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">units available</p>

              {/* Mini bar chart */}
              <div className="mt-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${getBarColor(units)}`}
                  style={{ width: `${barWidth}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editGroup && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Update <span className="text-red-600">{editGroup}</span> Stock
            </h2>
            <form onSubmit={handleUpdate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Units Available</label>
                <input
                  type="number"
                  min="0"
                  value={editUnits}
                  onChange={(e) => setEditUnits(e.target.value)}
                  className="mt-1 input-field"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setEditGroup(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-medium">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-medium">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBloodBank;
