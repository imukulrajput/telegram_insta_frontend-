import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Key, Users, Instagram, TrendingUp, Copy, Video, CheckCircle, LogOut, RefreshCw, Archive, Search, Activity, Wallet, ShieldCheck, ArrowLeft, Calendar, CreditCard, PlaySquare, ChevronLeft, ChevronRight } from 'lucide-react';

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
  
  const [searchQuery, setSearchQuery] = useState('');
  const [newToken, setNewToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewsInput, setViewsInput] = useState({});
  const [fetchingViews, setFetchingViews] = useState({});

  // States for Features
  const [detailedUserId, setDetailedUserId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // Pagination States
  const [creatorPage, setCreatorPage] = useState(1);
  const creatorsPerPage = 10;
  
  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 12;

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
        
        // Background fetch for detailed page
        const historyRes = await axios.get(`${API_BASE_URL}/admin/videos/archived`, axiosConfig);
        setArchivedVideos(historyRes.data);
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) onLogout();
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  // Handle Search for History (Resets page to 1)
  const handleHistorySearch = (e) => {
    setSearchQuery(e.target.value);
    setHistoryPage(1);
  };

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

  const fetchHistory = async () => {
    if (!showHistory) {
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/videos/archived`, axiosConfig);
        setArchivedVideos(res.data);
        setHistoryPage(1); // Reset page on open
      } catch (error) { console.error("Error:", error); }
    }
    setShowHistory(!showHistory);
  };

  const copyToClipboard = () => { navigator.clipboard.writeText(newToken); alert('Token copied!'); };
  const totalPending = agents.reduce((sum, a) => sum + Number(a.pendingAmount), 0) + users.reduce((sum, u) => sum + Number(u.pendingAmount), 0);

  // --- DEDICATED CREATOR PAGE RENDERER (Full Profile View) ---
  if (detailedUserId && isSuperAdmin) {
    const creator = users.find(u => u.id === detailedUserId);
    if (!creator) return setDetailedUserId(null); 

    const userActiveVideos = activeVideos.filter(v => v.instaUsername.toLowerCase() === creator.username.toLowerCase());
    const userArchivedVideos = archivedVideos.filter(v => v.instaUsername.toLowerCase() === creator.username.toLowerCase());
    const allCreatorVideos = [...userActiveVideos, ...userArchivedVideos].sort((a, b) => b._id.localeCompare(a._id)); 

    return (
      <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-12">
        <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <button onClick={() => setDetailedUserId(null)} className="flex items-center text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-all font-bold">
              <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
            </button>
            <h1 className="text-xl font-black text-gray-800">Creator Profile</h1>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-fade-in-down">
          {/* Creator Profile Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-4 rounded-2xl text-white shadow-lg mr-5"><Instagram size={40} /></div>
              <div>
                <h2 className="text-3xl font-black text-gray-900">@{creator.username}</h2>
                <div className="flex items-center text-gray-500 mt-1 font-medium"><Users size={16} className="mr-1" /> Added via Agent: <span className="text-gray-800 ml-1">{creator.agentName}</span></div>
                <div className="flex items-center text-gray-500 mt-1 font-medium"><CreditCard size={16} className="mr-1" /> Bank Info: <span className="font-mono text-gray-800 ml-1 bg-gray-100 px-2 py-0.5 rounded">{creator.bankDetails}</span></div>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 p-5 rounded-2xl w-full md:w-auto text-center md:text-right">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Current Pending</p>
              <h3 className="text-3xl font-black text-rose-600 mb-3">₹{Number(creator.pendingAmount).toFixed(4)}</h3>
              {Number(creator.pendingAmount) > 0.0001 ? (
                <button onClick={() => handleUserPay(creator.id)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition active:scale-95">Process Payment Now</button>
              ) : (
                <div className="w-full bg-gray-200 text-gray-500 px-6 py-2.5 rounded-xl font-bold flex items-center justify-center"><CheckCircle size={18} className="mr-2" /> All Dues Cleared</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Lifetime Views</p><h3 className="text-3xl font-black text-blue-600 mt-1">{creator.totalViews.toLocaleString()}</h3></div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Earned</p><h3 className="text-3xl font-black text-gray-800 mt-1">₹{Number(creator.totalEarned).toFixed(4)}</h3></div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Paid Successfully</p><h3 className="text-3xl font-black text-emerald-600 mt-1">₹{Number(creator.paidAmount).toFixed(4)}</h3></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
              <div className="p-6 border-b border-gray-100 bg-gray-50"><h3 className="text-lg font-bold text-gray-800 flex items-center"><Calendar className="mr-2 text-emerald-600" size={20}/> Payment History</h3></div>
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {(!creator.paymentHistory || creator.paymentHistory.length === 0) ? (
                  <div className="text-center py-10"><div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"><Wallet className="text-gray-300" size={24}/></div><p className="text-gray-500 font-medium">No payments processed yet.</p></div>
                ) : (
                  [...creator.paymentHistory].reverse().map((record, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-emerald-200 transition"><div className="flex justify-between items-center mb-1"><span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Paid</span><span className="text-xs font-bold text-gray-500">{new Date(record.date).toLocaleDateString()}</span></div><h4 className="text-xl font-black text-gray-800 mt-2">₹{Number(record.amount).toFixed(4)}</h4><p className="text-xs text-gray-400 mt-1">{new Date(record.date).toLocaleTimeString()}</p></div>
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
              <div className="p-6 border-b border-gray-100 bg-gray-50"><h3 className="text-lg font-bold text-gray-800 flex items-center"><PlaySquare className="mr-2 text-blue-600" size={20}/> All Submitted Videos</h3></div>
              <div className="p-0 overflow-y-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white sticky top-0 border-b border-gray-100 shadow-sm z-10">
                    <tr><th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Video Link</th><th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th><th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Saved Views</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allCreatorVideos.length === 0 ? (
                      <tr><td colSpan="3" className="px-6 py-12 text-center text-gray-400 font-medium">No videos submitted by this creator.</td></tr>
                    ) : (
                      allCreatorVideos.map((video) => {
                        const isRejected = video.status === 'Rejected';
                        return (
                          <tr key={video._id} className={`hover:bg-gray-50 transition ${isRejected ? 'bg-red-50/30' : ''}`}>
                            <td className="px-6 py-4"><a href={video.videoLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium block truncate max-w-[250px]">{video.videoLink}</a>{isRejected && video.rejectionReason && (<p className="text-xs text-red-600 mt-1 font-semibold">Reason: {video.rejectionReason}</p>)}</td>
                            <td className="px-6 py-4">{video.status !== 'Archived' && !isRejected && <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md">Active</span>}{video.status === 'Archived' && <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-md">Archived</span>}{isRejected && <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-md">Rejected</span>}</td>
                            <td className="px-6 py-4 text-right font-bold text-gray-800">{video.views.toLocaleString()}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- PAGINATION LOGIC ---
  const indexOfLastCreator = creatorPage * creatorsPerPage;
  const indexOfFirstCreator = indexOfLastCreator - creatorsPerPage;
  const currentCreators = users.slice(indexOfFirstCreator, indexOfLastCreator);
  const totalCreatorPages = Math.ceil(users.length / creatorsPerPage);

  const filteredHistory = archivedVideos.filter(video => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    const vUser = video.instaUsername.toLowerCase();
    const userProfile = users.find(u => u.username.toLowerCase() === vUser);
    const agentName = userProfile ? userProfile.agentName.toLowerCase() : "";
    return vUser.includes(search) || agentName.includes(search);
  });
  const indexOfLastHistory = historyPage * historyPerPage;
  const indexOfFirstHistory = indexOfLastHistory - historyPerPage;
  const currentHistory = filteredHistory.slice(indexOfFirstHistory, indexOfLastHistory);
  const totalHistoryPages = Math.ceil(filteredHistory.length / historyPerPage);

  // --- MAIN DASHBOARD RENDERER ---
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
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

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* STATS CARDS */}
        {isSuperAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-down">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4"><div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><Users size={24} /></div><div><p className="text-sm font-medium text-gray-500">Total Agents</p><h3 className="text-2xl font-bold text-gray-800">{agents.length}</h3></div></div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4"><div className="p-3 bg-pink-100 text-pink-600 rounded-xl"><Instagram size={24} /></div><div><p className="text-sm font-medium text-gray-500">Total Creators</p><h3 className="text-2xl font-bold text-gray-800">{users.length}</h3></div></div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4"><div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Activity size={24} /></div><div><p className="text-sm font-medium text-gray-500">Active Videos</p><h3 className="text-2xl font-bold text-gray-800">{activeVideos.length}</h3></div></div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4"><div className="p-3 bg-red-100 text-red-600 rounded-xl"><Wallet size={24} /></div><div><p className="text-sm font-medium text-gray-500">Pending Payouts</p><h3 className="text-2xl font-bold text-gray-800">₹{totalPending.toFixed(2)}</h3></div></div>
          </div>
        )}

        {/* TOKEN GENERATION */}
        {isSuperAdmin && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0"><h2 className="text-lg font-bold text-gray-800 flex items-center"><Key className="mr-2 text-yellow-500" size={20} /> Agent Registration Token</h2><p className="text-sm text-gray-500 mt-1">Generate a secure one-time token to onboard new agents.</p></div>
            <div className="flex items-center space-x-3 w-full md:w-auto">
              {newToken && (<div className="flex items-center bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg border border-gray-200 flex-1 md:flex-none"><span className="font-mono font-bold tracking-wider mr-3 text-lg">{newToken}</span><button onClick={copyToClipboard} className="text-gray-400 hover:text-blue-600 transition"><Copy size={18} /></button></div>)}
              <button onClick={generateToken} disabled={loading} className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-lg font-medium shadow-md transition-all active:scale-95">{loading ? 'Generating...' : 'Generate New Token'}</button>
            </div>
          </div>
        )}

        {/* WEEKLY VIDEOS SECTION */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white flex flex-col md:flex-row justify-between items-center">
            <div><h2 className="text-lg font-bold text-blue-900 flex items-center"><Video className="mr-2 text-blue-600" /> Action Hub: Review Videos</h2>{!isSuperAdmin && <p className="text-sm text-gray-500 mt-1">Please fetch views or reject fake videos.</p>}</div>
            {isSuperAdmin && (<button onClick={handleWeeklyReset} className="mt-3 md:mt-0 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center"><Archive size={16} className="mr-2"/> End Week & Clear Dashboard</button>)}
          </div>
          <div className="p-6 bg-gray-50/50">
            {activeVideos.length === 0 ? (
              <div className="text-center py-10"><Video size={48} className="mx-auto text-gray-300 mb-3" /><p className="text-gray-500 font-medium">No videos pending review.</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeVideos.map(video => (
                  <div key={video._id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-3"><p className="font-bold text-gray-800 text-lg">@{video.instaUsername}</p><span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">{video.views || 0} Views</span></div>
                    <a href={video.videoLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 hover:underline text-sm truncate block mb-5 bg-gray-50 p-2 rounded-md">{video.videoLink}</a>
                    <div className="space-y-3">
                      <div className="flex space-x-2"><button onClick={() => autoFetchViews(video._id, video.videoLink)} disabled={fetchingViews[video._id]} className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 py-2.5 rounded-lg flex items-center justify-center font-bold transition"><RefreshCw size={18} className={`mr-2 ${fetchingViews[video._id] ? "animate-spin" : ""}`} />{fetchingViews[video._id] ? "Fetching..." : "Auto Fetch & Save"}</button></div>
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
            
            {/* Creators Table (With Pagination) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center"><div className="p-2 bg-pink-100 text-pink-600 rounded-lg mr-3"><Instagram size={20} /></div><h2 className="text-lg font-bold text-gray-800">Creator Payouts</h2></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                    <tr><th className="px-6 py-4">Creator Profile</th><th className="px-6 py-4">Total Views</th><th className="px-6 py-4">Bank Details</th><th className="px-6 py-4">Earned</th><th className="px-6 py-4">Pending</th><th className="px-6 py-4 text-center">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {currentCreators.length === 0 ? <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">No creators found.</td></tr> : currentCreators.map((user, index) => {
                      const pendingNum = Number(user.pendingAmount);
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-800 text-base">@{user.username}</p>
                            <p className="text-xs text-gray-400 mt-0.5 mb-2">via {user.agentName}</p>
                            <button onClick={() => setDetailedUserId(user.id)} className="text-xs font-bold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg transition-all shadow-sm">View Full Profile</button>
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
              {/* Creators Pagination Controls */}
              {totalCreatorPages > 1 && (
                <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-100">
                  <span className="text-sm text-gray-500 font-medium">Page {creatorPage} of {totalCreatorPages}</span>
                  <div className="flex space-x-2">
                    <button disabled={creatorPage === 1} onClick={() => setCreatorPage(creatorPage - 1)} className="p-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-white disabled:opacity-40 transition"><ChevronLeft size={20}/></button>
                    <button disabled={creatorPage === totalCreatorPages} onClick={() => setCreatorPage(creatorPage + 1)} className="p-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-white disabled:opacity-40 transition"><ChevronRight size={20}/></button>
                  </div>
                </div>
              )}
            </div>

            {/* Agents Table (With Linked Accounts Info) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center"><div className="p-2 bg-purple-100 text-purple-600 rounded-lg mr-3"><Users size={20} /></div><h2 className="text-lg font-bold text-gray-800">Agent Payouts</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                    <tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Linked Accounts</th><th className="px-6 py-4">Bank Details</th><th className="px-6 py-4">Earned</th><th className="px-6 py-4">Paid</th><th className="px-6 py-4">Pending</th><th className="px-6 py-4 text-center">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {agents.map((agent, index) => {
                      // Find users belonging to this agent
                      const linkedUsers = users.filter(u => u.agentName === agent.name);
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-bold text-gray-800">{agent.name}</td>
                            <td className="px-6 py-4">
                              <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-bold mb-2 inline-block">
                                {agent.accountsAdded} Accounts
                              </span>
                              {/* Display linked usernames as small chips */}
                              {linkedUsers.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1 max-w-[200px]">
                                  {linkedUsers.map(u => (
                                    <span key={u.id} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded-md font-semibold">
                                      @{u.username}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 font-mono text-gray-500">{agent.bankDetails}</td>
                            <td className="px-6 py-4 font-medium text-gray-600">₹{Number(agent.totalEarned).toFixed(2)}</td>
                            <td className="px-6 py-4"><span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-md">₹{Number(agent.paidAmount).toFixed(2)}</span></td>
                            <td className="px-6 py-4"><span className={`font-bold px-2 py-1 rounded-md ${Number(agent.pendingAmount) > 0 ? 'text-rose-600 bg-rose-50' : 'text-gray-400'}`}>₹{Number(agent.pendingAmount).toFixed(2)}</span></td>
                            <td className="px-6 py-4 text-center">{Number(agent.pendingAmount) > 0 ? (<button onClick={() => handleAgentPay(agent.id)} className="bg-gray-900 hover:bg-black text-white px-4 py-1.5 rounded-lg text-xs font-semibold">Mark Paid</button>) : (<span className="text-gray-400 text-xs flex items-center justify-center"><CheckCircle size={14} className="mr-1"/> Cleared</span>)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>
        )}

        {/* --- MAIN DASHBOARD HISTORY SECTION (Restored with Pagination) --- */}
        {isSuperAdmin && (
          <div className="mt-8 bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              <div className="flex items-center"><div className="p-3 bg-gray-100 text-gray-600 rounded-xl mr-4"><Archive size={24} /></div><div><h2 className="text-xl font-bold text-gray-800">Past Weeks Data (Archive & Rejected)</h2></div></div>
              <button onClick={fetchHistory} className="mt-4 md:mt-0 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-6 py-2.5 rounded-lg font-medium shadow-sm">{showHistory ? "Hide History Panel" : "Load Video History"}</button>
            </div>
            {showHistory && (
              <div className="space-y-6 border-t border-gray-100 pt-6">
                <div className="relative max-w-md"><Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Search by @username or Agent..." className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" value={searchQuery} onChange={handleHistorySearch} /></div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pr-2 pb-2">
                  {currentHistory.length === 0 ? <p className="text-gray-400 col-span-full py-8 text-center bg-gray-50 rounded-xl">No historical videos found.</p> : currentHistory.map(video => {
                    const parentAgent = users.find(u => u.username.toLowerCase() === video.instaUsername.toLowerCase())?.agentName || "Unknown";
                    const isRejected = video.status === 'Rejected';
                    return (
                      <div key={video._id} className={`border ${isRejected ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'} rounded-xl p-4 shadow-sm hover:shadow-md transition`}>
                          <div className="flex justify-between items-center mb-2"><p className="font-bold text-gray-800 text-sm">@{video.instaUsername}</p><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${isRejected ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{isRejected ? 'REJECTED' : `${video.views} Views`}</span></div>
                          <p className="text-xs text-gray-500 font-medium mb-2">Agent: <span className="text-gray-700">{parentAgent}</span></p>
                          {isRejected && video.rejectionReason && (<p className="text-xs text-red-600 font-semibold mb-2 bg-red-100 p-1.5 rounded">Reason: {video.rejectionReason}</p>)}
                          <a href={video.videoLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs truncate block bg-white/50 border border-gray-100 p-2 rounded">{video.videoLink}</a>
                      </div>
                    )
                  })}
                </div>

                {/* History Pagination Controls */}
                {totalHistoryPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
                    <span className="text-sm text-gray-500 font-medium">Showing Page {historyPage} of {totalHistoryPages}</span>
                    <div className="flex space-x-2">
                      <button disabled={historyPage === 1} onClick={() => setHistoryPage(historyPage - 1)} className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition font-medium text-sm">Previous</button>
                      <button disabled={historyPage === totalHistoryPages} onClick={() => setHistoryPage(historyPage + 1)} className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition font-medium text-sm">Next Page</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;