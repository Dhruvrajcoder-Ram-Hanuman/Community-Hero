import React, { useState, useEffect } from 'react';
import { Award, ShieldCheck, Star, Trophy, Sparkles } from 'lucide-react';
import api from '../services/api';

function LeaderboardPage({ language }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics')
      .then(data => {
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
        }
        setLoading(false);
      })
      .catch(err => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  // Top 3 Podium spots
  const podium = leaderboard.slice(0, 3);
  const others = leaderboard.slice(3);

  const getPodiumStyles = (rank) => {
    switch (rank) {
      case 1: return {
        bg: 'bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500 text-white',
        border: 'border-yellow-200',
        height: 'h-40',
        badge: '👑 Gold Champion'
      };
      case 2: return {
        bg: 'bg-gradient-to-b from-slate-200 via-slate-350 to-slate-400 text-slate-900',
        border: 'border-slate-200',
        height: 'h-32',
        badge: '🥈 Silver Runner'
      };
      case 3: return {
        bg: 'bg-gradient-to-b from-amber-600 via-amber-700 to-amber-800 text-white',
        border: 'border-amber-500',
        height: 'h-28',
        badge: '🥉 Bronze Elite'
      };
      default: return null;
    }
  };

  return (
    <div className="space-y-8 pb-12 text-xs font-semibold text-slate-700">
      {/* Title */}
      <div className="text-center space-y-2 select-none">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
          <Trophy className="w-8 h-8 text-warning animate-bounce" />
          <span>Community Heroes Leaderboard</span>
        </h1>
        <p className="text-xs text-slate-500 font-semibold max-w-md mx-auto">
          Honoring citizens who verify issues, report hazards, and actively participate in civic remediation.
        </p>
      </div>

      {loading ? (
        <p className="text-center py-12 animate-pulse text-slate-450">Compiling leaderboard listings...</p>
      ) : leaderboard.length === 0 ? (
        <p className="text-center py-12 text-slate-400 font-bold">No registered leaderboard files found.</p>
      ) : (
        <div className="space-y-8">
          {/* Podium for Top 3 */}
          <div className="flex justify-center items-end gap-3 md:gap-6 pt-8 max-w-xl mx-auto border-b pb-8 border-slate-100 dark:border-slate-800">
            {/* Rank 2 (Silver) */}
            {podium[1] && (() => {
              const styles = getPodiumStyles(2);
              return (
                <div className="flex flex-col items-center flex-1">
                  <div className="text-center mb-2">
                    <p className="font-extrabold text-slate-800 dark:text-slate-100 truncate w-24">{podium[1].name}</p>
                    <span className="text-[9px] font-bold text-slate-400">{podium[1].points} pts</span>
                  </div>
                  <div className={`w-full ${styles.height} ${styles.bg} border ${styles.border} rounded-t-2xl shadow-lg flex flex-col justify-between p-4 items-center`}>
                    <span className="text-lg font-black bg-white/20 px-3 py-1 rounded-full text-slate-850">2</span>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-center">{styles.badge}</p>
                  </div>
                </div>
              );
            })()}

            {/* Rank 1 (Gold) */}
            {podium[0] && (() => {
              const styles = getPodiumStyles(1);
              return (
                <div className="flex flex-col items-center flex-1">
                  <div className="text-center mb-2">
                    <p className="font-extrabold text-slate-900 dark:text-white truncate w-24 text-sm">{podium[0].name}</p>
                    <span className="text-[10px] font-bold text-primary">{podium[0].points} pts</span>
                  </div>
                  <div className={`w-full ${styles.height} ${styles.bg} border ${styles.border} rounded-t-2xl shadow-2xl flex flex-col justify-between p-4 items-center`}>
                    <span className="text-xl font-black bg-white/25 px-4 py-1.5 rounded-full text-slate-900">1</span>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-center">{styles.badge}</p>
                  </div>
                </div>
              );
            })()}

            {/* Rank 3 (Bronze) */}
            {podium[2] && (() => {
              const styles = getPodiumStyles(3);
              return (
                <div className="flex flex-col items-center flex-1">
                  <div className="text-center mb-2">
                    <p className="font-extrabold text-slate-850 dark:text-slate-200 truncate w-24">{podium[2].name}</p>
                    <span className="text-[9px] font-bold text-slate-400">{podium[2].points} pts</span>
                  </div>
                  <div className={`w-full ${styles.height} ${styles.bg} border ${styles.border} rounded-t-2xl shadow-md flex flex-col justify-between p-4 items-center`}>
                    <span className="text-lg font-black bg-white/20 px-3 py-1 rounded-full text-slate-900">3</span>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-center text-amber-100">{styles.badge}</p>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* List Table for Others */}
          <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b flex justify-between items-center text-slate-450 uppercase text-[10px] font-bold">
              <span>Contributor Rank</span>
              <span>Civic Achievements & Points</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {leaderboard.map((user) => (
                <div key={user.name} className="flex justify-between items-center p-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/10">
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs shadow-sm ${
                      user.rank === 1 ? 'bg-yellow-400 text-white' :
                      user.rank === 2 ? 'bg-slate-300 text-slate-800' :
                      user.rank === 3 ? 'bg-amber-600 text-white' :
                      'bg-slate-100 dark:bg-slate-900 text-slate-500'
                    }`}>
                      {user.rank}
                    </span>
                    <div>
                      <p className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                        <span>{user.name}</span>
                        {user.rank <= 3 && <Sparkles className="w-3.5 h-3.5 text-warning fill-current" />}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{user.badge}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-primary text-xs font-black">{user.points} points</p>
                    <p className="text-[8px] text-slate-400 font-semibold mt-0.5">Verified Contributor</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaderboardPage;
