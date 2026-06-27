import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User } from 'lucide-react';

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'Dhruvraj' && password === '1245') {
      localStorage.setItem('official_authenticated', 'true');
      navigate('/');
    } else {
      setError('Invalid officer username or password key.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white border rounded-2xl w-full max-w-sm p-8 shadow-sm space-y-6 text-xs font-semibold text-slate-700">
        
        {/* Government Emblem style header */}
        <div className="text-center space-y-2 border-b pb-5">
          <span className="text-3xl">🏛️</span>
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">Command Control Console</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Authorized Officers Sign-In Only</p>
        </div>

        {error && (
          <div className="bg-red-50 text-error border border-red-100 p-3 rounded-lg text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 font-bold">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 uppercase">Officer Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                required
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border rounded-xl focus:outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 uppercase">Access Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="password"
                required
                placeholder="Enter password code"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-950 text-white font-extrabold py-3 rounded-xl active:scale-95 transition-transform mt-2"
          >
            Authenticate Session
          </button>
        </form>

        <div className="text-[9px] text-slate-400 leading-normal text-center select-none font-medium">
          🔒 Section 43A IT Act Compliant Portal. Access logs are monitored by the municipal network security.
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
