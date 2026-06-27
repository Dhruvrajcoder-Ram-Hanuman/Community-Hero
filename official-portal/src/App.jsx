import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ListTodo, Map, Building2, BarChart3, FileSpreadsheet, 
  Bell, Settings, ShieldAlert, Menu, X, LogOut 
} from 'lucide-react';
import api from './services/api';

import DashboardPage from './pages/Dashboard';
import AllIssuesPage from './pages/AllIssues';
import IssueDetailsPage from './pages/IssueDetails';
import MapDashboardPage from './pages/MapDashboard';
import DepartmentManagementPage from './pages/DepartmentManagement';
import AnalyticsPage from './pages/Analytics';
import ReportsPage from './pages/Reports';
import SettingsPage from './pages/Settings';
import LoginPage from './pages/Login';

function DashboardLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showBellMenu, setShowBellMenu] = useState(false);

  // Authentication check guard
  useEffect(() => {
    if (location.pathname !== '/login') {
      if (localStorage.getItem('official_authenticated') !== 'true') {
        navigate('/login');
      }
    }
  }, [location.pathname, navigate]);

  // Poll alerts every 8 seconds for instant dashboard sync
  useEffect(() => {
    if (localStorage.getItem('official_authenticated') === 'true') {
      const fetchAlerts = () => {
        api.get('/notifications?user=official')
          .then(data => setNotifications(data.slice(0, 10)))
          .catch(err => console.log(err));
      };
      fetchAlerts();
      const timer = setInterval(fetchAlerts, 8000);
      return () => clearInterval(timer);
    }
  }, [location.pathname]);

  const activeLink = (path) => {
    return location.pathname === path 
      ? 'bg-blue-600 text-white font-bold' 
      : 'text-slate-350 hover:bg-slate-800 hover:text-white';
  };

  const handleLogout = () => {
    localStorage.removeItem('official_authenticated');
    navigate('/login');
  };

  if (location.pathname === '/login') {
    return <div className="bg-slate-50 min-h-screen">{children}</div>;
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markNotificationRead = (id) => {
    api.patch(`/notifications/${id}/read`)
      .then(() => {
        setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      })
      .catch(err => console.log(err));
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-700 select-none">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-905 bg-slate-900 text-slate-300 border-r border-slate-850">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-850">
          <span className="text-xl">🏛️</span>
          <span className="font-extrabold text-white bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent text-xs uppercase tracking-wider">
            Control Console
          </span>
        </div>

        {/* Links */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto text-xs font-bold">
          <Link to="/" className={`flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all ${activeLink('/')}`}>
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <Link to="/issues" className={`flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all ${activeLink('/issues')}`}>
            <ListTodo className="w-4 h-4" />
            <span>Issues Grid</span>
          </Link>
          <Link to="/map" className={`flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all ${activeLink('/map')}`}>
            <Map className="w-4 h-4" />
            <span>Heat Map View</span>
          </Link>
          <Link to="/departments" className={`flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all ${activeLink('/departments')}`}>
            <Building2 className="w-4 h-4" />
            <span>Departments Queue</span>
          </Link>
          <Link to="/analytics" className={`flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all ${activeLink('/analytics')}`}>
            <BarChart3 className="w-4 h-4" />
            <span>Analytics Charts</span>
          </Link>
          <Link to="/reports" className={`flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all ${activeLink('/reports')}`}>
            <FileSpreadsheet className="w-4 h-4" />
            <span>Audit Reports</span>
          </Link>
          <Link to="/settings" className={`flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all ${activeLink('/settings')}`}>
            <Settings className="w-4 h-4" />
            <span>Console Settings</span>
          </Link>
        </nav>

        {/* Logout and Profile */}
        <div className="p-4 border-t border-slate-850 text-[10px] text-slate-500 font-bold space-y-2">
          <div className="leading-tight">
            <p className="text-slate-350">Dhruvraj</p>
            <p className="text-slate-500 font-medium">Session Active</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full bg-slate-800 text-slate-300 hover:text-white py-1.5 rounded-lg flex items-center justify-center gap-1.5 font-bold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Content pane */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="font-extrabold text-slate-800 text-base sm:text-lg">Smart City Command Hub</h2>
          </div>

          {/* Right menu bar */}
          <div className="flex items-center gap-4 text-xs font-bold">
            {/* Bell Alert Notification */}
            <div className="relative">
              <button onClick={() => setShowBellMenu(!showBellMenu)} className="p-2 hover:bg-slate-100 rounded-lg relative">
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-error text-white text-[8px] font-black rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showBellMenu && (
                <div className="absolute right-0 mt-2 bg-white border rounded-xl shadow-2xl py-2 w-72 z-50 text-[10px] leading-relaxed">
                  <h4 className="font-extrabold text-slate-800 px-3 pb-2 border-b flex justify-between items-center">
                    <span>Tactical Notifications</span>
                    <button onClick={() => setShowBellMenu(false)} className="text-primary hover:underline">Close</button>
                  </h4>
                  <div className="max-h-60 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-slate-400 text-center py-4">No recent alerts</p>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n._id}
                          onClick={() => markNotificationRead(n._id)}
                          className={`p-3 border-b hover:bg-slate-50 cursor-pointer flex gap-1.5 ${!n.isRead ? 'bg-blue-50/20' : ''}`}
                        >
                          <ShieldAlert className="w-4 h-4 text-error flex-shrink-0" />
                          <div>
                            <p className="font-extrabold text-slate-850">{n.title}</p>
                            <p className="text-slate-500 leading-normal">{n.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Officer card */}
            <div className="flex items-center gap-2 border-l pl-4">
              <span className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-extrabold flex items-center justify-center text-xs">O</span>
              <div className="hidden sm:block text-left text-[10px] leading-tight">
                <p className="font-extrabold">Dhruvraj</p>
                <p className="text-slate-400">Chief Officer</p>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex lg:hidden">
            <div className="w-60 bg-slate-950 text-slate-350 p-5 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="font-black text-white text-sm">COMMAND HUB</span>
                  <button onClick={() => setMobileMenuOpen(false)}>
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
                
                <nav onClick={() => setMobileMenuOpen(false)} className="space-y-2 text-xs font-bold">
                  <Link to="/" className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${activeLink('/')}`}>
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <Link to="/issues" className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${activeLink('/issues')}`}>
                    <ListTodo className="w-4 h-4" />
                    <span>Issues Grid</span>
                  </Link>
                  <Link to="/map" className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${activeLink('/map')}`}>
                    <Map className="w-4 h-4" />
                    <span>Heat Map</span>
                  </Link>
                  <Link to="/departments" className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${activeLink('/departments')}`}>
                    <Building2 className="w-4 h-4" />
                    <span>Departments Queue</span>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full mt-4 bg-slate-800 text-slate-300 py-2 rounded-xl flex items-center justify-center gap-1.5 font-bold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/issues" element={<AllIssuesPage />} />
          <Route path="/issue/:id" element={<IssueDetailsPage />} />
          <Route path="/map" element={<MapDashboardPage />} />
          <Route path="/departments" element={<DepartmentManagementPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </DashboardLayout>
    </Router>
  );
}

export default App;
