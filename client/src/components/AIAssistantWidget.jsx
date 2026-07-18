import { useState } from 'react';
import api from '../services/api';

const AIAssistantWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) return;

    setLoading(true);
    setError('');
    setResponse(null);

    try {
      const { data } = await api.post('/ai/symptom-check', { symptoms });
      if (data.success) {
        setResponse(data.recommendation);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze symptoms. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-xl flex items-center justify-center transform transition-transform hover:scale-105"
          title="AI Health Assistant"
        >
          <span className="text-2xl">🤖</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white dark:bg-gray-900 w-80 sm:w-96 rounded-2xl shadow-2xl border border-gray-150 dark:border-gray-800 overflow-hidden flex flex-col h-[500px]">
          {/* Header */}
          <div className="bg-primary-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🤖</span>
              <h3 className="font-bold">AI Health Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-950 space-y-4">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Hi! Describe your symptoms, and I'll suggest the best department to book an appointment with.
              </p>
            </div>

            {symptoms && response && (
              <div className="flex justify-end">
                <div className="bg-primary-600 text-white p-3 rounded-xl rounded-tr-none shadow-sm max-w-[85%]">
                  <p className="text-sm">{symptoms}</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex space-x-2 justify-start items-center p-2">
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce delay-150"></div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-3 rounded-xl">
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {response && (
              <div className="bg-white dark:bg-gray-800 p-3 rounded-xl rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-sm space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase">Recommended Department</p>
                <p className="font-bold text-primary-600 dark:text-primary-400 text-lg">{response.departmentName}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{response.reason}</p>
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">First Aid Advice</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{response.firstAidAdvice}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-150 dark:border-gray-800">
            <form onSubmit={handleCheck} className="flex space-x-2">
              <input
                type="text"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="e.g., Severe headache and fever"
                className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!symptoms.trim() || loading}
                className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl px-4 py-2 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistantWidget;
