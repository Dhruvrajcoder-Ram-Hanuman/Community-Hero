import React, { useState, useEffect } from 'react';
import { Award, Shield, CheckCircle, Clock, Trash2, Heart, Settings } from 'lucide-react';
import { useIssues } from '../hooks/useIssues';
import api from '../services/api';

function ProfilePage() {
  const [score, setScore] = useState(620);
  const [name, setName] = useState('Dhruv Raj');
  const [phone, setPhone] = useState('9876543210');
  const [email, setEmail] = useState('dhruv@communityhero.in');
  
  const [myIssues, setMyIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Score local storage sync
    const storedScore = localStorage.getItem('citizen_score');
    if (!storedScore) {
      localStorage.setItem('citizen_score', '620');
    } else {
      setScore(parseInt(storedScore));
    }

    // Fetch and filter reported complaints by user
    api.get('/issues')
      .then(res => {
        // Fallback filter
        const filtered = res.filter(i => 
          i.reportedBy?.email === email ||
          i.reportedBy?.name === name ||
          i.reportedBy?.email === 'dhruv@communityhero.in'
        );
        setMyIssues(filtered);
        setLoading(false);
      })
      .catch(err => {
        console.log(err);
        setLoading(false);
      });
  }, [email, name]);

  const handleClearData = () => {
    if (window.confirm("Delete all local account data? This clears your gamification points score.")) {
      localStorage.clear();
      setScore(0);
      setMyIssues([]);
      alert("Local session data cleared.");
    }
  };

  // Badge thresholds
  const badges = [
    { label: '🥉 Community Helper', req: 100, desc: 'Earned 100+ points by verifying local reports.' },
    { label: '🥈 Problem Solver', req: 300, desc: 'Earned 300+ points by commenting and filing complaints.' },
    { label: '🥇 Community Hero', req: 600, desc: 'Earned 600+ points. An active pillar in neighborhood care.' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Profile Header */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="w-20 h-20 bg-gradient-to-tr from-primary to-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-black select-none">
          DR
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-1">
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">{name}</h2>
          <p className="text-xs text-slate-400">Citizen ID: CH-560001-2026 • Member since Jun 2026</p>
          
          <div className="pt-2 flex items-center justify-center md:justify-start gap-1.5 text-xs font-bold text-emerald-500">
            <Award className="w-4 h-4" />
            <span>Tier: {score >= 600 ? 'Community Hero' : score >= 300 ? 'Problem Solver' : 'Helper'}</span>
          </div>
        </div>

        {/* Dynamic points widget */}
        <div className="bg-slate-50 dark:bg-slate-900 border p-4 rounded-xl text-center min-w-36">
          <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Contribution Score</span>
          <p className="text-3xl font-black text-primary mt-1">{score}</p>
          <span className="text-[9px] text-slate-450 font-semibold">Points Accumulated</span>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column (2/3) */}
        <div className="md:col-span-2 space-y-6">
          {/* History */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm space-y-4 text-xs font-semibold">
            <h3 className="text-slate-800 dark:text-white font-extrabold text-sm">My Reports History</h3>
            
            {loading ? (
              <p className="text-slate-400 animate-pulse">Loading list...</p>
            ) : myIssues.length === 0 ? (
              <p className="text-slate-400 text-center py-6">You haven't submitted any complaints yet.</p>
            ) : (
              <div className="space-y-3">
                {myIssues.map(issue => (
                  <div key={issue._id} className="p-3.5 border rounded-xl hover:bg-slate-50/50 flex justify-between items-center">
                    <div className="space-y-0.5">
                      <p className="font-extrabold text-slate-800 dark:text-white">{issue.title}</p>
                      <p className="text-[10px] text-slate-400">{issue.location?.address} • {new Date(issue.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      issue.status === 'Resolved' ? 'bg-success/15 text-success' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {issue.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          {/* Badges */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm space-y-4 text-xs">
            <h3 className="font-extrabold text-slate-850 dark:text-white text-sm flex items-center gap-1.5">
              <Award className="w-5 h-5 text-warning" />
              <span>Earned Achievements</span>
            </h3>

            <div className="space-y-3 font-semibold">
              {badges.map(bg => (
                <div 
                  key={bg.label} 
                  className={`p-3 border rounded-xl flex items-start gap-2.5 transition-all ${
                    score >= bg.req ? 'bg-slate-50 dark:bg-slate-900 border-slate-200' : 'opacity-40 bg-slate-50/30'
                  }`}
                >
                  <span className="text-lg">{score >= bg.req ? '🏆' : '🔒'}</span>
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-slate-850 dark:text-slate-200">{bg.label}</p>
                    <p className="text-[9px] text-slate-450 leading-relaxed">{bg.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cleanup settings */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm space-y-4 text-xs font-semibold">
            <h3 className="font-extrabold text-slate-850 dark:text-white text-sm flex items-center gap-1.5">
              <Settings className="w-5 h-5 text-slate-500" />
              <span>System Preferences</span>
            </h3>
            
            <button
              onClick={handleClearData}
              className="w-full bg-error/10 hover:bg-error/15 text-error border border-error/20 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset Profile Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
