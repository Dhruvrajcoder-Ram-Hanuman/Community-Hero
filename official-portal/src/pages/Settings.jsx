import React from 'react';
import { Shield, Database, Bell, Settings } from 'lucide-react';
import api from '../services/api';

function SettingsPage() {
  const triggerCleanup = () => {
    api.post('/issues/trigger-cleanup')
      .then(res => {
        alert(res.message || "Manual 7-day SLA Resolved Purge Task completed successfully!");
      })
      .catch(err => {
        alert("SLA cleanup trigger error: " + err.message);
      });
  };

  return (
    <div className="space-y-6 text-xs font-semibold text-slate-700">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Console Configuration Settings</h1>
        <p className="text-xs text-slate-500 font-semibold mt-0.5">Control settings and database purge tools.</p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Core Controls */}
        <div className="bg-white border p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 border-b pb-2">
            <Settings className="w-5 h-5 text-slate-500" />
            <span>General Rules</span>
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl">
              <div>
                <p className="font-bold text-slate-850">Community Verification Target</p>
                <p className="text-[10px] text-slate-455 font-medium leading-normal mt-0.5">Automatic confirmation threshold before marker moves to verified state.</p>
              </div>
              <span className="bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg font-black">15 Votes</span>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl">
              <div>
                <p className="font-bold text-slate-850">Geographic Proximity Lock</p>
                <p className="text-[10px] text-slate-455 font-medium leading-normal mt-0.5">Submit locks that block similar category entries in coordinates radius.</p>
              </div>
              <span className="bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg font-black">30 Meters</span>
            </div>
          </div>
        </div>

        {/* Database SLA Cleanups */}
        <div className="bg-white border p-6 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-850 text-sm flex items-center gap-1.5 border-b pb-2">
              <Database className="w-5 h-5 text-slate-550" />
              <span>Database SLA Purge Maintenance</span>
            </h3>

            <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">
              The system runs an automated hourly task. Issues marked **Resolved** are kept for 7 days (to allow citizens to inspect them in before/after sliders) and are then permanently purged to keep coordinates charts clean.
            </p>
          </div>

          <button
            onClick={triggerCleanup}
            className="w-full bg-blue-600 hover:bg-blue-750 text-white font-extrabold py-3.5 rounded-xl mt-4 active:scale-95 transition-transform"
          >
            Force Manual Clean Up Purge Task
          </button>
        </div>

      </section>
    </div>
  );
}

export default SettingsPage;
