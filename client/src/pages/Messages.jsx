import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';

function Messages() {
  const { user } = useSelector((state) => state.auth);
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef(null);

  // Fetch contacts initially
  useEffect(() => {
    fetchContacts();
  }, []);

  // Poll for messages when a contact is selected
  useEffect(() => {
    let interval;
    if (selectedContact) {
      fetchMessages(selectedContact._id);
      interval = setInterval(() => {
        fetchMessages(selectedContact._id);
      }, 5000); // Poll every 5s
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedContact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchContacts = async () => {
    try {
      const { data } = await api.get('/messages/contacts');
      if (data.success) {
        setContacts(data.contacts);
      }
    } catch (err) {
      console.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const { data } = await api.get(`/messages/${userId}`);
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to fetch messages');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;

    try {
      const { data } = await api.post('/messages', {
        receiverId: selectedContact._id,
        text: newMessage,
      });
      if (data.success) {
        setMessages([...messages, data.message]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Failed to send message');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex overflow-hidden">
      
      {/* Sidebar - Contacts */}
      <div className={`w-full md:w-80 border-r border-gray-100 dark:border-gray-800 flex flex-col ${selectedContact ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No chat history. Book an appointment to chat with a doctor.
            </div>
          ) : (
            contacts.map((contact) => (
              <div
                key={contact._id}
                onClick={() => setSelectedContact(contact)}
                className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-50 dark:border-gray-800 flex items-center space-x-3 transition-colors ${selectedContact?._id === contact._id ? 'bg-primary-50 dark:bg-primary-950/30' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center font-bold text-primary-700 dark:text-primary-300 flex-shrink-0">
                  {contact.avatar?.url ? (
                    <img src={contact.avatar.url} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    contact.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{contact.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{contact.role}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedContact ? 'hidden md:flex' : 'flex'}`}>
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center space-x-3 bg-white dark:bg-gray-900 shadow-sm z-10">
              <button 
                className="md:hidden text-gray-500"
                onClick={() => setSelectedContact(null)}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center font-bold text-primary-700 dark:text-primary-300 flex-shrink-0">
                {selectedContact.avatar?.url ? (
                  <img src={selectedContact.avatar.url} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  selectedContact.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedContact.name}</p>
                <p className="text-xs text-emerald-500">Available (Polling)</p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50 dark:bg-gray-950 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <svg className="w-12 h-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm">Start the conversation</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender === user._id;
                  return (
                    <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        isMine 
                          ? 'bg-primary-600 text-white rounded-br-none' 
                          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-gray-700'
                      }`}>
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-200' : 'text-gray-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
              <form onSubmit={sendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 dark:bg-gray-950">
            <svg className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm font-medium">Select a contact to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;
