import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import api from '../services/api';

function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics')
      .then(setData)
      .catch(err => console.log(err))
      .finally(() => setLoading(false));
  }, []);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Performance Charts</h1>
        <p className="text-xs text-slate-500 font-semibold mt-0.5">Municipal stats breakdown visualizers.</p>
      </div>

      {loading ? (
        <p className="text-center py-12 animate-pulse font-bold text-slate-450">Compiling chart models...</p>
      ) : !data ? (
        <p className="text-center py-12 text-slate-400 font-bold">Failed to load analytics data.</p>
      ) : (
        <div className="space-y-6 text-xs font-semibold">
          {/* Top row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Department Rates BarChart */}
            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Department Performance Rates</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.departmentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} />
                    <YAxis tick={{ fontSize: 9 }} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 9 }} />
                    <Bar dataKey="total" name="Assigned Cases" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="resolved" name="Resolved Cases" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ward Hotspots BarChart */}
            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ward Complaint Hotspots</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.wardData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 9 }} axisLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                    <Bar dataKey="count" name="Active Registers" fill="#EF4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Categories Pie Chart */}
            <div className="bg-white p-5 rounded-2xl border shadow-sm lg:col-span-1 space-y-4 flex flex-col justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Categories Distribution</h3>
              <div className="h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {data.categoryData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-slate-450 mt-4 border-t pt-3">
                {data.categoryData.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span>{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Inflow Trend Line */}
            <div className="bg-white p-5 rounded-2xl border shadow-sm lg:col-span-2 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Daily Complaint Inflow</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 9 }} axisLine={false} />
                    <YAxis tick={{ fontSize: 9 }} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                    <Line type="monotone" dataKey="reports" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default AnalyticsPage;
