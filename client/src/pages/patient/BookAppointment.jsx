import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../services/api';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function BookAppointment() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  
  // Step selections
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [date, setDate] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  
  const { user } = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get('/departments');
      if (data.success) setDepartments(data.departments);
    } catch (err) {
      setError('Failed to load departments');
    }
  };

  const handleDeptSelect = async (dept) => {
    setSelectedDept(dept);
    setSelectedDoc(null);
    setSelectedSlot('');
    setTimeSlots([]);
    
    try {
      const { data } = await api.get(`/doctors?department=${dept._id}`);
      if (data.success) setDoctors(data.doctors);
    } catch (err) {
      setError('Failed to fetch doctors in department');
    }
  };

  const handleDocSelect = (doc) => {
    setSelectedDoc(doc);
    setSelectedSlot('');
    setTimeSlots([]);
  };

  // Generate slots on date change
  useEffect(() => {
    if (selectedDoc && date) {
      generateSlots();
    }
  }, [selectedDoc, date]);

  const generateSlots = () => {
    const appointmentDate = new Date(date);
    const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(appointmentDate).toLowerCase();
    
    // Find availability for this day of the week
    const dayAvailabilities = selectedDoc.availability?.filter(slot => slot.day === weekday);

    if (!dayAvailabilities || dayAvailabilities.length === 0) {
      setTimeSlots([]);
      return;
    }

    const slots = [];
    dayAvailabilities.forEach(slot => {
      const [startH, startM] = slot.startTime.split(':').map(Number);
      const [endH, endM] = slot.endTime.split(':').map(Number);
      const duration = slot.slotDurationMinutes || 30;

      let currentMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;

      while (currentMin < endMin) {
        const h = Math.floor(currentMin / 60).toString().padStart(2, '0');
        const m = (currentMin % 60).toString().padStart(2, '0');
        slots.push(`${h}:${m}`);
        currentMin += duration;
      }
    });

    setTimeSlots(slots);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }

    setError('');
    setLoading(true);

    const payload = {
      doctorId: selectedDoc._id,
      departmentId: selectedDept._id,
      date,
      startTime: selectedSlot,
      reasonForVisit: reason,
    };

    try {
      // 1. Create Appointment
      const { data: aptData } = await api.post('/appointments', payload);
      if (!aptData.success) throw new Error('Failed to create appointment');
      
      const appointmentId = aptData.appointment._id;

      // 2. Load Razorpay script
      setPaymentStatus('Initializing Payment...');
      const res = await loadRazorpayScript();
      if (!res) {
        setError('Razorpay SDK failed to load. Are you online?');
        return;
      }

      // 3. Initiate Order
      const { data: initData } = await api.post('/payments/initiate', { appointmentId });
      if (!initData.success) throw new Error('Failed to initiate payment');
      
      const order = initData.order;

      // If it is a simulated order from backend (fallback)
      if (order.id.startsWith('order_sim_')) {
        setPaymentStatus('Simulating Payment Success...');
        // Simulate immediate confirmation
        await api.post('/payments/confirm', {
          razorpayOrderId: order.id,
          razorpayPaymentId: 'pay_sim_' + Math.random().toString(36).substring(7),
          razorpaySignature: 'sim_signature'
        });
        navigate('/patient/appointments');
        return;
      }

      // 4. Open Razorpay Checkout Modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'placeholder', // Fallback or loaded key
        amount: order.amount,
        currency: order.currency,
        name: 'Hospital Management System',
        description: 'Consultation Fee Payment',
        order_id: order.id,
        handler: async function (response) {
          try {
            setPaymentStatus('Verifying Payment...');
            const { data: confirmData } = await api.post('/payments/confirm', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            if (confirmData.success) {
              navigate('/patient/appointments');
            }
          } catch (err) {
            setError(err.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone,
        },
        theme: {
          color: '#0284c7', // primary-600
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error processing booking.');
    } finally {
      setLoading(false);
      setPaymentStatus('');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Book Appointment</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Complete the steps below to schedule a checkup consultation.</p>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-xl">
          {error}
        </div>
      )}

      {/* STEP 1: Select Department */}
      <div className="card space-y-4">
        <h2 className="text-lg font-bold text-gray-950 dark:text-white">Step 1: Choose Clinic Department</h2>
        <div className="flex flex-wrap gap-3">
          {departments.map((dept) => (
            <button
              key={dept._id}
              onClick={() => handleDeptSelect(dept)}
              type="button"
              className={`px-4 py-3 rounded-xl border font-semibold text-sm transition-all ${
                selectedDept?._id === dept._id
                  ? 'bg-primary-600 text-white border-transparent'
                  : 'bg-white dark:bg-gray-900 border-gray-250 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>
      </div>

      {/* STEP 2: Select Doctor */}
      {selectedDept && (
        <div className="card space-y-4">
          <h2 className="text-lg font-bold text-gray-950 dark:text-white">Step 2: Select Specialist Doctor</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {doctors.length === 0 ? (
              <p className="text-sm text-gray-400">No doctors available in this department.</p>
            ) : (
              doctors.map((doc) => (
                <div
                  key={doc._id}
                  onClick={() => handleDocSelect(doc)}
                  className={`p-4 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                    selectedDoc?._id === doc._id
                      ? 'bg-primary-50/50 dark:bg-primary-950/20 border-primary-550'
                      : 'bg-white dark:bg-gray-900 border-gray-150 dark:border-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <h3 className="font-bold text-gray-905 dark:text-white">Dr. {doc.user?.name}</h3>
                    <p className="text-xs text-gray-550 dark:text-gray-400 capitalize">{doc.specialization}</p>
                    <p className="text-[11px] text-gray-400 mt-2 line-clamp-2">{doc.bio}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs font-semibold">
                    <span className="text-gray-500">Fee: ₹{doc.consultationFee}</span>
                    <span className="text-primary-600 dark:text-primary-400">{doc.experienceYears} Yrs Exp</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* STEP 3 & 4: Date & Slot Selection */}
      {selectedDoc && (
        <div className="card space-y-6">
          <h2 className="text-lg font-bold text-gray-950 dark:text-white">Step 3: Select Date & Time Slot</h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Consultation Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1.5 input-field"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {date && (
              <div className="space-y-3">
                <span className="block text-xs font-semibold text-gray-500 uppercase">Available Time Slots</span>
                {timeSlots.length === 0 ? (
                  <p className="text-xs text-red-500 bg-red-50/50 p-2.5 rounded-xl border border-red-100/50">
                    No consultation sessions scheduled on this weekday. Please choose another date.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-1 text-xs font-bold rounded-xl border text-center transition-all ${
                          selectedSlot === slot
                            ? 'bg-primary-600 text-white border-transparent'
                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 5: Reason & Book */}
      {selectedSlot && (
        <form onSubmit={handleBook} className="card space-y-6">
          <h2 className="text-lg font-bold text-gray-950 dark:text-white">Step 4: Details & Booking Finalization</h2>
          
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase">Reason for Consultation Visit</label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1.5 input-field h-24"
              placeholder="e.g. Regular heart checkup, severe throat pain since yesterday."
            ></textarea>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-sm transition-all"
            >
              {loading ? (paymentStatus || 'Processing Reservation...') : `Confirm Booking (Pay ₹${selectedDoc.consultationFee})`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default BookAppointment;
