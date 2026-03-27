import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Dashboard from './components/Dashboard';

function App() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
        const response = await axios.post('https://telegrambot.myworkonline.in/admin/login', {        username,
        password
      });
      const receivedToken = response.data.token;
      localStorage.setItem('adminToken', receivedToken);
      setToken(receivedToken);
    } catch (err) {
      setError('Invalid Username or Password');
    }
  };

  // Agar token hai, toh seedha Dashboard dikhao
  if (token) {
    return <Dashboard token={token} onLogout={handleLogout} />;
  }

  // Warna Login Screen dikhao
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Admin Login</h2>
        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Username</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input 
              type="password" 
              className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;