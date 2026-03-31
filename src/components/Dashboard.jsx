import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Key, Users, Instagram, TrendingUp, Copy, Video, CheckCircle, LogOut, RefreshCw, Archive, Search, Activity, Wallet } from 'lucide-react';

const Dashboard = ({ token, onLogout }) => {
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

  const API_BASE_URL = 'https://telegrambot.myworkonline.in';
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  const fetchData = async () => {
    try {
      const paymentsRes = await axios.get(`${API_BASE_URL}/admin/payments`, axiosConfig);
      setAgents(paymentsRes.data.agentPayments);
      setUsers(paymentsRes.data.userPayments);

      const activeRes = await axios.get(`${API_BASE_URL}/admin/videos/active`, axiosConfig);
      setActiveVideos(activeRes.data);
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) onLogout();
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const generateToken = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/generate-token`, {}, axiosConfig);
      setNewToken(response.data.token);
    } catch (error) { console.error("Error generating token:", error); }
    setLoading(false);
  };

  const handleViewsChange = (videoId, value) => { setViewsInput(prev => ({ ...prev, [videoId]: value })); };

  // NEW: Auto-Fetch now Auto-Saves
  const autoFetchViews = async (videoId, url) => {
    setFetchingViews(prev => ({ ...prev, [videoId]: true }));
    try {
      // API call ab videoId bhi bhej rahi hai taaki backend khud save kar le
      const response = await axios.post(`${API_BASE_URL}/admin/videos/fetch-views`, { url, videoId }, axiosConfig);
      if (response.data.success) {
        alert(`✅ Views Fetched & Auto-Saved: ${response.data.views}`);
        fetchData(); // Dashboard refresh karo taaki naye views dikh jayein
      }
    } catch (error) { alert('❌ Failed to fetch views via API.'); }
    setFetchingViews(prev => ({ ...prev, [videoId]: false }));
  };

  // Manual update (Just in case API fails)
  const handleUpdateViews = async (videoId) => {
    const views = viewsInput[videoId];
    if (views === undefined || views === '') return alert("Please enter views first!");
    try {
      await axios.post(`${API_BASE_URL}/admin/videos/${videoId}/update-views`, { views }, axiosConfig);
      alert("✅ Views saved manually!");
      fetchData(); 
    } catch (error) { console.error("Error updating views:", error); }
  };

  // NEW: Reject with Reason Prompt
  const handleReject = async (videoId) => {
    const reason = window.prompt("⚠️ Rejection Reason (This will be sent to the user on Telegram):");
    if (reason === null) return; // Action cancelled by admin

    try {
      await axios.post(`${API_BASE_URL}/admin/videos/${videoId}/reject`, { reason }, axiosConfig);
      alert("✅ Video Rejected & User Notified!");
      fetchData(); 
    } catch (error) { console.error("Error rejecting video:", error); }
  };

  const handleWeeklyReset = async () => {
    if (!window.confirm("Start a fresh week? Ensure all payments are cleared!")) return;
    try {
      await axios.post(`${API_BASE_URL}/admin/videos/archive-all`, {}, axiosConfig);
      alert("✅ Dashboard cleared for the new week!");
      fetchData();
    } catch (error) { console.error("Error clearing dashboard:", error); }
  };

  const fetchHistory = async () => {
    if (!showHistory) {
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/videos/archived`, axiosConfig);
        setArchivedVideos(res.data);
      } catch (error) { console.error("Error fetching history:", error); }
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

  // View Payment History Alert
  const showPaymentHistory = (history) => {
      if (!history || history.length === 0) {
          alert("No past payments found for this user.");
          return;
      }
      const text = history.map(h => `✅ ₹${h.amount} paid on ${new Date(h.date).toLocaleDateString()}`).join('\n');
      alert(`📜 Payment History:\n\n${text}`);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(newToken);
    alert('Token copied to clipboard! ✅');
  };

  const totalPending = agents.reduce((sum, a) => sum + a.pendingAmount, 0) + users.reduce((sum, u) => sum + u.pendingAmount, 0);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* Top Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center">
            <TrendingUp className="mr-2 text-blue-600" size={28} /> Admin Portal
          </h1>
          <button onClick={onLogout} className="flex items-center text-gray-500 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-all duration-200 font-medium">
            <LogOut size={18} className="mr-2" /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* SUMMARY STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><Users size={24} /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Agents</p>
              <h3 className="text-2xl font-bold text-gray-800">{agents.length}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-pink-100 text-pink-600 rounded-xl"><Instagram size={24} /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Creators</p>
              <h3 className="text-2xl font-bold text-gray-800">{users.length}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Activity size={24} /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Videos</p>
              <h3 className="text-2xl font-bold text-gray-800">{activeVideos.length}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl"><Wallet size={24} /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Payouts</p>
              <h3 className="text-2xl font-bold text-gray-800">₹{totalPending}</h3>
            </div>
          </div>
        </div>

        {/* TOKEN GENERATION */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <Key className="mr-2 text-yellow-500" size={20} /> Agent Registration Token
            </h2>
            <p className="text-sm text-gray-500 mt-1">Generate a secure one-time token to onboard new agents.</p>
          </div>
          <div className="flex items-center space-x-3 w-full md:w-auto">
            {newToken && (
              <div className="flex items-center bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg border border-gray-200 flex-1 md:flex-none">
                <span className="font-mono font-bold tracking-wider mr-3 text-lg">{newToken}</span>
                <button onClick={copyToClipboard} className="text-gray-400 hover:text-blue-600 transition"><Copy size={18} /></button>
              </div>
            )}
            <button 
              onClick={generateToken} disabled={loading} 
              className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-lg font-medium shadow-md transition-all active:scale-95"
            >
              {loading ? 'Generating...' : 'Generate New Token'}
            </button>
          </div>
        </div>

        {/* WEEKLY VIDEOS SECTION */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white flex flex-col md:flex-row justify-between items-center">
            <h2 className="text-lg font-bold text-blue-900 flex items-center">
              <Video className="mr-2 text-blue-600" /> This Week's Active Videos
            </h2>
            <button onClick={handleWeeklyReset} className="mt-3 md:mt-0 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center">
              <Archive size={16} className="mr-2"/> End Week & Clear Dashboard
            </button>
          </div>
          <div className="p-6 bg-gray-50/50">
            {activeVideos.length === 0 ? (
              <div className="text-center py-10">
                <Video size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No active videos for this week.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeVideos.map(video => (
                  <div key={video._id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-3">
                      <p className="font-bold text-gray-800 text-lg">@{video.instaUsername}</p>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                        {video.views || 0} Views Saved
                      </span>
                    </div>
                    <a href={video.videoLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 hover:underline text-sm truncate block mb-5 bg-gray-50 p-2 rounded-md">
                      {video.videoLink}
                    </a>
                    
                    <div className="space-y-3">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => autoFetchViews(video._id, video.videoLink)}
                          disabled={fetchingViews[video._id]}
                          className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 py-2.5 rounded-lg flex items-center justify-center font-bold transition"
                        >
                          <RefreshCw size={18} className={`mr-2 ${fetchingViews[video._id] ? "animate-spin" : ""}`} />
                          {fetchingViews[video._id] ? "Fetching..." : "Auto Fetch & Save"}
                        </button>
                      </div>

                      <div className="flex space-x-2 pt-2 border-t border-gray-100">
                        <input 
                          type="number" 
                          placeholder="Manual Views"
                          className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1"
                          onChange={(e) => handleViewsChange(video._id, e.target.value)}
                        />
                        <button onClick={() => handleUpdateViews(video._id)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-lg text-xs font-medium transition">
                          Save
                        </button>
                        <button onClick={() => handleReject(video._id)} className="bg-white hover:bg-red-50 text-red-600 border border-red-200 px-3 rounded-lg text-xs font-medium transition">
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- DATA TABLES --- */}
        <div className="grid grid-cols-1 gap-8 mt-8">
          
          {/* Agents Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg mr-3"><Users size={20} /></div>
              <h2 className="text-lg font-bold text-gray-800">Agent Payouts</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4 text-center">Accounts</th>
                    <th className="px-6 py-4">Bank Details</th>
                    <th className="px-6 py-4">Earned</th>
                    <th className="px-6 py-4">Paid</th>
                    <th className="px-6 py-4">Pending</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {agents.length === 0 ? (
                    <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-400">No agents registered yet.</td></tr>
                  ) : (
                    agents.map((agent, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-800">{agent.name}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-bold">{agent.accountsAdded}</span>
                        </td>
                        <td className="px-6 py-4 font-mono text-gray-500 tracking-tight">{agent.bankDetails}</td>
                        <td className="px-6 py-4 font-medium text-gray-600">₹{agent.totalEarned}</td>
                        <td className="px-6 py-4"><span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-md">₹{agent.paidAmount}</span></td>
                        <td className="px-6 py-4">
                          <span className={`font-bold px-2 py-1 rounded-md ${agent.pendingAmount > 0 ? 'text-rose-600 bg-rose-50' : 'text-gray-400'}`}>₹{agent.pendingAmount}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {agent.pendingAmount > 0 ? (
                            <button onClick={() => handleAgentPay(agent.id)} className="bg-gray-900 hover:bg-black text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95">Mark Paid</button>
                          ) : (
                            <span className="text-gray-400 text-xs font-medium flex items-center justify-center"><CheckCircle size={14} className="mr-1"/> Cleared</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center">
              <div className="p-2 bg-pink-100 text-pink-600 rounded-lg mr-3"><Instagram size={20} /></div>
              <h2 className="text-lg font-bold text-gray-800">Creator Payouts</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-4">Username & Agent</th>
                    <th className="px-6 py-4">Total Views</th>
                    <th className="px-6 py-4">Bank Details</th>
                    <th className="px-6 py-4">Earned</th>
                    <th className="px-6 py-4">Pending</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {users.length === 0 ? (
                    <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">No creators found.</td></tr>
                  ) : (
                    users.map((user, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-800">@{user.username}</p>
                          <p className="text-xs text-gray-400 mt-0.5">via {user.agentName}</p>
                          <button onClick={() => showPaymentHistory(user.paymentHistory)} className="text-[10px] text-blue-500 hover:underline mt-1 font-semibold">
                            View History 📜
                          </button>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-600">{user.totalViews.toLocaleString()}</td>
                        <td className="px-6 py-4 font-mono text-gray-500 tracking-tight">{user.bankDetails}</td>
                        <td className="px-6 py-4 font-medium text-gray-600">₹{user.totalEarned}</td>
                        <td className="px-6 py-4">
                          <span className={`font-bold px-2 py-1 rounded-md ${user.pendingAmount > 0 ? 'text-rose-600 bg-rose-50' : 'text-gray-400'}`}>
                            ₹{user.pendingAmount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {user.pendingAmount > 0 ? (
                            <button onClick={() => handleUserPay(user.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 shadow-sm">
                              Pay Now
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs font-medium flex items-center justify-center"><CheckCircle size={14} className="mr-1"/> Cleared</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* --- HISTORY SECTION --- */}
        <div className="mt-8 bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 text-gray-600 rounded-xl mr-4"><Archive size={24} /></div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Past Weeks Data</h2>
                <p className="text-sm text-gray-500 mt-0.5">Search previously cleared videos by Username or Agent.</p>
              </div>
            </div>
            <button 
              onClick={fetchHistory} 
              className="mt-4 md:mt-0 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-6 py-2.5 rounded-lg font-medium shadow-sm transition"
            >
              {showHistory ? "Close History Viewer" : "Load Video History"}
            </button>
          </div>

          {showHistory && (
            <div className="space-y-6 border-t border-gray-100 pt-6">
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by @username or Agent name..." 
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-2 pb-2">
                {filteredHistory.length === 0 ? (
                  <p className="text-gray-400 col-span-full py-8 text-center bg-gray-50 rounded-xl">No historical videos found matching your search.</p>
                ) : (
                  filteredHistory.map(video => {
                    const parentAgent = users.find(u => u.username.toLowerCase() === video.instaUsername.toLowerCase())?.agentName || "Unknown";
                    return (
                      <div key={video._id} className="border border-gray-200 bg-white rounded-xl p-4 shadow-sm hover:border-blue-200 transition">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-bold text-gray-800 text-sm">@{video.instaUsername}</p>
                          <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{video.views} Views</span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium mb-3">Agent: <span className="text-gray-700">{parentAgent}</span></p>
                        <a href={video.videoLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs truncate block bg-gray-50 p-2 rounded">
                          {video.videoLink}
                        </a>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;