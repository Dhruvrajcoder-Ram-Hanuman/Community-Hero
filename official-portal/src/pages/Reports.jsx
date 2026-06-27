import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, FileText, Download, Printer } from 'lucide-react';
import api from '../services/api';

function ReportsPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => {
    api.get('/issues')
      .then(response => {
        const list = Array.isArray(response) ? response : (response?.data || []);
        setIssues(list);
        setLoading(false);
      })
      .catch(err => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  const filtered = filterCategory === 'All' 
    ? issues 
    : issues.filter(i => i.category === filterCategory);

  // Export to Excel (CSV Generator)
  const handleExportCSV = () => {
    if (filtered.length === 0) return;

    const headers = ['Title', 'Category', 'Status', 'Priority', 'Ward', 'Address', 'Likes', 'Confirmations', 'Reported By', 'Date Filed'];
    const rows = filtered.map(i => [
      `"${i.title.replace(/"/g, '""')}"`,
      i.category,
      i.status,
      i.priority || 'Medium',
      i.location?.ward || 'N/A',
      `"${(i.location?.address || '').replace(/"/g, '""')}"`,
      i.likes || 0,
      i.verificationCount || 0,
      i.reportedBy?.name || 'Anonymous',
      new Date(i.createdAt).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `community_hero_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const categories = ['All', 'Road', 'Garbage', 'Street Light', 'Water', 'Electricity', 'Drainage', 'Traffic'];

  return (
    <div className="space-y-6 print:bg-white print:p-0">
      {/* Header (hidden in print) */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 print:hidden text-xs font-bold">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Audit Report Generator</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Export active registers to Excel or PDF files.</p>
        </div>
        <div className="flex gap-2.5">
          <button 
            onClick={handleExportCSV} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <FileSpreadsheet className="w-4.5 h-4.5" />
            <span>Export to Excel (CSV)</span>
          </button>
          <button 
            onClick={handlePrint}
            className="bg-slate-900 hover:bg-slate-950 text-white px-4 py-2.5 rounded-xl flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <Printer className="w-4.5 h-4.5" />
            <span>Print PDF Report</span>
          </button>
        </div>
      </div>

      {/* Selector Row */}
      <div className="bg-white p-4 rounded-xl border flex items-center gap-3 print:hidden text-xs font-semibold">
        <span className="text-slate-400">Filter Category:</span>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-slate-50 border p-2 rounded-lg font-bold"
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Report Sheet Layout */}
      <section className="bg-white p-6 md:p-8 rounded-2xl border shadow-sm space-y-6 text-xs font-semibold">
        {/* Printable Header */}
        <div className="text-center space-y-1.5 border-b pb-6 select-none">
          <span className="text-3xl">🏛️</span>
          <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">MUNICIPAL CIVIC MANAGEMENT COMMAND AND CONTROL</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Bangalore Ward Registry Audit Statement</p>
          <p className="text-[9px] text-slate-400 mt-2 font-medium">Generated on: {new Date().toLocaleString()}</p>
        </div>

        {loading ? (
          <p className="text-center py-6 animate-pulse text-slate-450">Compiling ledger data...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-6 text-slate-400 font-bold">No records found matching filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b font-bold text-slate-450">
                  <th className="p-3">Title</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Ward</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Score</th>
                  <th className="p-3 text-right">Filed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filtered.map(i => (
                  <tr key={i._id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-800">{i.title}</td>
                    <td className="p-3">{i.category}</td>
                    <td className="p-3 text-slate-500">{i.location?.ward}</td>
                    <td className="p-3">{i.status}</td>
                    <td className="p-3 text-center font-bold">{i.priorityScore}</td>
                    <td className="p-3 text-right text-slate-400">{new Date(i.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Printable Footer */}
        <div className="hidden print:block border-t pt-8 text-[9px] text-slate-400 font-bold flex justify-between select-none">
          <p>Verified Command Agent Signature: _________________________</p>
          <p>System Timestamp Audit Registry ID: CH-{Date.now().toString().slice(-6)}</p>
        </div>
      </section>
    </div>
  );
}

export default ReportsPage;
