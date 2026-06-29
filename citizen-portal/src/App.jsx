import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Plus, Map, User, Sun, Moon, Bell, Languages, Award } from 'lucide-react';
import api from './services/api';

import HomePage from './pages/Home';
import ReportIssuePage from './pages/ReportIssue';
import IssueDetailsPage from './pages/IssueDetails';
import MapPage from './pages/MapPage';
import ProfilePage from './pages/Profile';
import LeaderboardPage from './pages/Leaderboard';
import AccessibilityBar from './components/ui/AccessibilityBar';
import Chatbot from './components/ui/Chatbot';

export const translations = {
  en: {
    title: "Community Hero",
    tagline: "Report. Track. Improve Your Community.",
    navHome: "Home Feed",
    navReport: "Submit Issue",
    navMap: "Interactive Map",
    navProfile: "My Account",
    navLeaderboard: "Leaderboard",
    searchPlaceholder: "Search roads, garbage, location...",
    statsReports: "Reports Mapped",
    statsResolved: "Resolved Cases",
    statsRate: "Resolution Rate",
    statsActive: "Active Wards",
    quickFilters: "Category Filters",
    all: "All Issues",
    road: "Road & Potholes",
    garbage: "Garbage & Dumping",
    streetLight: "Street Light Defects",
    water: "Water Pipe Leaks",
    electricity: "Power Outages",
    drainage: "Drainage Overflow",
    traffic: "Traffic Signals",
    others: "Other Reports",
    nearby: "Nearby Me",
    trending: "Trending Areas",
    comments: "Comments",
    verificationScore: "Contribution Score",
    points: "Points",
    badges: "Achievements"
  },
  hi: {
    title: "कम्युनिटी हीरो",
    tagline: "शिकायत करें। ट्रैक करें। अपने समुदाय को सुधारें।",
    navHome: "मुख्य पृष्ठ",
    navReport: "समस्या दर्ज करें",
    navMap: "सक्रिय नक्शा",
    navProfile: "मेरा खाता",
    navLeaderboard: "लीडरबोर्ड",
    searchPlaceholder: "सड़क, कचरा, स्थान खोजें...",
    statsReports: "कुल शिकायतें",
    statsResolved: "सुलझाई गई",
    statsRate: "समाधान दर",
    statsActive: "सक्रिय वार्ड",
    quickFilters: "श्रेणी फ़िल्टर",
    all: "सभी मामले",
    road: "सड़क और गड्ढे",
    garbage: "कचरा और डंपिंग",
    streetLight: "बिक्री स्ट्रीटलाइट",
    water: "पानी की पाइप लाइन",
    electricity: "बिजली कटौती",
    drainage: "गंदे पानी का निकास",
    traffic: "यातायात सिग्नल",
    others: "अन्य रिपोर्ट",
    nearby: "मेरे पास",
    trending: "ट्रेंडिंग वार्ड",
    comments: "टिप्पणियां",
    verificationScore: "योगदान स्कोर",
    points: "अंक",
    badges: "उपलब्धियां"
  },
  kn: {
    title: "ಕಮ್ಯೂನಿಟಿ ಹೀರೊ",
    tagline: "ವರದಿ ಮಾಡಿ. ಟ್ರ್ಯಾಕ್ ಮಾಡಿ. ನಿಮ್ಮ ಸಮುದಾಯ ಸುಧಾರಿಸಿ.",
    navHome: "ಮುಖಪುಟ",
    navReport: "ವರದಿ ಮಾಡಿ",
    navMap: "ನಕ್ಷೆ",
    navProfile: "ನನ್ನ ಪ್ರೊಫೈಲ್",
    navLeaderboard: "ಲೀಡರ್ಬೋರ್ಡ್",
    searchPlaceholder: "ರಸ್ತೆ, ಕಸ, ಸ್ಥಳ ಹುಡುಕಿ...",
    statsReports: "ಒಟ್ಟು ವರದಿಗಳು",
    statsResolved: "ಪರಿಹರಿಸಲಾಗಿದೆ",
    statsRate: "ಪರಿಹಾರ ದರ",
    statsActive: "ಸಕ್ರಿಯ ವಾರ್ಡ್ಗಳು",
    quickFilters: "ವರ್ಗ ಫಿಲ್ಟರ್ಗಳು",
    all: "ಎಲ್ಲಾ ಸಮಸ್ಯೆಗಳು",
    road: "ರಸ್ತೆ ಮತ್ತು ಗುಂಡಿಗಳು",
    garbage: "ಕಸ ವಿಲೇವಾರಿ",
    streetLight: "ಬೀದಿ ದೀಪ ದುರಸ್ತಿ",
    water: "ನೀರಿನ ಪೈಪ್ ಸೋರಿಕೆ",
    electricity: "ವಿದ್ಯುತ್ ಸ್ಥಗಿತ",
    drainage: "ಚರಂಡಿ ಉಕ್ಕಿ ಹರಿಯುವಿಕೆ",
    traffic: "ಸಂಚಾರ ಸಿಗ್ನಲ್",
    others: "ಇತರ ವರದಿಗಳು",
    nearby: "ನನ್ನ ಹತ್ತಿರ",
    trending: "ಟ್ರೆಂಡಿಂಗ್ ಪ್ರದೇಶ",
    comments: "ಕಾಮೆಂಟ್‌ಗಳು",
    verificationScore: "ಕೊಡುಗೆ ಸ್ಕೋರ್",
    points: "ಅಂಕಗಳು",
    badges: "ಸಾಧನೆಗಳು"
  }
};

