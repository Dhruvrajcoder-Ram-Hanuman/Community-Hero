import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Eye, ThumbsUp, CheckSquare, Sparkles, Filter, Navigation, Compass, Heart, Award } from 'lucide-react';
import { translations } from '../App';
import { useIssues, useVerifyIssue } from '../hooks/useIssues';
import api from '../services/api';

function HomePage({ language }) {
  const t = translations[language];
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [distanceRange, setDistanceRange] = useState(1000); // 100m, 500m, 1km, 5km
  const [sortBy, setSortBy] = useState('priority');

  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0, critical: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [challenges, setChallenges] = useState([]);

  // Fetch stats and leaderboard static components
  useEffect(() => {
    api.get('/dashboard/stats').then(setStats).catch(err => console.log(err));
    api.get('/analytics').then(data => {
      if (data.leaderboard) setLeaderboard(data.leaderboard);
      if (data.challenges) setChallenges(data.challenges);
    }).catch(err => console.log(err));
  }, []);

  // Set up filters payload
  const filtersPayload = {
    sort: sortBy,
    category: selectedCategory !== 'All' ? selectedCategory : undefined,
    status: selectedStatus !== 'All' ? selectedStatus : undefined,
    search: searchTerm || undefined
  };

  if (nearbyOnly && userCoords) {
    filtersPayload.nearby = 'true';
    filtersPayload.userLat = userCoords.latitude;
    filtersPayload.userLon = userCoords.longitude;
    filtersPayload.userRadiusMeters = distanceRange;
  }

  // TanStack Query list
  const { data: issuesResponse, isLoading, refetch } = useIssues(filtersPayload);
  const verifyMutation = useVerifyIssue();

  const handleNearbyToggle = () => {
    if (!nearbyOnly) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserCoords({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
            setNearbyOnly(true);
          },
          (err) => {
            alert('Geolocation permission denied.');
          }
        );
      }
    } else {
      setNearbyOnly(false);
      setUserCoords(null);
    }
  };

  const handleVote = (e, issueId, voteType) => {
    e.preventDefault();
    e.stopPropagation();
    
    const userId = localStorage.getItem('citizen_userId') || 'user_' + Math.random().toString(36).substring(7);
    localStorage.setItem('citizen_userId', userId);

    verifyMutation.mutate({ id: issueId, userId, voteType });
  };

  const categories = [
    { name: 'All', label: t.all, icon: '📦' },
    { name: 'Road', label: t.road, icon: '🛣️' },
    { name: 'Garbage', label: t.garbage, icon: '🗑️' },
    { name: 'Street Light', label: t.streetLight, icon: '💡' },
    { name: 'Water', label: t.water, icon: '🚰' },
    { name: 'Electricity', label: t.electricity, icon: '⚡' },
    { name: 'Drainage', label: t.drainage, icon: '🌧️' },
    { name: 'Traffic', label: t.traffic, icon: '🚦' }
  ];

  const statuses = [
    { name: 'All', label: 'All Active' },
    { name: 'Pending', label: t.pending },
    { name: 'Verified', label: t.verified },
    { name: 'In Progress', label: t.inProgress },
    { name: 'Resolved', label: t.resolved }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Banner */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-emerald-600 text-white p-8 md:p-12 shadow-xl">
        <div className="absolute inset-0 bg-black/10 dark:bg-black/25"></div>
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="bg-white/20 text-white font-extrabold text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full">
            Smart Hyperlocal Problem Solver
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Report. Track. Improve Your Ward.
          </h1>
          <p className="text-blue-100 text-xs md:text-sm max-w-md font-medium leading-relaxed">
            Submit local issues, verify neighborhood reports, earn contribution points, and monitor real-time department resolutions.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link to="/report" className="bg-white text-primary font-extrabold px-5 py-3 rounded-xl shadow-lg text-xs hover:-translate-y-0.5 transition-transform">
              Report Issue
            </Link>
            <Link to="/map" className="bg-emerald-500 text-white font-extrabold px-5 py-3 rounded-xl shadow-lg text-xs hover:-translate-y-0.5 transition-transform flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Open Ward Map
            </Link>
          </div>
        </div>
      </section>

      {/* Dynamic Statistics Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.statsReports}</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total || 12}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.statsResolved}</span>
          <p className="text-2xl font-black text-success mt-1">{stats.resolved || 9}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.statsRate}</span>
          <p className="text-2xl font-black text-primary-light mt-1">{stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 75}%</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.statsActive}</span>
          <p className="text-2xl font-black text-warning mt-1">12 Active</p>
        </div>
      </section>

      {/* Narrative Impact Dashboard Widget */}
      <section className="bg-gradient-to-br from-emerald-500/5 to-blue-500/5 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
          <Heart className="w-4.5 h-4.5 text-emerald-500 fill-current" />
          <span>Our Community Impact Storyboard</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold">
          <div className="bg-white dark:bg-slate-850 p-4.5 rounded-xl border border-slate-150/60 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
            <span className="text-3xl">🛣️</span>
            <div>
              <p className="text-slate-900 dark:text-white font-extrabold text-sm">500+ Potholes Mended</p>
              <p className="text-slate-500 mt-1">Estimated <strong className="text-emerald-500">1,200 accidents prevented</strong> city-wide.</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-850 p-4.5 rounded-xl border border-slate-150/60 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
            <span className="text-3xl">🚰</span>
            <div>
              <p className="text-slate-900 dark:text-white font-extrabold text-sm">200+ Water Leaks Secured</p>
              <p className="text-slate-500 mt-1">Conserved an estimated <strong className="text-primary-light">18 lakh liters of drinking water</strong>.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Filters Panel */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
            <input
              type="text"
              placeholder="Try searching 'broken light near school' or 'water leak today'..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-xs font-semibold"
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Distance Slider (Conditional on Nearby) */}
            {nearbyOnly && (
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 px-4 py-2 border rounded-xl text-xs font-bold">
                <span className="text-slate-500">Distance:</span>
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={distanceRange}
                  onChange={(e) => setDistanceRange(parseInt(e.target.value))}
                  className="w-24 cursor-pointer accent-primary"
                />
                <span className="text-primary">{distanceRange >= 1000 ? `${(distanceRange/1000).toFixed(1)}km` : `${distanceRange}m`}</span>
              </div>
            )}

            {/* Near Me Toggle */}
            <button
              onClick={handleNearbyToggle}
              className={`flex items-center gap-2 px-4.5 py-3 rounded-xl border text-xs font-extrabold transition-all ${
                nearbyOnly 
                  ? 'bg-primary/10 border-primary text-primary dark:bg-primary/20' 
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350'
              }`}
            >
              <Navigation className={`w-3.5 h-3.5 ${nearbyOnly ? 'fill-current animate-pulse' : ''}`} />
              <span>{t.nearby}</span>
            </button>

            {/* Sorter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none"
            >
              <option value="priority">AI Priority Score</option>
              <option value="newest">Newest First</option>
              <option value="verified">Most Verified</option>
              <option value="views">Most Viewed</option>
            </select>
          </div>
        </div>

        {/* Widened Quick Category Filters */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Category Filters (WIDENED)</span>
          </h3>
          <div className="flex overflow-x-auto gap-3 pb-2 -mx-2 px-2 scrollbar-none select-none">
            {categories.map(cat => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border min-w-[140px] ${
                  selectedCategory === cat.name
                    ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-650 dark:text-slate-350 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex border-t border-slate-100 dark:border-slate-700/50 pt-4 flex-wrap gap-2 text-xs font-semibold">
          {statuses.map(st => (
            <button
              key={st.name}
              onClick={() => setSelectedStatus(st.name)}
              className={`px-4.5 py-2 rounded-lg ${
                selectedStatus === st.name
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </section>

      {/* Grid: Community Challenges & Leaderboard */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Challenges */}
        <div className="md:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm space-y-4 text-xs">
          <h3 className="font-extrabold text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
            <Compass className="w-5 h-5 text-primary" />
            <span>Active Community Challenges</span>
          </h3>
          <div className="space-y-4">
            {challenges.map(chg => (
              <div key={chg.id} className="space-y-1.5 font-bold">
                <div className="flex justify-between items-center text-slate-655">
                  <span>🎯 {chg.title}</span>
                  <span className="text-primary">{chg.current}/{chg.target} ({Math.round((chg.current/chg.target)*100)}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${(chg.current/chg.target)*100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm space-y-4 text-xs">
          <h3 className="font-extrabold text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
            <Award className="w-5 h-5 text-warning" />
            <span>Local Contributors Leaderboard</span>
          </h3>
          <div className="space-y-3.5 font-bold">
            {leaderboard.map(user => (
              <div key={user.name} className="flex justify-between items-center p-2 rounded-xl bg-slate-50/50 dark:bg-slate-900/10">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-extrabold">{user.rank}</span>
                  <span className="text-slate-800 dark:text-slate-200">{user.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-primary">{user.points} pts</p>
                  <p className="text-[8px] text-slate-400 mt-0.5">{user.badge}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Issues feed */}
      <section className="space-y-4">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">Active Complaints Feed</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-white dark:bg-slate-800 rounded-2xl h-80 border border-slate-200 dark:border-slate-700/50 shadow-sm animate-pulse"></div>
            ))}
          </div>
        ) : !issuesResponse?.data || issuesResponse.data.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border p-12 text-center text-xs text-slate-400 font-bold">
            No complaints found matching current filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {issuesResponse.data.map(issue => (
              <Link 
                to={`/issue/${issue._id}`}
                key={issue._id}
                className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-md flex flex-col overflow-hidden"
              >
                {/* Image */}
                <div className="h-44 relative bg-slate-100 dark:bg-slate-900 overflow-hidden">
                  <img
                    src={issue.imageUrl?.startsWith('http') ? issue.imageUrl : `http://localhost:5000${issue.imageUrl}`}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?q=80&w=400'}
                  />
                  
                  {/* Status */}
                  <span className={`absolute top-3 right-3 text-[9px] font-extrabold px-2.5 py-1 rounded-full shadow-md text-white ${
                    issue.status === 'Resolved' ? 'bg-success' :
                    issue.status === 'In Progress' ? 'bg-warning' :
                    issue.status === 'Assigned' ? 'bg-primary' :
                    'bg-slate-500'
                  }`}>
                    {issue.status}
                  </span>

                  {/* Priority score tag */}
                  <span className="absolute bottom-3 left-3 bg-slate-950/70 text-white font-extrabold text-[9px] px-2 py-0.5 rounded backdrop-blur-sm">
                    AI Priority Score: {issue.priorityScore}/100
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between text-xs font-semibold">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase mb-1">
                      <span>{issue.category}</span>
                      <span>•</span>
                      <span>{issue.location?.ward}</span>
                    </div>

                    <h3 className="font-extrabold text-slate-800 dark:text-white text-base group-hover:text-primary transition-colors line-clamp-1">
                      {issue.title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed font-medium">
                      {issue.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex flex-col gap-3">
                    <div className="flex items-center gap-1 text-slate-500 truncate">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                      <span>{issue.location?.address}</span>
                    </div>

                    {/* Quick upvote controls */}
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => handleVote(e, issue._id, 'like')}
                          className="bg-slate-50 dark:bg-slate-950 border p-2 rounded-lg text-slate-500 hover:text-primary flex items-center gap-1"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{issue.likes || 0}</span>
                        </button>
                        <button
                          onClick={(e) => handleVote(e, issue._id, 'confirm')}
                          className="bg-slate-50 dark:bg-slate-950 border p-2 rounded-lg text-slate-500 hover:text-success flex items-center gap-1"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>{issue.verificationCount || 0} Confirmations</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-0.5 text-slate-400">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{issue.views || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default HomePage;
