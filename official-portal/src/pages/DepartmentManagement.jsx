import React, { useState, useEffect } from 'react';
import { Building2, User, Mail, Award, CheckCircle, Clock } from 'lucide-react';
import api from '../services/api';

function DepartmentManagementPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics')
      .then(data => {
        if (data.departmentData) {
          setDepartments(data.departmentData);
        }
        setLoading(false);
      })
      .catch(err => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  const getOfficerName = (dept) => {
    switch (dept) {
      case 'Road': return 'M. Srinivas';
      case 'Water': return 'R. K. Nagaraj';
      case 'Electricity': return 'V. Sundaram';
      case 'Drainage': return 'K. Gangadhar';
      case 'Garbage': return 'Smt. Lakshmi';
      default: return 'K. P. Rao';
    }
  };

  const getOfficerEmail = (dept) => {
    return `${dept.toLowerCase().replace(' ', '')}@bengaluru.gov.in`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Municipal Department Queues</h1>
        <p className="text-xs text-slate-500 font-semibold mt-0.5">Route audits and performance monitoring board.</p>
      </div>

      {loading ? (
        <p className="text-center py-12 animate-pulse font-bold text-slate-450">Syncing queues...</p>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs font-semibold">
          {departments.map(dept => (
            <div key={dept.name} className="bg-white border rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
              
              {/* Top details */}
              <div className="space-y-3.5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base">🏢</span>
                    <h3 className="font-extrabold text-slate-800 text-sm">{dept.name} Department</h3>
                  </div>
                  <span className="bg-emerald-50 text-success font-black text-[9px] px-2.5 py-0.5 rounded border border-emerald-100">
                    {dept.rate}% Solved
                  </span>
                </div>

                <div className="space-y-1.5 text-[10px] text-slate-500 font-bold border-t pt-3">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Head Officer: {getOfficerName(dept.name)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hover:underline cursor-pointer">{getOfficerEmail(dept.name)}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4 text-center text-[10px] font-bold mt-4">
                <div className="bg-slate-50 p-2.5 rounded-xl border">
                  <span className="text-slate-400 uppercase tracking-wide text-[8px]">Assigned</span>
                  <p className="text-slate-800 text-base font-extrabold mt-0.5">{dept.total || 0}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border">
                  <span className="text-slate-400 uppercase tracking-wide text-[8px]">Resolved</span>
                  <p className="text-success text-base font-extrabold mt-0.5">{dept.resolved || 0}</p>
                </div>
              </div>

            </div>
          ))}
        </section>
      )}
    </div>
  );
}

export default DepartmentManagementPage;
