import { useState, useEffect } from 'react';
import api from '../../services/api';

function ManageAvailability() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Weekly slots state
  const [slots, setSlots] = useState([]);
  
  // Blocked Date Form
  const [blockDate, setBlockDate] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/auth/me');
      if (data.success && data.profile) {
        setProfile(data.profile);
        setSlots(data.profile.availability || []);
      }
    } catch (err) {
      setError('Failed to fetch doctor profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotChange = (index, field, value) => {
    const updated = [...slots];
    updated[index][field] = value;
    setSlots(updated);
  };

  const addSlot = () => {
    setSlots([...slots, { day: 'monday', startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 }]);
  };

  const removeSlot = (index) => {
    const updated = slots.filter((_, i) => i !== index);
    setSlots(updated);
  };

  const saveAvailability = async () => {
    setError('');
    setSuccess('');
    try {
      const { data } = await api.put('/doctors/profile', { availability: slots });
      if (data.success) {
        setSuccess('Weekly consultation slots updated successfully!');
        fetchProfile();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save availability');
    }
  };

  const blockCalendarDate = async (e) => {
    e.preventDefault();
    if (!blockDate) return;
    
    setError('');
    setSuccess('');

    const newBlocked = [...(profile.blockedDates || []), new Date(blockDate)];

    try {
      const { data } = await api.put('/doctors/profile', { blockedDates: newBlocked });
      if (data.success) {
        setSuccess(`Blocked leave scheduled for ${new Date(blockDate).toLocaleDateString()}`);
        setBlockDate('');
        fetchProfile();
      }
    } catch (err) {
      setError('Failed to schedule block date');
    }
  };

  const unblockDate = async (dateToRemove) => {
    setError('');
    setSuccess('');
    
    const newBlocked = profile.blockedDates.filter(d => new Date(d).getTime() !== new Date(dateToRemove).getTime());

    try {
      const { data } = await api.put('/doctors/profile', { blockedDates: newBlocked });
      if (data.success) {
        setSuccess('Leave date removed successfully.');
        fetchProfile();
      }
    } catch (err) {
      setError('Failed to remove block date');
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Manage Availability</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Configure weekly consulting hours and schedule leaves/block dates.</p>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Weekly Consultation Slots */}
        <div className="card lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Weekly Consulting Hours</h2>
            <button
              onClick={addSlot}
              className="px-3 py-1.5 bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-semibold rounded-xl text-xs hover:bg-primary-200"
            >
              + Add Slot
            </button>
          </div>

          <div className="space-y-4">
            {slots.length === 0 ? (
              <p className="text-gray-400 text-sm py-4">No consulting slots added yet.</p>
            ) : (
              slots.map((slot, index) => (
                <div key={index} className="flex flex-wrap items-center gap-3 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="w-32">
                    <select
                      value={slot.day}
                      onChange={(e) => handleSlotChange(index, 'day', e.target.value)}
                      className="input-field py-1.5"
                    >
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(d => (
                        <option key={d} value={d} className="capitalize">{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => handleSlotChange(index, 'startTime', e.target.value)}
                      className="input-field py-1.5"
                    />
                  </div>
                  <span className="text-gray-400">to</span>
                  <div>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => handleSlotChange(index, 'endTime', e.target.value)}
                      className="input-field py-1.5"
                    />
                  </div>
                  
                  <button
                    onClick={() => removeSlot(index)}
                    className="text-red-500 hover:text-red-700 text-sm font-semibold ml-auto"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
            <button
              onClick={saveAvailability}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-all"
            >
              Save Consulting Slots
            </button>
          </div>
        </div>

        {/* Leaves & Block Dates */}
        <div className="card space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Leaves / Block Dates</h2>
          
          <form onSubmit={blockCalendarDate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Select Date to Block</label>
              <input
                type="date"
                required
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                className="mt-1 input-field"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-gray-900 dark:bg-gray-800 text-white rounded-xl text-xs font-medium"
            >
              Block Calendar Date
            </button>
          </form>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
            <span className="text-xs font-semibold text-gray-500 uppercase">Scheduled Leaves</span>
            
            {profile.blockedDates?.length === 0 ? (
              <p className="text-xs text-gray-400">No leaves scheduled.</p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-2">
                {profile.blockedDates?.map((dateStr) => (
                  <div key={dateStr} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-xl text-xs">
                    <span className="text-gray-700 dark:text-gray-300 font-semibold">{new Date(dateStr).toLocaleDateString()}</span>
                    <button
                      onClick={() => unblockDate(dateStr)}
                      className="text-red-500 hover:text-red-700 font-semibold"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManageAvailability;
