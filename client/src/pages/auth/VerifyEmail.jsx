import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      verify();
    } else {
      setStatus('error');
      setMessage('Verification token is missing from link.');
    }
  }, [token]);

  const verify = async () => {
    try {
      const { data } = await api.get(`/auth/verify-email?token=${token}`);
      if (data.success) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Verification link is invalid or expired.');
    }
  };

  return (
    <div className="text-center space-y-6">
      {status === 'verifying' && (
        <div className="space-y-4">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400">Verifying your email address, please wait...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-700 dark:text-green-400 font-semibold">{message}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Your account is active. You can now login.</p>
          <Link
            to="/login"
            className="inline-block px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-all"
          >
            Go to Login
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-red-700 dark:text-red-400 font-semibold">{message}</p>
          <Link
            to="/login"
            className="inline-block text-primary-600 hover:underline"
          >
            Back to Login
          </Link>
        </div>
      )}
    </div>
  );
}

export default VerifyEmail;
