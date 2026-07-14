import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';

function PrescriptionEditor() {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('aptId');
  const patientId = searchParams.get('patId');
  const navigate = useNavigate();

  const [patientName, setPatientName] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [medicines, setMedicines] = useState([
    { name: '', dosage: '', frequency: '1-0-1', duration: '5 days', instructions: 'After food' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (patientId) {
      fetchPatient();
    }
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      const { data } = await api.get(`/patients/${patientId}`);
      if (data.success) {
        setPatientName(data.patient?.user?.name || '');
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '1-0-1', duration: '5 days', instructions: 'After food' }]);
  };

  const removeMedicine = (index) => {
    if (medicines.length === 1) return;
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      appointmentId,
      patientId,
      diagnosis,
      symptoms: symptoms.split(',').map(s => s.trim()).filter(Boolean),
      medicines,
      advice,
      followUpDate: followUpDate || undefined,
    };

    try {
      const { data } = await api.post('/prescriptions', payload);
      if (data.success) {
        navigate('/doctor');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Write Prescription</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Prescribing clinical medications for patient: <strong className="text-primary-600">{patientName}</strong></p>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Diagnosis & Symptoms Card */}
        <div className="card space-y-4">
          <h2 className="text-lg font-bold text-gray-950 dark:text-white">Clinical Summary</h2>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase">Diagnosis / Assessment</label>
              <textarea
                required
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="mt-1 input-field h-20"
                placeholder="e.g. Acute bronchitis, check for lung congestion."
              ></textarea>
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase">Symptoms (comma-separated)</label>
              <input
                type="text"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="mt-1 input-field"
                placeholder="e.g. Fever, persistent dry cough, fatigue"
              />
            </div>
          </div>
        </div>

        {/* Medicines Card */}
        <div className="card space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-950 dark:text-white">Prescribed Medicines</h2>
            <button
              type="button"
              onClick={addMedicine}
              className="px-3 py-1.5 bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-semibold rounded-xl text-xs hover:bg-primary-200"
            >
              + Add Medicine
            </button>
          </div>

          <div className="space-y-3">
            {medicines.map((med, index) => (
              <div key={index} className="flex flex-wrap items-center gap-3 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Medicine Name</label>
                  <input
                    type="text"
                    required
                    value={med.name}
                    onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                    className="mt-0.5 input-field py-1.5"
                    placeholder="Amoxicillin 500mg"
                  />
                </div>
                <div className="w-24">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Dosage</label>
                  <input
                    type="text"
                    required
                    value={med.dosage}
                    onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                    className="mt-0.5 input-field py-1.5"
                    placeholder="1 tablet"
                  />
                </div>
                <div className="w-32">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Frequency</label>
                  <input
                    type="text"
                    required
                    value={med.frequency}
                    onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                    className="mt-0.5 input-field py-1.5"
                    placeholder="1-0-1 (Twice daily)"
                  />
                </div>
                <div className="w-28">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Duration</label>
                  <input
                    type="text"
                    required
                    value={med.duration}
                    onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                    className="mt-0.5 input-field py-1.5"
                    placeholder="5 days"
                  />
                </div>
                <div className="w-40">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Instructions</label>
                  <input
                    type="text"
                    value={med.instructions}
                    onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                    className="mt-0.5 input-field py-1.5"
                    placeholder="After meals"
                  />
                </div>
                
                {medicines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedicine(index)}
                    className="text-red-500 hover:text-red-700 text-sm font-semibold mt-4 ml-auto"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Advice & Follow Up Card */}
        <div className="card space-y-4">
          <h2 className="text-lg font-bold text-gray-950 dark:text-white">Recommendations</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase">Diet / General Advice</label>
              <textarea
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                className="mt-1 input-field h-20"
                placeholder="e.g. Drink plenty of warm fluids, rest for 3 days."
              ></textarea>
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase">Follow-up Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="mt-1 input-field"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/doctor')}
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all"
          >
            {loading ? 'Submitting & Signing...' : 'Finalize & Sign PDF'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PrescriptionEditor;
