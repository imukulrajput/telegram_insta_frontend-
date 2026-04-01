import React, { useState } from 'react';
import axios from 'axios';
import { ShieldCheck, Activity, User, Lock, ArrowRight, TrendingUp } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('superadmin'); // 'superadmin' or 'staff'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = 'https://telegrambot.myworkonline.in';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/admin/login`, {
        username,
        password
      });

      if (response.data.token) {
        // Login successful, pass token to parent component (App.jsx)
        onLoginSuccess(response.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-sans">
      
      {/* Brand Logo / Title */}
      <div className="mb-8 text-center animate-fade-in-down">
        <div className="flex justify-center items-center mb-3">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg">
            <TrendingUp className="text-white" size={32} />
          </div>
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Portal</h1>
        <p className="text-gray-500 font-medium mt-1">SMM Agency Management</p>
      </div>

      {/* Login Card */}
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Role Toggle Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={() => { setActiveTab('superadmin'); setError(''); }}
            className={`flex-1 py-4 text-sm font-bold flex justify-center items-center transition-all ${
              activeTab === 'superadmin' 
                ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <ShieldCheck size={18} className="mr-2" />
            Super Admin
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('staff'); setError(''); }}
            className={`flex-1 py-4 text-sm font-bold flex justify-center items-center transition-all ${
              activeTab === 'staff' 
                ? 'bg-white text-purple-600 border-b-2 border-purple-600 shadow-sm' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Activity size={18} className="mr-2" />
            Staff / Reviewer
          </button>
        </div>

        {/* Login Form */}
        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {activeTab === 'superadmin' ? 'Admin Login' : 'Staff Login'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {activeTab === 'superadmin' 
                ? 'Full access to payouts, history, and settings.' 
                : 'Access to review videos and fetch views.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-xl text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={activeTab === 'superadmin' ? "Enter admin username" : "Enter staff username"}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition font-medium text-gray-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition font-medium text-gray-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-bold text-white shadow-md flex justify-center items-center transition-all active:scale-95 mt-2 ${
                activeTab === 'superadmin' 
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' 
                  : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200'
              }`}
            >
              {loading ? 'Authenticating...' : (
                <>Sign In <ArrowRight size={18} className="ml-2" /></>
              )}
            </button>
          </form>
        </div>
      </div>
      
    
    </div>
  );
};

export default Login;