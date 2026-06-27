import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, Clock, Shield, CheckSquare, MessageSquare, 
  ArrowLeft, Send, Sparkles, AlertOctagon, Share2, Upload 
} from 'lucide-react';
import L from 'leaflet';
import { 
  useIssueDetails, useAssignDepartment, useUpdateStatus, 
  useComments, useAddComment, useDeleteIssue 
} from '../hooks/useIssues';
import ImageSlider from '../components/ui/ImageSlider';

function IssueDetailsPage() {
  const { id } = useParams();
  const [newCommentName, setNewCommentName] = useState('Command Hub Staff');
  const [newCommentText, setNewCommentText] = useState('');
  
  // Status form states
  const [statusVal, setStatusVal] = useState('');
  const [remarkVal, setRemarkVal] = useState('');
  const [afterImageFile, setAfterImageFile] = useState(null);
  
  // Assign form states
  const [deptVal, setDeptVal] = useState('');
  const [officerVal, setOfficerVal] = useState('');

  // Map references
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  // TanStack Query
  const { data: issue, isLoading, refetch } = useIssueDetails(id);
  const { data: comments = [], refetch: refetchComments } = useComments(id);

  const assignMutation = useAssignDepartment();
  const updateStatusMutation = useUpdateStatus();
  const deleteMutation = useDeleteIssue();
  const addCommentMutation = useAddComment();

  // Load defaults on sync
  useEffect(() => {
    if (issue) {
      setStatusVal(issue.status);
      setRemarkVal(issue.resolutionRemark || '');
      setDeptVal(issue.assignedDepartment || '');
      setOfficerVal(issue.assignedOfficer || '');
    }
  }, [issue]);

  // Leaflet Map Preview
  useEffect(() => {
    if (issue && mapContainerRef.current && !mapRef.current) {
      const lat = issue.location?.latitude || 12.9716;
      const lng = issue.location?.longitude || 77.5946;

      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([lat, lng], 16);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);

      const markerIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #EF4444; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.4);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      L.marker([lat, lng], { icon: markerIcon }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [issue]);

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    if (!deptVal) return;

    assignMutation.mutate({
      id,
      assignedDepartment: deptVal,
      assignedOfficer: officerVal
    }, {
      onSuccess: () => {
        alert("Department assigned successfully.");
        refetch();
      }
    });
  };

  const handleStatusSubmit = (e) => {
    e.preventDefault();
    if (!statusVal) return;

    const formData = new FormData();
    formData.append('status', statusVal);
    formData.append('resolutionRemark', remarkVal);
    if (afterImageFile) {
      formData.append('afterImage', afterImageFile);
    }

    updateStatusMutation.mutate({ id, formData }, {
      onSuccess: () => {
        alert("Status updated successfully.");
        refetch();
      }
    });
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    addCommentMutation.mutate({
      issueId: id,
      name: newCommentName,
      comment: newCommentText.trim()
    }, {
      onSuccess: () => {
        setNewCommentText('');
        refetchComments();
      }
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border p-12 text-center text-xs font-bold animate-pulse max-w-xl mx-auto mt-10">
        Syncing complaint database registers...
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="bg-white rounded-2xl border p-12 text-center text-xs font-bold max-w-xl mx-auto mt-10">
        <p className="text-red-500 font-extrabold">Register details not found.</p>
        <Link to="/issues" className="text-primary mt-2 hover:underline inline-block">Return to Grid</Link>
      </div>
    );
  }

  const getStatusColor = (s) => {
    switch (s) {
      case 'Resolved': return '#16A34A';
      case 'In Progress': return '#F59E0B';
      case 'Assigned': return '#2563EB';
      case 'Rejected': return '#DC2626';
      default: return '#64748B';
    }
  };

  return (
    <div className="space-y-6 pb-12 text-xs font-semibold text-slate-700">
      {/* Back button */}
      <Link to="/issues" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors font-bold">
        <ArrowLeft className="w-4 h-4" /> Back to Database Grid
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Comparison Slider / Media Display */}
          <div>
            {issue.status === 'Resolved' && issue.beforeImage && issue.afterImage ? (
              <ImageSlider
                before={issue.beforeImage.startsWith('http') ? issue.beforeImage : `http://localhost:5000${issue.beforeImage}`}
                after={issue.afterImage.startsWith('http') ? issue.afterImage : `http://localhost:5000${issue.afterImage}`}
              />
            ) : (
              <div className="w-full max-h-[400px] aspect-[16/9] bg-slate-100 rounded-2xl overflow-hidden border shadow-inner relative">
                <img
                  src={issue.imageUrl?.startsWith('http') ? issue.imageUrl : `http://localhost:5000${issue.imageUrl}`}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?q=80&w=600'}
                />
              </div>
            )}
          </div>

          {/* Core Info */}
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="bg-slate-100 text-slate-800 font-bold text-[10px] px-2.5 py-1 rounded">
                  {issue.category} • {issue.location?.ward}
                </span>
                <h1 className="text-xl font-black text-slate-900 mt-2">{issue.title}</h1>
              </div>

              <span 
                className="text-[9px] font-extrabold px-3 py-1.5 rounded-full text-white"
                style={{ backgroundColor: getStatusColor(issue.status) }}
              >
                {issue.status}
              </span>
            </div>

            <div className="flex items-center gap-1 text-slate-500">
              <MapPin className="w-4 h-4 text-slate-450" />
              <span>{issue.location?.address}</span>
            </div>

            <p className="text-slate-655 text-xs leading-relaxed whitespace-pre-line border-t pt-4 font-medium">
              {issue.description}
            </p>

            <div className="border-t pt-4 grid grid-cols-2 gap-4 text-[10px] font-bold">
              <div>
                <span className="text-slate-400">Reporter Contact</span>
                <p className="text-slate-850 mt-0.5">{issue.reportedBy?.name || 'Anonymous'}</p>
                <p className="text-slate-500 font-medium">{issue.reportedBy?.phone}</p>
              </div>
              <div className="text-right">
                <span className="text-slate-400">AI Priority score</span>
                <p className="text-error font-extrabold text-base mt-0.5">{issue.priorityScore}/100</p>
              </div>
            </div>
          </div>

          {/* Staff Comments Section */}
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-6">
            <h3 className="font-extrabold text-slate-850 text-sm flex items-center gap-1.5">
              <MessageSquare className="w-4.5 h-4.5 text-primary-active" />
              <span>Audit Discussion Timeline</span>
            </h3>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No audit comments logged.</p>
              ) : (
                comments.map(c => (
                  <div key={c._id} className="bg-slate-50 p-3 rounded-xl">
                    <div className="flex justify-between items-center text-slate-400 font-bold">
                      <span className="text-slate-800">{c.name}</span>
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-600 mt-1 leading-normal font-medium">{c.comment}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="border-t pt-4 flex gap-3">
              <input
                type="text"
                required
                value={newCommentName}
                onChange={(e) => setNewCommentName(e.target.value)}
                className="w-1/4 px-3 py-2 bg-slate-50 border rounded-lg"
              />
              <div className="flex-1 relative">
                <input
                  type="text"
                  required
                  placeholder="Log comment update..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 bg-slate-50 border rounded-lg"
                />
                <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary-active hover:text-blue-700">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Tactical Action Panel (Official Only) */}
        <div className="space-y-6">
          {/* Status Update Form */}
          <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
            <h4 className="font-extrabold text-slate-800 text-sm">Status Update Board</h4>
            
            <form onSubmit={handleStatusSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">State</label>
                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2 font-bold"
                >
                  <option value="Pending">Pending Review</option>
                  <option value="Assigned">Assigned Department</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved (Fixed)</option>
                  <option value="Rejected">Rejected Case</option>
                </select>
              </div>

              {/* Upload Proof Image when resolved */}
              {statusVal === 'Resolved' && (
                <div>
                  <label className="text-[10px] text-slate-450 uppercase font-bold block mb-1">Upload Remediation Proof</label>
                  <div className="border border-dashed rounded-lg p-3 text-center bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-100">
                    <Upload className="w-4.5 h-4.5 text-slate-450" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAfterImageFile(e.target.files[0])}
                      className="text-[10px] max-w-44"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Resolution Remark</label>
                <textarea
                  rows="3"
                  value={remarkVal}
                  onChange={(e) => setRemarkVal(e.target.value)}
                  placeholder="Explain remediation actions..."
                  className="w-full bg-slate-50 border rounded-lg p-2 font-medium"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-750 text-white font-extrabold py-2.5 rounded-lg active:scale-95 transition-transform"
              >
                Log Status Update
              </button>
            </form>
          </div>

          {/* Department Assignment Form */}
          <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
            <h4 className="font-extrabold text-slate-800 text-sm">Department Routing</h4>
            
            <form onSubmit={handleAssignSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-455 uppercase font-bold block mb-1">Route to Dept</label>
                <select
                  value={deptVal}
                  onChange={(e) => setDeptVal(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2 font-bold"
                >
                  <option value="">-- Choose Dept --</option>
                  <option value="Road">Road Department</option>
                  <option value="Water">Water Board</option>
                  <option value="Electricity">BESCOM (Power)</option>
                  <option value="Drainage">Drainage Dept</option>
                  <option value="Garbage">Sanitation Board</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Assigned Officer</label>
                <input
                  type="text"
                  value={officerVal}
                  onChange={(e) => setOfficerVal(e.target.value)}
                  placeholder="e.g. S. Murthy (EE)"
                  className="w-full bg-slate-50 border rounded-lg p-2 font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-950 text-white font-extrabold py-2.5 rounded-lg active:scale-95 transition-transform"
              >
                Assign Department
              </button>
            </form>
          </div>

          {/* Map and Details */}
          <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-2">
            <h4 className="font-bold text-slate-400 uppercase text-[10px]">Location Coordinates</h4>
            <div ref={mapContainerRef} className="w-full h-40 rounded-xl border"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IssueDetailsPage;
