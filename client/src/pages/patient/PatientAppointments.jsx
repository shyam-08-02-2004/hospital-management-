import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import paymentQr from '../../assets/payment_qr.jpg';

function PatientAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modals/Dialogs
  const [cancelId, setCancelId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleApt, setRescheduleApt] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  
  // Simulated Checkout Modal State
  const [checkoutOrder, setCheckoutOrder] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data } = await api.get('/appointments');
      if (data.success) {
        setAppointments(data.appointments);
      }
    } catch (err) {
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (e) => {
    e.preventDefault();
    if (!cancelId) return;

    setError('');
    setSuccess('');
    try {
      const { data } = await api.put(`/appointments/${cancelId}/cancel`, { cancellationReason: cancelReason });
      if (data.success) {
        setSuccess('Appointment cancelled successfully');
        setCancelId(null);
        setCancelReason('');
        fetchAppointments();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleApt) return;

    setError('');
    setSuccess('');
    try {
      const { data } = await api.put(`/appointments/${rescheduleApt._id}/reschedule`, {
        date: rescheduleDate,
        startTime: rescheduleTime,
      });
      if (data.success) {
        setSuccess('Appointment rescheduled successfully');
        setRescheduleApt(null);
        setRescheduleDate('');
        setRescheduleTime('');
        fetchAppointments();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reschedule appointment');
    }
  };

  // Payment Integration (Razorpay with Simulation Bypassing)
  const handlePayment = async (aptId) => {
    setError('');
    setPaymentLoading(true);
    try {
      const { data } = await api.post('/payments/initiate', { appointmentId: aptId });
      if (data.success) {
        const { order } = data;
        
        if (order.id.startsWith('order_sim_')) {
          // Open Simulated Checkout Modal
          setCheckoutOrder(order);
        } else {
          // Real Razorpay SDK injection
          loadRazorpayCheckout(order);
        }
      }
    } catch (err) {
      setError('Failed to initiate payment');
      setPaymentLoading(false);
    }
  };

  const loadRazorpayCheckout = (order) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder_key_id',
        amount: order.amount,
        currency: order.currency,
        name: 'HMS Healthcare',
        description: 'Consultation Fee Payment',
        order_id: order.id,
        handler: async (response) => {
          try {
            const confirmRes = await api.post('/payments/confirm', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            if (confirmRes.data.success) {
              setSuccess('Payment processed successfully!');
              fetchAppointments();
            }
          } catch (err) {
            setError('Payment verification failed');
          } finally {
            setPaymentLoading(false);
          }
        },
        prefill: {
          name: '',
          email: '',
        },
        theme: {
          color: '#0d9488',
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    };
    document.body.appendChild(script);
  };

  const confirmSimulatedPayment = async () => {
    if (!checkoutOrder) return;
    try {
      const { data } = await api.post('/payments/confirm', {
        razorpayOrderId: checkoutOrder.id,
        razorpayPaymentId: `pay_sim_${Math.random().toString(36).substring(2, 9)}`,
        razorpaySignature: 'sig_sim_bypass_verification',
      });
      if (data.success) {
        setSuccess('Simulated Payment completed successfully!');
        setCheckoutOrder(null);
        fetchAppointments();
      }
    } catch (err) {
      setError('Failed to confirm simulated payment');
    } finally {
      setPaymentLoading(false);
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
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">My Appointments</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">View appointment logs, make payments, and manage reschedules.</p>
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

      {/* Appointments List - Mobile Cards */}
      <div className="space-y-4 sm:hidden">
        {appointments.length === 0 ? (
          <div className="card text-center py-8 text-gray-400">No appointments scheduled yet.</div>
        ) : (
          appointments.map((apt) => (
            <div key={apt._id} className="card space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">Dr. {apt.doctor?.user?.name || 'Deleted'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{apt.department?.name || 'N/A'}</p>
                </div>
                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full capitalize flex-shrink-0 ${
                  apt.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400' :
                  apt.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400' :
                  apt.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400'
                }`}>
                  {apt.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>📅 {new Date(apt.date).toLocaleDateString()} at {apt.startTime}</span>
                <span className="font-semibold text-gray-900 dark:text-white">₹{apt.consultationFee}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                  apt.isPaid ? 'bg-green-100 text-green-800 dark:bg-green-950/20' : 'bg-red-100 text-red-800 dark:bg-red-950/20'
                }`}>
                  {apt.isPaid ? '✓ Paid' : 'Unpaid'}
                </span>
                <div className="flex items-center gap-3">
                  {!apt.isPaid && apt.status !== 'cancelled' && (
                    <button onClick={() => handlePayment(apt._id)} disabled={paymentLoading} className="text-xs font-bold text-emerald-600 disabled:opacity-50">Pay Now</button>
                  )}
                  {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                    <>
                      {apt.status === 'confirmed' && (
                        <button onClick={() => navigate(`/video-call/${apt._id}`)} className="text-xs font-bold text-blue-600">Join Call</button>
                      )}
                      <button onClick={() => { setRescheduleApt(apt); setRescheduleDate(new Date(apt.date).toISOString().split('T')[0]); }} className="text-xs text-primary-600">Reschedule</button>
                      <button onClick={() => setCancelId(apt._id)} className="text-xs text-red-500 font-semibold">Cancel</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Appointments Table - Desktop */}
      <div className="card overflow-x-auto hidden sm:block">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th className="pb-3">Doctor</th>
              <th className="pb-3">Dept</th>
              <th className="pb-3">Date / Time</th>
              <th className="pb-3">Fee</th>
              <th className="pb-3">Payment</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400">No appointments scheduled yet.</td>
              </tr>
            ) : (
              appointments.map((apt) => (
                <tr key={apt._id} className="text-gray-700 dark:text-gray-300">
                  <td className="py-3 font-semibold text-gray-900 dark:text-white">Dr. {apt.doctor?.user?.name || 'Deleted'}</td>
                  <td className="py-3">{apt.department?.name || 'N/A'}</td>
                  <td className="py-3">{new Date(apt.date).toLocaleDateString()} at {apt.startTime}</td>
                  <td className="py-3">₹{apt.consultationFee}</td>
                  <td className="py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${apt.isPaid ? 'bg-green-100 text-green-800 dark:bg-green-950/20' : 'bg-red-100 text-red-800 dark:bg-red-950/20'}`}>
                      {apt.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td className="py-3 capitalize">
                    <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                      apt.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400' :
                      apt.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400' :
                      apt.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400'
                    }`}>{apt.status}</span>
                  </td>
                  <td className="py-3 text-right space-x-3">
                    {!apt.isPaid && apt.status !== 'cancelled' && (
                      <button onClick={() => handlePayment(apt._id)} disabled={paymentLoading} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 disabled:opacity-50">Pay Now</button>
                    )}
                    {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                      <>
                        {apt.status === 'confirmed' && (
                          <button onClick={() => navigate(`/video-call/${apt._id}`)} className="text-xs font-bold text-blue-600 hover:text-blue-700 mr-3">Join Call</button>
                        )}
                        <button onClick={() => { setRescheduleApt(apt); setRescheduleDate(new Date(apt.date).toISOString().split('T')[0]); }} className="text-xs text-primary-600 hover:underline">Reschedule</button>
                        <button onClick={() => setCancelId(apt._id)} className="text-xs text-red-500 hover:underline font-semibold">Cancel</button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reschedule Modal */}
      {rescheduleApt && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="text-lg font-bold text-gray-950 dark:text-white">Reschedule Appointment</h2>
            
            <form onSubmit={handleReschedule} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">New Date</label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="mt-1 input-field"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">New Time (HH:MM)</label>
                <input
                  type="text"
                  required
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="mt-1 input-field"
                  placeholder="e.g. 10:00"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setRescheduleApt(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-medium">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-primary-650 hover:bg-primary-700 text-white rounded-xl text-xs font-medium">Reschedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="text-lg font-bold text-gray-950 dark:text-white">Cancel Appointment</h2>
            
            <form onSubmit={handleCancel} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Reason for Cancellation</label>
                <textarea
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="mt-1 input-field h-20"
                  placeholder="Describe reason..."
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setCancelId(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-medium">Keep Booking</button>
                <button type="submit" className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-medium">Confirm Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulated Billing Gate Checkout Modal */}
      {checkoutOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-xl border border-emerald-100/50 dark:border-emerald-900/10 overflow-hidden">
            <div className="bg-emerald-600 px-6 py-4 text-white text-center">
              <h2 className="text-lg font-bold">Secure UPI Payment Gateway</h2>
              <p className="text-xs opacity-90 mt-0.5">Scan QR & Confirm Transaction</p>
            </div>
            
            <div className="p-6 space-y-4 text-sm">
              <div className="space-y-1 text-center">
                <p className="text-gray-400 text-xs font-semibold uppercase">Amount to Pay</p>
                <p className="text-3xl font-extrabold text-gray-900 dark:text-white">₹{checkoutOrder.amount / 100}</p>
                <p className="text-xs text-gray-500">Order ID: {checkoutOrder.id}</p>
              </div>

              {/* QR Image Display */}
              <div className="flex flex-col items-center justify-center space-y-2 py-2 border-y border-gray-100 dark:border-gray-800">
                <img
                  src={paymentQr}
                  alt="Payment QR Code"
                  className="w-48 h-48 object-contain rounded-lg border border-gray-200 dark:border-gray-700 bg-white p-1.5"
                />
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  UPI ID: <code className="bg-gray-100 dark:bg-gray-850 px-1.5 py-0.5 rounded font-mono font-semibold text-primary-650">babu66655@ibl</code>
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl space-y-2 border border-gray-100 dark:border-gray-850">
                <div className="flex justify-between"><span className="text-gray-500">Currency:</span><span className="font-semibold text-gray-800 dark:text-white">{checkoutOrder.currency}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Status:</span><span className="font-semibold text-emerald-600">Created</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Method:</span><span className="font-semibold text-indigo-600 dark:text-indigo-400">PhonePe QR / UPI</span></div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCheckoutOrder(null)}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-xs text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmSimulatedPayment}
                  className="flex-1 py-2.5 bg-emerald-650 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs text-center"
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientAppointments;
