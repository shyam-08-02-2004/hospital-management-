import { useState, useEffect } from 'react';
import api from '../../services/api';

function AdminPharmacy() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Form state
  const [form, setForm] = useState({ name: '', category: '', stock: '', price: '', expiryDate: '' });

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const { data } = await api.get('/inventory/medicines');
      if (data.success) {
        setMedicines(data.medicines);
      }
    } catch (err) {
      console.error('Failed to load medicines');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/inventory/medicines', {
        ...form,
        stock: Number(form.stock),
        price: Number(form.price),
      });
      setSuccess('Medicine added successfully');
      setShowAdd(false);
      setForm({ name: '', category: '', stock: '', price: '', expiryDate: '' });
      fetchMedicines();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add medicine');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.put(`/inventory/medicines/${editItem._id}`, {
        stock: Number(editItem.stock),
        price: Number(editItem.price),
      });
      setSuccess('Stock updated successfully');
      setEditItem(null);
      fetchMedicines();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this medicine?')) return;
    try {
      await api.delete(`/inventory/medicines/${id}`);
      setSuccess('Medicine deleted');
      fetchMedicines();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete');
    }
  };

  const categories = ['Painkiller', 'Antibiotic', 'Antacid', 'Vitamin', 'Antiseptic', 'Cardiovascular', 'Other'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">💊 Pharmacy</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track medicine inventory and stock levels.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium flex items-center space-x-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Medicine</span>
        </button>
      </div>

      {success && (
        <div className="p-3 text-sm text-green-700 bg-green-50 dark:bg-green-950/20 dark:text-green-400 rounded-xl">{success}</div>
      )}
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-xl">{error}</div>
      )}

      {/* Medicines Table */}
      <div className="card overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th className="pb-3">Medicine</th>
              <th className="pb-3">Category</th>
              <th className="pb-3">Stock</th>
              <th className="pb-3">Price (₹)</th>
              <th className="pb-3">Expiry</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-850 text-sm">
            {medicines.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">No medicines in inventory. Add one to get started.</td>
              </tr>
            ) : (
              medicines.map((med) => {
                const isLowStock = med.stock < 10;
                const isExpired = med.expiryDate && new Date(med.expiryDate) < new Date();
                return (
                  <tr key={med._id} className="text-gray-700 dark:text-gray-300">
                    <td className="py-3 font-semibold text-gray-900 dark:text-white">{med.name}</td>
                    <td className="py-3">
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-primary-50 text-primary-700 dark:bg-primary-950/20 dark:text-primary-400">
                        {med.category}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`font-bold ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {med.stock}
                      </span>
                      {isLowStock && <span className="ml-1 text-[10px] text-red-500">LOW</span>}
                    </td>
                    <td className="py-3">₹{med.price}</td>
                    <td className="py-3">
                      {med.expiryDate ? (
                        <span className={isExpired ? 'text-red-600 font-bold' : ''}>
                          {new Date(med.expiryDate).toLocaleDateString()}
                          {isExpired && <span className="ml-1 text-[10px]">EXPIRED</span>}
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td className="py-3 text-right space-x-3">
                      <button
                        onClick={() => setEditItem({ ...med })}
                        className="text-xs text-primary-600 hover:underline font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(med._id)}
                        className="text-xs text-red-500 hover:underline font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Medicine Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add New Medicine</h2>
            <form onSubmit={handleAdd} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Name</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 input-field" placeholder="e.g. Paracetamol 500mg" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 input-field" required>
                  <option value="">Select</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Stock</label>
                  <input type="number" min="0" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="mt-1 input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Price (₹)</label>
                  <input type="number" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1 input-field" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Expiry Date</label>
                <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="mt-1 input-field" />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-medium">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-medium">Add Medicine</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Stock Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit: {editItem.name}</h2>
            <form onSubmit={handleUpdate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Stock</label>
                <input type="number" min="0" value={editItem.stock} onChange={(e) => setEditItem({ ...editItem, stock: e.target.value })} className="mt-1 input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Price (₹)</label>
                <input type="number" min="0" value={editItem.price} onChange={(e) => setEditItem({ ...editItem, price: e.target.value })} className="mt-1 input-field" />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setEditItem(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-medium">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-medium">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPharmacy;
