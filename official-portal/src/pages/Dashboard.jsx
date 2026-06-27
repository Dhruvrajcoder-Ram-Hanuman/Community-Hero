import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { AlertTriangle, Clock, Shield, CheckCircle, ArrowUpRight } from 'lucide-react';
import { useIssues } from '../hooks/useIssues';
import api from '../services/api';

function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, pending: 0, verified: 0, assigned: 0, inProgress: 0, resolved: 0, critical: 0, today: 0 });
  const [analytics, setAnalytics] = useState(null);

  // TanStack Query to pull critical items sorted by AI Priority Score
  const { data: criticalData, isLoading: loadingCritical } = useIssues({
    sort: 'priority',
    status: 'Pending',
    limit: 5
  });

  useEffect(() => {
    // Dynamic KPI stats and charts
    api.get('/dashboard/stats').then(setStats).catch(err => console.log(err));
    api.get('/analytics').then(setAnalytics).catch(err => console.log(err));
  }, []);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Console Dashboard</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Tactical Command control metrics.</p>
        </div>
        <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-3 py-1.5 rounded-full border border-blue-100 max-w-max select-none">
          📡 Bengaluru Zone Control active
        </span>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border shadow-sm relative overflow-hidden">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Active Cases</span>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats.total}</p>
          <span className="absolute right-4 bottom-4 text-slate-100 text-3xl">📋</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border shadow-sm relative overflow-hidden">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Awaiting Review</span>
          <p className="text-2xl font-black text-slate-700 mt-2">{stats.pending}</p>
          <span className="absolute right-4 bottom-4 text-slate-100 text-3xl">🔍</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-sm relative overflow-hidden bg-gradient-to-br from-red-50/10 to-white">
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Critical Alert</span>
          <p className="text-2xl font-black text-error mt-2">{stats.critical}</p>
          <span className="absolute right-4 bottom-4 text-red-500/10 text-3xl">⚠️</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm relative overflow-hidden bg-gradient-to-br from-emerald-50/10 to-white">
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Resolved closed</span>
          <p className="text-2xl font-black text-success mt-2">{stats.resolved}</p>
          <span className="absolute right-4 bottom-4 text-emerald-500/10 text-3xl">✅</span>
        </div>
      </section>

      {/* Charts section */}
      {analytics && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Incoming Area Chart */}
          <div className="bg-white p-5 rounded-2xl border shadow-sm lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Daily Inflow Rate</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.dailyData}>
                  <defs>
                    <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 9 }} axisLine={false} />
                  <YAxis tick={{ fontSize: 9 }} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="reports" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReports)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Categories Donut Pie Chart */}
          <div className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Categories Breakdown</h3>
            <div className="h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {analytics.categoryData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center mt-2 pointer-events-none text-center">
                <span className="text-[8px] uppercase font-bold text-slate-400">Total Wards</span>
                <span className="text-lg font-black text-slate-800">Seeded</span>
              </div>
            </div>
            {/* Indicators */}
            <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-slate-500">
              {analytics.categoryData.slice(0, 4).map((entry, idx) => (
                <div key={entry.name} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Critical Queue sorted by Priority Score */}
      <section className="bg-white p-5 rounded-2xl border shadow-sm space-y-4 text-xs font-semibold">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
            <AlertTriangle className="w-4.5 h-4.5 text-error" />
            <span>Tactical Priority Queue (Sorted by AI Priority Score)</span>
          </h3>
          <Link to="/issues" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5 font-bold">
            Full database <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingCritical ? (
          <p className="text-center py-6 animate-pulse text-slate-400">Syncing critical queues...</p>
        ) : !criticalData?.data || criticalData.data.length === 0 ? (
          <p className="text-center py-6 text-slate-400 font-bold">No pending critical issues. Good job!</p>
        ) : (
          <div className="border rounded-xl overflow-hidden shadow-inner">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b font-bold text-slate-400">
                  <th className="p-3">Title</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Ward</th>
                  <th className="p-3 text-center">AI Priority Score</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {criticalData.data.map(issue => (
                  <tr key={issue._id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-800 max-w-64 truncate">{issue.title}</td>
                    <td className="p-3">{issue.category}</td>
                    <td className="p-3 text-slate-450">{issue.location?.ward}</td>
                    <td className="p-3 text-center">
                      <span className="bg-red-50 text-error font-extrabold text-[10px] px-2.5 py-1 rounded border border-red-200">
                        {issue.priorityScore}/100
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Link to={`/issue/${issue._id}`} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px]">
                        Review Case
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default DashboardPage;
