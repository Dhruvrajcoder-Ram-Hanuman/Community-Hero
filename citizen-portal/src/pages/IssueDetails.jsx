import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, Clock, ThumbsUp, CheckSquare, MessageSquare, 
  ArrowLeft, Send, Sparkles, AlertOctagon, Share2, HelpCircle 
} from 'lucide-react';
import L from 'leaflet';
import { useIssueDetails, useVerifyIssue, useComments, useAddComment } from '../hooks/useIssues';
import ImageSlider from '../components/ui/ImageSlider';

function IssueDetailsPage({ language }) {
  const { id } = useParams();
  const [newCommentName, setNewCommentName] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [shared, setShared] = useState(false);

  // Map references
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  // TanStack Query
  const { data: issue, isLoading } = useIssueDetails(id);
  const { data: comments = [], refetch: refetchComments } = useComments(id);
  
  const verifyMutation = useVerifyIssue();
  const addCommentMutation = useAddComment();

  // Initialize Map
  useEffect(() => {
    if (issue && mapContainerRef.current && !mapRef.current) {
      const lat = issue.location?.latitude || 12.9716;
      const lng = issue.location?.longitude || 77.5946;

      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([lat, lng], 16);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);

      const color = getStatusColor(issue.status);
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 3.5px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      L.marker([lat, lng], { icon: customIcon }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [issue]);

  const handleVote = (voteType) => {
    const userId = localStorage.getItem('citizen_userId') || 'user_' + Math.random().toString(36).substring(7);
    localStorage.setItem('citizen_userId', userId);

    verifyMutation.mutate({ id, userId, voteType }, {
      onSuccess: () => {
        // Increment profile score points
        if (voteType === 'confirm') {
          let score = parseInt(localStorage.getItem('citizen_score') || '0');
          localStorage.setItem('citizen_score', (score + 5).toString());
        }
      }
    });
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newCommentName.trim() || !newCommentText.trim()) return;

    addCommentMutation.mutate({
      issueId: id,
      name: newCommentName.trim(),
      comment: newCommentText.trim()
    }, {
      onSuccess: () => {
        setNewCommentText('');
        
        let score = parseInt(localStorage.getItem('citizen_score') || '0');
        localStorage.setItem('citizen_score', (score + 3).toString());
      }
    });
  };

  const getStatusColor = (s) => {
    switch (s) {
      case 'Resolved': return '#16A34A';
      case 'In Progress': return '#F59E0B';
      case 'Assigned': return '#2563EB';
      case 'Rejected': return '#DC2626';
      default: return '#64748B';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border p-12 text-center text-xs font-bold animate-pulse max-w-xl mx-auto mt-10 text-slate-400">
        Loading Complaint File...
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border p-12 text-center text-xs font-bold max-w-xl mx-auto mt-10">
        <p className="text-error font-extrabold">Report file not found</p>
        <Link to="/" className="text-primary mt-2 hover:underline inline-block">Return to Feed</Link>
      </div>
    );
  }

  const createdDate = new Date(issue.createdAt).toLocaleDateString();
  const createdTime = new Date(issue.createdAt).toLocaleTimeString([], { timeStyle: 'short' });

  // Timeline Progress Steps
  const timelineSteps = [
    { label: 'Reported', active: true, desc: `Filed by ${issue.reportedBy?.name || 'Citizen'}`, date: `${createdDate} ${createdTime}` },
    { label: 'Verified', active: issue.verificationCount >= 5, desc: `${issue.verificationCount || 0} confirm votes`, date: issue.verificationCount >= 5 ? 'Confirmed' : 'Awaiting' },
    { label: 'Assigned', active: ['Assigned', 'In Progress', 'Resolved'].includes(issue.status), desc: issue.assignedDepartment ? `${issue.assignedDepartment} Dept` : 'Unassigned', date: issue.assignedDepartment ? 'Routed' : 'Pending' },
    { label: 'Engineer Dispatched', active: ['In Progress', 'Resolved'].includes(issue.status), desc: issue.assignedOfficer || 'Staff Dispatched', date: issue.status === 'In Progress' || issue.status === 'Resolved' ? 'Completed' : 'Pending' },
    { label: 'Work Started', active: ['In Progress', 'Resolved'].includes(issue.status), desc: 'Inspecting damaged site', date: issue.status === 'In Progress' || issue.status === 'Resolved' ? 'Started' : 'Pending' },
    { label: 'Inspection', active: issue.status === 'Resolved', desc: 'Proof verification audit', date: issue.status === 'Resolved' ? 'Inspected' : 'Pending' },
    { label: 'Resolved', active: issue.status === 'Resolved', desc: issue.resolutionRemark || 'Issue resolved', date: issue.resolvedAt ? new Date(issue.resolvedAt).toLocaleDateString() : 'Pending' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Back link */}
      <Link to="/" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Social Feed
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Comparison Slider or Single Image */}
          <div>
            {issue.status === 'Resolved' && issue.beforeImage && issue.afterImage ? (
              <ImageSlider
                before={issue.beforeImage.startsWith('http') ? issue.beforeImage : `http://localhost:5000${issue.beforeImage}`}
                after={issue.afterImage.startsWith('http') ? issue.afterImage : `http://localhost:5000${issue.afterImage}`}
              />
            ) : (
              <div className="w-full max-h-[450px] aspect-[16/9] bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative">
                <img
                  src={issue.imageUrl?.startsWith('http') ? issue.imageUrl : `http://localhost:5000${issue.imageUrl}`}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?q=80&w=600'}
                />
              </div>
            )}
          </div>

          {/* Heading */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="bg-primary/10 text-primary font-bold text-[10px] px-2.5 py-1 rounded-full dark:bg-primary/20">
                  {issue.category}
                </span>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mt-2">{issue.title}</h1>
              </div>

              <span 
                className="text-[9px] font-extrabold px-3 py-1.5 rounded-full text-white shadow-sm"
                style={{ backgroundColor: getStatusColor(issue.status) }}
              >
                {issue.status}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="w-4 h-4 text-slate-450" />
              <span className="font-semibold">{issue.location?.address}</span>
            </div>

            <p className="text-slate-600 dark:text-slate-350 text-xs leading-relaxed whitespace-pre-line border-t pt-4">
              {issue.description}
            </p>

            {/* Verification confirmation buttons (Confirm exists/Reject) */}
            <div className="flex flex-wrap gap-3 items-center justify-between border-t pt-4">
              <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                <button
                  onClick={() => handleVote('confirm')}
                  className="bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 border px-4 py-2.5 rounded-xl text-slate-650 dark:text-slate-350 flex items-center gap-1.5"
                >
                  <CheckSquare className="w-4 h-4 text-success" />
                  <span>✓ I confirm this exists ({issue.verificationCount || 0})</span>
                </button>
                <button
                  onClick={() => handleVote('reject')}
                  className="bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 border px-4 py-2.5 rounded-xl text-slate-655 dark:text-slate-350 flex items-center gap-1.5"
                >
                  <AlertOctagon className="w-4 h-4 text-error" />
                  <span>✗ I don't see this anymore ({issue.rejectVotes || 0})</span>
                </button>
                <button
                  onClick={() => handleVote('like')}
                  className="bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 border px-4 py-2.5 rounded-xl text-slate-655 dark:text-slate-350 flex items-center gap-1.5"
                >
                  <ThumbsUp className="w-4 h-4 text-primary" />
                  <span>Upvote ({issue.likes || 0})</span>
                </button>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setShared(true);
                  setTimeout(() => setShared(false), 2000);
                }}
                className="text-slate-500 text-xs font-bold flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>{shared ? 'Copied Link!' : 'Share'}</span>
              </button>
            </div>

            {/* Verified by community badge */}
            {issue.verificationCount >= 15 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-3 text-xs font-bold text-success select-none">
                <Sparkles className="w-4.5 h-4.5 animate-bounce" />
                <span>Verified by Community (15+ confirmations)</span>
              </div>
            )}
          </div>

          {/* Comments Discussion Section */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm space-y-6 text-xs">
            <h3 className="font-extrabold text-slate-850 dark:text-white text-sm flex items-center gap-1.5">
              <MessageSquare className="w-4.5 h-4.5 text-primary" />
              <span>Discussion Thread ({comments.length})</span>
            </h3>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No comments posted yet.</p>
              ) : (
                comments.map(c => (
                  <div key={c._id} className="bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-slate-400 font-bold">
                      <span className="text-slate-800 dark:text-slate-200">{c.name}</span>
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-350 mt-1 leading-normal font-medium">{c.comment}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="border-t pt-4 flex gap-3 font-semibold">
              <input
                type="text"
                required
                placeholder="Name"
                value={newCommentName}
                onChange={(e) => setNewCommentName(e.target.value)}
                className="w-1/4 px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg"
              />
              <div className="flex-1 relative">
                <input
                  type="text"
                  required
                  placeholder="Post comment details..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg"
                />
                <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary-dark">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          {/* Location Map Preview */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm space-y-2 text-xs">
            <h4 className="font-bold text-slate-450 uppercase text-[10px] tracking-wider">Map Context</h4>
            <div ref={mapContainerRef} className="w-full h-44 rounded-xl border border-slate-100"></div>
            <div className="text-[11px] text-slate-500 font-semibold mt-2.5">
              <p><strong>Ward:</strong> {issue.location?.ward}</p>
              <p><strong>SLA Estimation:</strong> {issue.estimatedResolutionDate ? new Date(issue.estimatedResolutionDate).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>

          {/* Stepper Timeline Progress */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm space-y-4 text-xs select-none">
            <h4 className="font-bold text-slate-450 uppercase text-[10px] tracking-wider">Resolution Stepper Timeline</h4>
            
            <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-250/60 dark:before:bg-slate-700">
              {timelineSteps.map((step, idx) => (
                <div key={idx} className="flex gap-4 relative">
                  <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center text-[10px] font-bold z-10 flex-shrink-0 ${
                    step.active ? 'bg-success text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-400'
                  }`}>
                    {step.active ? '✓' : idx + 1}
                  </div>
                  <div className="text-[11px]">
                    <p className={`font-bold ${step.active ? 'text-slate-800 dark:text-white' : 'text-slate-450'}`}>{step.label}</p>
                    <p className="text-slate-450 mt-0.5 leading-tight">{step.desc}</p>
                    <span className="text-[9px] text-slate-400 mt-1 block font-medium">{step.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IssueDetailsPage;