function MainLayout({ children, darkMode, setDarkMode, language, setLanguage, toast }) {
  const location = useLocation();
  const t = translations[language];
  const [notifications, setNotifications] = useState([]);
  const [showBellMenu, setShowBellMenu] = useState(false);

  useEffect(() => {
    api.get('/notifications?user=citizen')
      .then(data => setNotifications(data.slice(0, 5)))
      .catch(err => console.log('Notifications load fail', err));
  }, [location.pathname]);

  const markNotificationRead = (id) => {
    api.patch(`/notifications/${id}/read`)
      .then(() => {
        setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      })
      .catch(err => console.log(err));
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Toast popup */}
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce text-xs">
          <span>✅</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Accessibility Floating Tool Bar */}
      <AccessibilityBar />

      {/* AI Conversational Chatbot Widget */}
      <Chatbot />

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl md:text-2xl">
            <span className="bg-primary/10 text-primary p-2 rounded-lg">🛡️</span>
            <span className="hidden sm:inline bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent font-extrabold">{t.title}</span>
            <span className="sm:hidden text-primary font-extrabold">C-Hero</span>
          </Link>

          {/* Nav tabs (Desktop) */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className={`font-semibold text-xs uppercase tracking-wider transition-colors ${location.pathname === '/' ? 'text-primary' : 'text-slate-650 dark:text-slate-355 hover:text-primary'}`}>{t.navHome}</Link>
            <Link to="/report" className={`font-semibold text-xs uppercase tracking-wider transition-colors ${location.pathname === '/report' ? 'text-primary' : 'text-slate-650 dark:text-slate-355 hover:text-primary'}`}>{t.navReport}</Link>
            <Link to="/map" className={`font-semibold text-xs uppercase tracking-wider transition-colors ${location.pathname === '/map' ? 'text-primary' : 'text-slate-650 dark:text-slate-355 hover:text-primary'}`}>{t.navMap}</Link>
            <Link to="/leaderboard" className={`font-semibold text-xs uppercase tracking-wider transition-colors ${location.pathname === '/leaderboard' ? 'text-primary' : 'text-slate-650 dark:text-slate-355 hover:text-primary'}`}>{t.navLeaderboard}</Link>
            <Link to="/profile" className={`font-semibold text-xs uppercase tracking-wider transition-colors ${location.pathname === '/profile' ? 'text-primary' : 'text-slate-650 dark:text-slate-355 hover:text-primary'}`}>{t.navProfile}</Link>
          </nav>

          {/* Language / Dark controls */}
          <div className="flex items-center gap-2.5">
            {/* Lang Dropdown */}
            <div className="relative group">
              <button className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1 text-xs font-bold">
                <Languages className="w-4 h-4 text-slate-400" />
                <span className="uppercase">{language}</span>
              </button>
              <div className="absolute right-0 mt-1 hidden group-hover:block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 w-24 z-50 text-xs">
                <button onClick={() => setLanguage('en')} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold">English</button>
                <button onClick={() => setLanguage('hi')} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold">हिंदी</button>
                <button onClick={() => setLanguage('kn')} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold">ಕನ್ನಡ</button>
              </div>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setShowBellMenu(!showBellMenu)} className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative">
                <Bell className="w-4.5 h-4.5" />
                {notifications.some(n => !n.isRead) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full animate-pulse"></span>
                )}
              </button>
              {showBellMenu && (
                <div className="absolute right-0 mt-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-2 w-72 z-50 text-[10px] leading-relaxed">
                  <h4 className="font-extrabold text-slate-700 dark:text-slate-300 px-3 pb-2 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                    <span>Notifications</span>
                    <button onClick={() => setShowBellMenu(false)} className="text-primary font-bold hover:underline">Close</button>
                  </h4>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-slate-400 text-center py-4">No recent updates</p>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n._id} 
                          onClick={() => markNotificationRead(n._id)}
                          className={`p-3 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${!n.isRead ? 'bg-primary/5' : ''}`}
                        >
                          <p className="font-bold text-slate-800 dark:text-slate-250">{n.title}</p>
                          <p className="text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dark Mode toggle */}
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Pages View */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 md:py-8">
        {children}
      </main>

      {/* FAB Mobile Button */}
      <Link 
        to="/report" 
        className="fixed bottom-20 md:bottom-8 right-6 z-40 bg-primary hover:bg-primary-dark text-white p-4 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </Link>

      {/* Mobile Nav Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 py-2 px-6 flex justify-around items-center text-[10px] font-semibold select-none shadow-lg">
        <Link to="/" className={`flex flex-col items-center gap-0.5 ${location.pathname === '/' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>
          <Home className="w-5 h-5" />
          <span>Feed</span>
        </Link>
        <Link to="/map" className={`flex flex-col items-center gap-0.5 ${location.pathname === '/map' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>
          <Map className="w-5 h-5" />
          <span>Map</span>
        </Link>
        <Link to="/leaderboard" className={`flex flex-col items-center gap-0.5 ${location.pathname === '/leaderboard' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>
          <Award className="w-5 h-5" />
          <span>Leaderboard</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center gap-0.5 ${location.pathname === '/profile' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>
          <User className="w-5 h-5" />
          <span>Profile</span>
        </Link>
      </div>

      {/* Footer */}
      <footer className="bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-850 py-6 text-center text-[10px] text-slate-500 dark:text-slate-450 pb-20 md:pb-6 select-none font-medium">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Municipal Command Services Platform. Accessible Smart City Digital Initiative.</p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true' || 
      (!('darkMode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  const [toast, setToast] = useState('');

  const showNotification = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  return (
    <Router>
      <MainLayout 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        language={language} 
        setLanguage={setLanguage}
        toast={toast}
      >
        <Routes>
          <Route path="/" element={<HomePage language={language} />} />
          <Route path="/report" element={<ReportIssuePage language={language} showNotification={showNotification} />} />
          <Route path="/issue/:id" element={<IssueDetailsPage language={language} />} />
          <Route path="/map" element={<MapPage language={language} />} />
          <Route path="/leaderboard" element={<LeaderboardPage language={language} />} />
          <Route path="/profile" element={<ProfilePage language={language} />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
