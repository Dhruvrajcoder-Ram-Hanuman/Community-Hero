import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Filter, CheckCircle2, ChevronRight, RefreshCw, AlertTriangle, Layers } from 'lucide-react';
import { useIssues } from '../hooks/useIssues';
import api from '../services/api';

function AllIssuesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedWard, setSelectedWard] = useState('All');
  const [sortBy, setSortBy] = useState('priority');

  // Bulk Operations State
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkActionDept, setBulkActionDept] = useState('');
  const [bulkOfficer, setBulkOfficer] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkSlaDays, setBulkSlaDays] = useState(3);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Filters Payload
  const filters = {
    sort: sortBy,
    category: selectedCategory !== 'All' ? selectedCategory : undefined,
    status: selectedStatus !== 'All' ? selectedStatus : undefined,
    ward: selectedWard !== 'All' ? selectedWard : undefined,
    search: searchTerm || undefined
  };

  const { data: response, isLoading, refetch } = useIssues(filters);

  const handleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked && response?.data) {
      setSelectedIds(response.data.map(i => i._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    if (!bulkActionDept && !bulkStatus) {
      alert("Please choose a status or department assignment for bulk operations.");
      return;
    }

    setBulkLoading(true);
    try {
      for (const id of selectedIds) {
        if (bulkStatus) {
          // Update Status
          const formData = new FormData();
          formData.append('status', bulkStatus);
          formData.append('resolutionRemark', `Bulk updated to ${bulkStatus} by Admin.`);
          await api.patch(`/issues/${id}/status`, formData);
        }
        if (bulkActionDept) {
          // Assign Department
          await api.patch(`/issues/${id}/assign`, {
            assignedDepartment: bulkActionDept,
            assignedOfficer: bulkOfficer || 'Duty Officer'
          });
        }
      }
      alert(`Successfully updated ${selectedIds.length} issues!`);
      setSelectedIds([]);
      setBulkActionDept('');
      setBulkOfficer('');
      setBulkStatus('');
      refetch();
    } catch (err) {
      alert(err.message || "Failed bulk update");
    } finally {
      setBulkLoading(false);
    }
  };

  const categories = ['All', 'Road', 'Garbage', 'Street Light', 'Water', 'Electricity', 'Drainage', 'Traffic'];
  const statuses = ['All', 'Pending', 'Assigned', 'In Progress', 'Resolved'];
  const wards = ['All', 'Ward 142', 'Ward 148', 'Ward 120', 'Ward 104', 'Ward 131'];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Active Cases Database</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">High-density records explorer dashboard.</p>
        </div>
        <button onClick={() => refetch()} className="p-2 bg-white hover:bg-slate-50 border rounded-lg">
          <RefreshCw className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Advanced Filters Panel */}
      <section className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 text-xs font-semibold">
          {/* Search bar */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-450 w-4 h-4" />
            <input
              type="text"
              placeholder="Filter by keyword (e.g. pothole sector 15)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl focus:outline-none"
            />
          </div>

          {/* Sorter */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-50 border rounded-xl px-3 py-2.5"
            >
              <option value="priority">AI Priority Score</option>
              <option value="newest">Newest Submission</option>
              <option value="verified">Most Confirmations</option>
              <option value="views">Most Viewed</option>
            </select>
          </div>

          {/* Ward filter */}
          <div>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="w-full bg-slate-50 border rounded-xl px-3 py-2.5 font-bold"
            >
              <option value="All">All Municipal Wards</option>
              {wards.filter(w => w !== 'All').map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        </div>

        {/* Category Pills (WIDENED) */}
        <div className="flex flex-wrap gap-3.5 text-xs font-bold text-slate-550 border-t pt-3">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-8 py-2.5 rounded-xl border transition-colors min-w-[120px] text-center ${
                selectedCategory === cat 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-105 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Bulk Operations Toolbar */}
      {selectedIds.length > 0 && (
        <section className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold animate-fade-in border border-slate-850">
          <div>
            <p className="text-white text-sm font-extrabold">{selectedIds.length} Issues Selected</p>
            <p className="text-slate-400 mt-0.5">Apply bulk updates to marked registers.</p>
          </div>

          <form onSubmit={handleBulkSubmit} className="flex flex-wrap gap-3 items-center">
            {/* Status Change */}
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="bg-slate-800 text-white border border-slate-700 rounded-lg p-2"
            >
              <option value="">-- Set Status --</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            {/* Department Assignment */}
            <select
              value={bulkActionDept}
              onChange={(e) => setBulkActionDept(e.target.value)}
              className="bg-slate-800 text-white border border-slate-700 rounded-lg p-2"
            >
              <option value="">-- Route to Dept --</option>
              <option value="Road">Road Department</option>
              <option value="Water">Water Board</option>
              <option value="Electricity">BESCOM (Power)</option>
              <option value="Drainage">Drainage Dept</option>
              <option value="Garbage">Sanitation Board</option>
            </select>

            <input
              type="text"
              placeholder="Officer (Optional)"
              value={bulkOfficer}
              onChange={(e) => setBulkOfficer(e.target.value)}
              className="bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-2 w-28 placeholder-slate-450"
            />

            <button
              type="submit"
              disabled={bulkLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4.5 py-2.5 rounded-lg disabled:opacity-50 active:scale-95 transition-transform"
            >
              {bulkLoading ? 'Updating...' : 'Execute Updates'}
            </button>
          </form>
        </section>
      )}

      {/* Main Database Grid */}
      <section className="bg-white rounded-2xl border shadow-sm overflow-hidden text-xs font-semibold">
        {isLoading ? (
          <p className="text-center py-12 animate-pulse text-slate-450">Syncing database registers...</p>
        ) : !response?.data || response.data.length === 0 ? (
          <p className="text-center py-12 text-slate-400 font-bold">No active registers found matching criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 border-b font-bold">
                  <th className="p-4 w-12 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedIds.length === response.data.length}
                      className="rounded text-primary focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="p-4">Complaint Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Ward Sector</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Priority Score</th>
                  <th className="p-4">Reported Date</th>
                  <th className="p-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {response.data.map(issue => (
                  <tr 
                    key={issue._id}
                    className={`hover:bg-slate-50/50 cursor-pointer ${
                      selectedIds.includes(issue._id) ? 'bg-blue-50/10' : ''
                    }`}
                    onClick={() => handleSelectRow(issue._id)}
                  >
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(issue._id)}
                        onChange={() => handleSelectRow(issue._id)}
                        className="rounded text-primary focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-extrabold text-slate-800 line-clamp-1">{issue.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-64">📍 {issue.location?.address}</p>
                      </div>
                    </td>
                    <td className="p-4 font-bold">{issue.category}</td>
                    <td className="p-4 text-slate-450">{issue.location?.ward}</td>
                    <td className="p-4">
                      <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        issue.status === 'Resolved' ? 'bg-green-100 text-success' :
                        issue.status === 'In Progress' ? 'bg-amber-100 text-warning' :
                        issue.status === 'Assigned' ? 'bg-blue-100 text-blue-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {issue.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-slate-100 text-slate-800 font-extrabold text-[10px] px-2.5 py-0.5 rounded">
                        {issue.priorityScore}/100
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 font-medium">{new Date(issue.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Link to={`/issue/${issue._id}`} className="inline-flex p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800 transition-colors">
                        <ChevronRight className="w-4 h-4" />
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

export default AllIssuesPage;
