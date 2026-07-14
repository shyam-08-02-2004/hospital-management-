import { useState, useEffect } from 'react';
import api from '../../services/api';

function MedicalRecords() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Report Upload state
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [reportType, setReportType] = useState('lab_result');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const [resPres, resRep] = await Promise.all([
        api.get('/prescriptions'),
        api.get('/reports')
      ]);
      if (resPres.data.success) setPrescriptions(resPres.data.prescriptions);
      if (resRep.data.success) setReports(resRep.data.reports);
    } catch (err) {
      setError('Failed to fetch medical documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF or Image file');
      return;
    }

    setError('');
    setSuccess('');
    setUploading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('reportType', reportType);
    formData.append('notes', notes);
    formData.append('file', file);

    try {
      const { data } = await api.post('/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (data.success) {
        setSuccess('Medical report uploaded successfully!');
        setModalOpen(false);
        setTitle('');
        setReportType('lab_result');
        setNotes('');
        setFile(null);
        fetchRecords();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    
    setError('');
    setSuccess('');
    try {
      const { data } = await api.delete(`/reports/${id}`);
      if (data.success) {
        setSuccess('Medical report deleted successfully');
        fetchRecords();
      }
    } catch (err) {
      setError('Failed to delete report');
    }
  };

  const resolveUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    // Serve from server port 5000 fallback
    return `http://localhost:5000${path}`;
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Medical Records</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">View prescriptions and upload lab results / reports.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl shadow-sm text-sm flex items-center space-x-2 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span>Upload Report</span>
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

      {/* Split grid: Prescriptions (left) & Uploaded Reports (right) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Prescriptions List */}
        <div className="card space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Prescriptions</h2>
          
          <div className="space-y-4">
            {prescriptions.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">No prescriptions found.</p>
            ) : (
              prescriptions.map((pres) => (
                <div key={pres._id} className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800 flex justify-between items-start gap-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">Diagnosis: {pres.diagnosis}</h3>
                    <p className="text-xs text-gray-500">Prescribed by: Dr. {pres.doctor?.user?.name || 'Deleted'}</p>
                    <p className="text-xs text-gray-500">Date: {new Date(pres.createdAt).toLocaleDateString()}</p>
                    
                    <div className="pt-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Medicines</span>
                      <ul className="text-xs list-disc pl-4 mt-1 text-gray-600 dark:text-gray-400 space-y-1">
                        {pres.medicines?.map((med, i) => (
                          <li key={i}>
                            <strong>{med.name}</strong> - {med.dosage} ({med.frequency}, {med.duration})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {pres.pdfUrl && (
                    <a
                      href={resolveUrl(pres.pdfUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-primary-100 dark:bg-primary-950/30 text-primary-750 dark:text-primary-300 font-semibold rounded-xl text-xs flex items-center space-x-1.5 hover:bg-primary-200"
                    >
                      <span>📥</span>
                      <span>PDF</span>
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Uploaded Reports List */}
        <div className="card space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Uploaded Medical Reports</h2>

          <div className="space-y-4">
            {reports.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">No reports uploaded yet.</p>
            ) : (
              reports.map((rep) => (
                <div key={rep._id} className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800 flex justify-between items-start gap-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">{rep.title}</h3>
                    <p className="text-xs text-gray-550 dark:text-gray-400 capitalize bg-primary-50 dark:bg-primary-950/20 px-2 py-0.5 rounded-full w-fit">
                      {rep.reportType.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-gray-500">Uploaded on: {new Date(rep.createdAt).toLocaleDateString()}</p>
                    {rep.notes && <p className="text-xs text-gray-500 italic mt-2">Notes: {rep.notes}</p>}
                  </div>
                  
                  <div className="flex space-x-2">
                    <a
                      href={resolveUrl(rep.file?.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-xs flex items-center space-x-1"
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleDeleteReport(rep._id)}
                      className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1.5"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-950 dark:text-white">Upload Medical Document</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Document Title</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 input-field" placeholder="e.g. Chest X-Ray Report" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Report Type</label>
                <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="mt-1 input-field">
                  <option value="lab_result">Lab Result</option>
                  <option value="scan">MRI / CT Scan</option>
                  <option value="xray">X-Ray</option>
                  <option value="discharge_summary">Discharge Summary</option>
                  <option value="prescription_scan">Prescription Scan</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Description / Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 input-field h-20" placeholder="e.g. Normal values, consult doctor..."></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Select File (PDF or Image)</label>
                <input type="file" required onChange={handleFileChange} className="mt-1 block w-full text-xs text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 dark:file:bg-primary-950 file:text-primary-750 hover:file:bg-primary-100" />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" disabled={uploading} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium">
                  {uploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MedicalRecords;
