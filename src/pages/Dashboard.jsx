import { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BookOpen, Clock, Activity, RefreshCw, Download } from "lucide-react";
import { dashboard, attendance } from "../services/api";

const PIE_COLORS = ['#10b981', '#ef4444']; 

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchData = async () => {
    if (!user) return;
    try {
      const res = await dashboard.getAnalytics(user.role, user.email);
      setData(res.data);
      if (user.role === "student") {
        const sessionRes = await attendance.getSessions();
        setActiveSessions(sessionRes.data);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleMarkPresent = async (subject) => {
    setLoading(true);
    try {
      const res = await attendance.markPresent({ email: user.email, subject });
      alert(res.data.message);
      fetchData(); 
    } catch (err) {
      alert(err.response?.data?.error || "Failed to mark attendance");
    } finally { setLoading(false); }
  };

  const handleToggleSession = async () => {
    if (!window.confirm(`Are you sure you want to ${data.is_active ? 'CLOSE' : 'OPEN'} attendance for ${data.subject}?`)) return;
    try {
      await attendance.toggleSession({ email: user.email, is_active: !data.is_active });
      fetchData(); 
    } catch (err) { alert("Failed to toggle session"); }
  };

  // --- NEW EXPORT FUNCTION ---
  const handleExportCSV = () => {
    if (!data || !data.trends || data.trends.length === 0) {
      alert("No attendance data available to export.");
      return;
    }

    // 1. Create headers based on your trends data structure
    const headers = ["Date", "Students Present"];

    // 2. Map through your trends array to format the rows
    const rows = data.trends.map(item => {
      return `"${item.date}","${item.students}"`;
    });

    // 3. Combine it all together
    const csvContent = [headers.join(','), ...rows].join('\n');

    // 4. Trigger the download using the dynamic subject name
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Formats the file name like: "Computer_Networks_Report.csv"
    const safeSubjectName = data.subject.replace(/\s+/g, '_');
    link.setAttribute('download', `${safeSubjectName}_Report.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!data) return <div className="flex h-[60vh] items-center justify-center animate-pulse">Loading dashboard...</div>;

  return (
    <div className="space-y-8">
      {/* ---------------- STUDENT VIEW ---------------- */}
      {user.role === "student" && (
        <>
          <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-2xl mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-blue-400">
                <Activity size={24} /> Active Classes Right Now
              </h2>
              <button onClick={fetchData} className="text-slate-400 hover:text-white transition"><RefreshCw size={18} /></button>
            </div>
            
            {activeSessions.length === 0 ? (
              <p className="text-slate-400 flex items-center gap-2"><Clock size={18} /> No classes are currently open.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {activeSessions.map(subject => (
                  <button key={subject} onClick={() => handleMarkPresent(subject)} disabled={loading} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-4 rounded-xl font-semibold flex flex-col items-start transition">
                    <span className="text-blue-200 text-sm font-normal mb-1">Click to mark present</span>
                    <span className="text-lg">{subject}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold mb-4">My Subject Overview</h2>
          {data.subjects?.length === 0 ? (
            <p className="text-slate-400">You haven't attended any classes yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.subjects.map(sub => (
                <div key={sub.subject} className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                  <p className="text-slate-400 text-sm font-medium mb-1">{sub.subject}</p>
                  <h3 className="text-3xl font-bold tracking-tight text-white mb-2">{sub.percentage}%</h3>
                  <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                    <div className={`h-2 rounded-full ${sub.percentage >= 75 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${sub.percentage}%` }}></div>
                  </div>
                  <p className="text-xs text-slate-500">Present {sub.present} / {sub.total} days</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ---------------- TEACHER VIEW ---------------- */}
      {user.role === "teacher" && (
        <>
          <div className={`p-8 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-6 transition-all ${data.is_active ? 'bg-green-900/20 border-green-500/50' : 'bg-slate-900 border-slate-800'}`}>
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-2"><BookOpen size={16} /> Course Management</p>
              <h2 className="text-3xl font-bold mb-2">{data.subject}</h2>
              <p className="text-sm text-slate-400 flex items-center gap-2">Status: <span className={`font-bold ${data.is_active ? 'text-green-400' : 'text-slate-500'}`}>{data.is_active ? 'ACCEPTING ATTENDANCE' : 'LOCKED'}</span></p>
            </div>
            
            {/* Added a flex container here to group the Export and Toggle buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={handleExportCSV} className="px-6 py-4 rounded-xl font-bold text-lg transition shadow-lg bg-blue-600 hover:bg-blue-500 shadow-blue-900/20 flex items-center justify-center gap-2">
                <Download size={20} /> Export CSV
              </button>
              
              <button onClick={handleToggleSession} className={`px-8 py-4 rounded-xl font-bold text-lg transition shadow-lg ${data.is_active ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20' : 'bg-green-600 hover:bg-green-500 shadow-green-900/20'}`}>
                {data.is_active ? 'Lock Attendance Window' : 'Open Attendance Window'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                  <p className="text-slate-400 text-sm font-medium mb-1">Enrolled</p>
                  <h3 className="text-3xl font-bold">{data.total_students}</h3>
                </div>
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                  <p className="text-slate-400 text-sm font-medium mb-1">Sessions</p>
                  <h3 className="text-3xl font-bold">{data.total_days}</h3>
                </div>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col items-center">
                <h2 className="text-lg font-semibold w-full text-left mb-2">Class Health</h2>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.risk_data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        {data.risk_data.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="col-span-1 lg:col-span-2 space-y-6">
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                <h2 className="text-lg font-semibold mb-6">Daily Attendance Volume</h2>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="date" stroke="#64748b" axisLine={false} tickLine={false} dy={10} />
                      <YAxis stroke="#64748b" axisLine={false} tickLine={false} dx={-10} />
                      <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                      <Bar dataKey="students" name="Students Present" fill="#3b82f6" radius={[4, 4, 0, 0]} animationDuration={1500} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}