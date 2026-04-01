import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Login from './components/Login'; // Naya Premium Login component import kiya

function App() {
  // Local storage se token check kar rahe hain
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');

  // Jab Login.jsx successfully token le aayega, tab ye function chalega
  const handleLoginSuccess = (receivedToken) => {
    localStorage.setItem('adminToken', receivedToken);
    setToken(receivedToken);
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken('');
  };

  // Agar token hai, toh seedha Dashboard dikhao
  if (token) {
    return <Dashboard token={token} onLogout={handleLogout} />;
  }

  // Warna hamara naya Premium Login Screen dikhao
  return <Login onLoginSuccess={handleLoginSuccess} />;
}

export default App;