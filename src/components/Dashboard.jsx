import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Key, Users, Instagram, TrendingUp, Copy, Video, CheckCircle, LogOut, RefreshCw, Archive, Search, Activity, Wallet, ShieldCheck, X } from 'lucide-react';

const getUserRole = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || 'superadmin';
  } catch (e) { return 'moderator'; }
};

const Dashboard = ({ token, onLogout }) => {
  const role = getUserRole(token);
  const isSuperAdmin = role === 'superadmin';

  const [agents, setAgents] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeVideos, setActiveVideos] = useState([]);
  
  const [archivedVideos, setArchivedVideos] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [newToken, setNewToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewsInput, setViewsInput] = useState({});
  const [fetchingViews, setFetchingViews] = useState({});

  // NAYA STATE: History Modal ke liye
  const [historyModal, setHistoryModal] = useState({ isOpen: false, user: null, type: '' });

  const API_BASE_URL = 'https://telegrambot.myworkonline.in';
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  const fetchData = async () => {
    try {
      const activeRes = await axios.get(`${API_BASE_URL}/admin/videos/active`, axiosConfig);
      setActiveVideos(activeRes.data);

      if (isSuperAdmin) {
        const paymentsRes = await axios.get(`${API_BASE_URL}/admin/payments`, axiosConfig);
        setAgents(paymentsRes.data.agentPayments);
        setUsers(paymentsRes.data.userPayments);
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) onLogout();
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const generateToken = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/generate-token`, {}, axiosConfig);
      setNewToken(response.data.token);
    } catch (error) { console.error("Error:", error); }
    setLoading(false);
  };

  const handleViewsChange = (videoId, value) => { setViewsInput(prev => ({ ...prev, [videoId]: value })); };

  const autoFetchViews = async (videoId, url) => {
    setFetchingViews(prev => ({ ...prev, [videoId]: true }));
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/videos/fetch-views`, { url, videoId }, axiosConfig);
      if (response.data.success) {
        alert(`✅ Views Fetched & Saved: ${response.data.views}`);
        fetchData(); 
      }
    } catch (error) { alert('❌ API Error.'); }
    setFetchingViews(prev => ({ ...prev, [videoId]: false }));
  };

  const handleUpdateViews = async (videoId) => {
    const views = viewsInput[videoId];
    if (!views) return alert("Please enter views!");
    try {
      await axios.post(`${API_BASE_URL}/admin/videos/${videoId}/update-views`, { views }, axiosConfig);
      alert("✅ Views saved manually!");
      fetchData(); 
    } catch (error) { console.error("Error:", error); }
  };

  const handleReject = async (videoId) => {
    const reason = window.prompt("⚠️ Rejection Reason (Sent to user on Telegram):");
    if (reason === null) return;
    try {
      await axios.post(`${API_BASE_URL}/admin/videos/${videoId}/reject`, { reason }, axiosConfig);
      alert("✅ Video Rejected & Notified!");
      fetchData(); 
    } catch (error) { console.error("Error:", error); }
  };

  const handleWeeklyReset = async () => {
    if (!window.confirm("Start a fresh week? Ensure all payments are cleared!")) return;
    try {
      await axios.post(`${API_BASE_URL}/admin/videos/archive-all`, {}, axiosConfig);
      alert("✅ Dashboard cleared!");
      fetchData();
    } catch (error) { console.error("Error:", error); }
  };

  const fetchHistory = async () => {
    if (!showHistory) {
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/videos/archived`, axiosConfig);
        setArchivedVideos(res.data);
      } catch (error) { console.error("Error:", error); }
    }
    setShowHistory(!showHistory);
  };

  const filteredHistory = archivedVideos.filter(video => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    const vUser = video.instaUsername.toLowerCase();
    const userProfile = users.find(u => u.username.toLowerCase() === vUser);
    const agentName = userProfile ? userProfile.agentName.toLowerCase() : "";
    return vUser.includes(search) || agentName.includes(search);
  });

  const handleAgentPay = async (agentId) => {
    if (window.confirm("Mark this Agent's pending amount as PAID?")) {
      await axios.post(`${API_BASE_URL}/admin/agents/${agentId}/pay`, {}, axiosConfig);
      fetchData();
    }
  };

  const handleUserPay = async (userId) => {
    if (window.confirm("Mark this User's pending amount as PAID?")) {
      await axios.post(`${API_BASE_URL}/admin/users/${userId}/pay`, {}, axiosConfig);
      fetchData();
    }
  };

  // NAYA FUNCTION: Modal Open/Close ke liye
  const openHistoryModal = (user, type) => setHistoryModal({ isOpen: true, user, type });
  const closeHistoryModal = () => setHistoryModal({ isOpen: false, user: null, type: '' });

  const copyToClipboard = () => { navigator.clipboard.writeText(newToken); alert('Token copied!'); };
  const totalPending = agents.reduce((sum, a) => sum + Number(a.pendingAmount), 0) + users.reduce((sum, u) => sum + Number(u.pendingAmount), 0);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* Top Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
             <TrendingUp className="mr-2 text-blue-600" size={28} />
             <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 hidden sm:block">
                {isSuperAdmin ? "Admin Portal" : "Reviewer Dashboard"}
             </h1>
             <span className={`ml-4 px-3 py-1 text-xs font-bold rounded-full border ${isSuperAdmin ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'} flex items-center`}>
               {isSuperAdmin ? <ShieldCheck size={14} className="mr-1"/> : <Activity size={14} className="mr-1"/>}
               {isSuperAdmin ? 'Super Admin' : 'Staff'}
             </span>
          </div>
          <button onClick={onLogout} className="flex items-center text-gray-500 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-all duration-200 font-medium">
            <LogOut size={18} className="mr-2" /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 relative">
        
        {/* STATS CARDS (Super Admin Only) */}
        {isSuperAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-down">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><Users size={24} /></div>
              <div><p className="text-sm font-medium text-gray-500">Total Agents</p><h3 className="text-2xl font-bold text-gray-800">{agents.length}</h3></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
              <div className="p-3 bg-pink-100 text-pink-600 rounded-xl"><Instagram size={24} /></div>
              <div><p className="text-sm font-medium text-gray-500">Total Creators</p><h3 className="text-2xl font-bold text-gray-800">{users.length}</h3></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Activity size={24} /></div>
              <div><p className="text-sm font-medium text-gray-500">Active Videos</p><h3 className="text-2xl font-bold text-gray-800">{activeVideos.length}</h3></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-xl"><Wallet size={24} /></div>
              <div><p className="text-sm font-medium text-gray-500">Pending Payouts</p><h3 className="text-2xl font-bold text-gray-800">₹{totalPending.toFixed(2)}</h3></div>
            </div>
          </div>
        )}

        {/* TOKEN GENERATION (Super Admin Only) */}
        {isSuperAdmin && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h2 className="text-lg font-bold text-gray-800 flex items-center"><Key className="mr-2 text-yellow-500" size={20} /> Agent Registration Token</h2>
              <p className="text-sm text-gray-500 mt-1">Generate a secure one-time token to onboard new agents.</p>
            </div>
            <div className="flex items-center space-x-3 w-full md:w-auto">
              {newToken && (
                <div className="flex items-center bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg border border-gray-200 flex-1 md:flex-none">
                  <span className="font-mono font-bold tracking-wider mr-3 text-lg">{newToken}</span>
                  <button onClick={copyToClipboard} className="text-gray-400 hover:text-blue-600 transition"><Copy size={18} /></button>
                </div>
              )}
              <button onClick={generateToken} disabled={loading} className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-lg font-medium shadow-md transition-all active:scale-95">
                {loading ? 'Generating...' : 'Generate New Token'}
              </button>
            </div>
          </div>
        )}

        {/* WEEKLY VIDEOS SECTION */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white flex flex-col md:flex-row justify-between items-center">
            <div>
               <h2 className="text-lg font-bold text-blue-900 flex items-center"><Video className="mr-2 text-blue-600" /> Action Hub: Review Videos</h2>
               {!isSuperAdmin && <p className="text-sm text-gray-500 mt-1">Please fetch views or reject fake videos.</p>}
            </div>
            {isSuperAdmin && (
              <button onClick={handleWeeklyReset} className="mt-3 md:mt-0 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center">
                <Archive size={16} className="mr-2"/> End Week & Clear Dashboard
              </button>
            )}
          </div>
          <div className="p-6 bg-gray-50/50">
            {activeVideos.length === 0 ? (
              <div className="text-center py-10">
                <Video size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No videos pending review.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeVideos.map(video => (
                  <div key={video._id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-3">
                      <p className="font-bold text-gray-800 text-lg">@{video.instaUsername}</p>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                        {video.views || 0} Views
                      </span>
                    </div>
                    <a href={video.videoLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 hover:underline text-sm truncate block mb-5 bg-gray-50 p-2 rounded-md">
                      {video.videoLink}
                    </a>
                    
                    <div className="space-y-3">
                      <div className="flex space-x-2">
                        <button onClick={() => autoFetchViews(video._id, video.videoLink)} disabled={fetchingViews[video._id]} className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 py-2.5 rounded-lg flex items-center justify-center font-bold transition">
                          <RefreshCw size={18} className={`mr-2 ${fetchingViews[video._id] ? "animate-spin" : ""}`} />
                          {fetchingViews[video._id] ? "Fetching..." : "Auto Fetch & Save"}
                        </button>
                      </div>
                      <div className="flex space-x-2 pt-2 border-t border-gray-100">
                        <input type="number" placeholder="Manual Views" className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1" onChange={(e) => handleViewsChange(video._id, e.target.value)} />
                        <button onClick={() => handleUpdateViews(video._id)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-lg text-xs font-medium transition">Save</button>
                        <button onClick={() => handleReject(video._id)} className="bg-white hover:bg-red-50 text-red-600 border border-red-200 px-3 rounded-lg text-xs font-medium transition">Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PAYMENTS SECTION (Super Admin Only) */}
        {isSuperAdmin && (
          <div className="grid grid-cols-1 gap-8 mt-8">
            {/* Creators Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center"><div className="p-2 bg-pink-100 text-pink-600 rounded-lg mr-3"><Instagram size={20} /></div><h2 className="text-lg font-bold text-gray-800">Creator Payouts</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                    <tr><th className="px-6 py-4">Username & Agent</th><th className="px-6 py-4">Lifetime Views</th><th className="px-6 py-4">Bank Details</th><th className="px-6 py-4">Earned</th><th className="px-6 py-4">Pending</th><th className="px-6 py-4 text-center">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {users.map((user, index) => {
                      const pendingNum = Number(user.pendingAmount);
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-800 text-base">@{user.username}</p>
                            <p className="text-xs text-gray-400 mt-0.5 mb-1">via {user.agentName}</p>
                            {/* NAYA BUTTON HISTORY MODAL KE LIYE */}
                            <button onClick={() => openHistoryModal(user, 'creator')} className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded transition">
                              View Detailed History
                            </button>
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-700">{user.totalViews.toLocaleString()}</td>
                          <td className="px-6 py-4 font-mono text-gray-500">{user.bankDetails}</td>
                          <td className="px-6 py-4 font-medium text-gray-600">₹{Number(user.totalEarned).toFixed(4)}</td>
                          <td className="px-6 py-4"><span className={`font-bold px-2 py-1 rounded-md ${pendingNum > 0 ? 'text-rose-600 bg-rose-50' : 'text-gray-400'}`}>₹{pendingNum.toFixed(4)}</span></td>
                          <td className="px-6 py-4 text-center">
                            {pendingNum > 0.0001 ? (
                              <button onClick={() => handleUserPay(user.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition active:scale-95">Pay Now</button>
                            ) : (
                              <span className="text-gray-400 text-xs font-medium flex items-center justify-center"><CheckCircle size={14} className="mr-1"/> Cleared</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Agents Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center"><div className="p-2 bg-purple-100 text-purple-600 rounded-lg mr-3"><Users size={20} /></div><h2 className="text-lg font-bold text-gray-800">Agent Payouts</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                    <tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Accounts</th><th className="px-6 py-4">Bank Details</th><th className="px-6 py-4">Earned</th><th className="px-6 py-4">Paid</th><th className="px-6 py-4">Pending</th><th className="px-6 py-4 text-center">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {agents.map((agent, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-bold text-gray-800">{agent.name}</td>
                          <td className="px-6 py-4"><span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-bold">{agent.accountsAdded}</span></td>
                          <td className="px-6 py-4 font-mono text-gray-500">{agent.bankDetails}</td>
                          <td className="px-6 py-4 font-medium text-gray-600">₹{Number(agent.totalEarned).toFixed(2)}</td>
                          <td className="px-6 py-4"><span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-md">₹{Number(agent.paidAmount).toFixed(2)}</span></td>
                          <td className="px-6 py-4"><span className={`font-bold px-2 py-1 rounded-md ${Number(agent.pendingAmount) > 0 ? 'text-rose-600 bg-rose-50' : 'text-gray-400'}`}>₹{Number(agent.pendingAmount).toFixed(2)}</span></td>
                          <td className="px-6 py-4 text-center">{Number(agent.pendingAmount) > 0 ? (<button onClick={() => handleAgentPay(agent.id)} className="bg-gray-900 hover:bg-black text-white px-4 py-1.5 rounded-lg text-xs font-semibold">Mark Paid</button>) : (<span className="text-gray-400 text-xs flex items-center justify-center"><CheckCircle size={14} className="mr-1"/> Cleared</span>)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* --- PREMIUM HISTORY MODAL --- */}
      {historyModal.isOpen && historyModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
              <button onClick={closeHistoryModal} className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition">
                <X size={24} />
              </button>
              <h3 className="text-2xl font-black mb-1">@{historyModal.user.username}</h3>
              <p className="text-blue-100 text-sm font-medium">Payment & View History Log</p>
            </div>

            {/* Modal Body */}
            <div className="p-6 bg-gray-50/50">
              
              <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="text-center">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Lifetime Views</p>
                  <p className="text-xl font-black text-blue-600">{historyModal.user.totalViews.toLocaleString()}</p>
                </div>
                <div className="w-px h-10 bg-gray-200"></div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Paid</p>
                  <p className="text-xl font-black text-emerald-600">₹{Number(historyModal.user.paidAmount).toFixed(4)}</p>
                </div>
              </div>

              <h4 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-2">Past Transactions</h4>
              
              <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
                {(!historyModal.user.paymentHistory || historyModal.user.paymentHistory.length === 0) ? (
                  <div className="text-center py-8 text-gray-400 font-medium bg-white rounded-xl border border-dashed border-gray-200">
                    No payment history found yet.
                  </div>
                ) : (
                  [...historyModal.user.paymentHistory].reverse().map((record, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 transition">
                      <div className="flex items-center">
                        <div className="bg-emerald-100 text-emerald-600 p-2 rounded-full mr-3">
                          <CheckCircle size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">Payment Cleared</p>
                          <p className="text-xs text-gray-500 font-medium">{new Date(record.date).toLocaleString()}</p>
                        </div>
                      </div>
                      <p className="font-black text-emerald-600">₹{Number(record.amount).toFixed(4)}</p>
                    </div>
                  ))
                )}
              </div>
              
              <div className="mt-6">
                <button onClick={closeHistoryModal} className="w-full py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition active:scale-95">
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;