import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Filter } from 'lucide-react';
import api from '../services/api';

function MapDashboardPage() {
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState({
    Pending: true,
    Assigned: true,
    'In Progress': true,
    Resolved: true
  });

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersGroupRef = useRef(null);
  const heatGroupRef = useRef(null);

  useEffect(() => {
    api.get('/issues')
      .then(response => {
        const list = Array.isArray(response) ? response : (response?.data || []);
        setIssues(list);
        setLoading(false);
      })
      .catch(err => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  // Filter Trigger
  useEffect(() => {
    let result = issues;
    if (filterCategory !== 'All') {
      result = result.filter(i => i.category === filterCategory);
    }
    result = result.filter(i => filterStatus[i.status] === true);
    setFilteredIssues(result);
  }, [issues, filterCategory, filterStatus]);

  // Leaflet Map Init
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([12.9716, 77.5946], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);

      heatGroupRef.current = L.layerGroup().addTo(mapRef.current);
      markersGroupRef.current = L.layerGroup().addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersGroupRef.current = null;
        heatGroupRef.current = null;
      }
    };
  }, []);

  // Draw Overlay Circles & Pins
  useEffect(() => {
    if (markersGroupRef.current && heatGroupRef.current) {
      markersGroupRef.current.clearLayers();
      heatGroupRef.current.clearLayers();

      filteredIssues.forEach(issue => {
        const lat = issue.location?.latitude;
        const lng = issue.location?.longitude;

        if (lat && lng) {
          const color = getStatusColor(issue.status, issue.priority);

          // Heat Zone Circle with status-specific colors
          const getStatusHeatColor = (s) => {
            switch (s) {
              case 'Resolved': return '#10B981'; // Green
              case 'In Progress': return '#F59E0B'; // Yellow/Amber
              case 'Assigned': return '#2563EB'; // Blue
              default: return '#EF4444'; // Red for Pending
            }
          };
          const heatColor = getStatusHeatColor(issue.status);

          L.circle([lat, lng], {
            radius: 150,
            color: heatColor,
            fillColor: heatColor,
            fillOpacity: 0.16,
            weight: 1
          }).addTo(heatGroupRef.current);

          // Marker Pin
          const markerIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.4); cursor: pointer;"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });

          const marker = L.marker([lat, lng], { icon: markerIcon });
          
          const popupHtml = `
            <div style="font-family: 'Inter', sans-serif; width: 180px; text-align: left; padding: 2px;">
              <span style="background: ${color}15; color: ${color}; font-size: 8px; font-weight: bold; text-transform: uppercase; padding: 1px 5px; border-radius: 4px;">
                ${issue.status}
              </span>
              <h4 style="font-weight: 800; font-size: 11px; margin: 5px 0 2px 0; color: #1e293b;">
                ${issue.title}
              </h4>
              <p style="font-size: 9px; color: #64748b; margin: 0 0 5px 0;">
                📍 ${issue.location?.ward} (${issue.priority} Priority)
              </p>
              <a href="/issue/${issue._id}" 
                 style="background: #0F172A; color: white; border-radius: 6px; padding: 4.5px; font-size: 9px; font-weight: bold; text-align: center; text-decoration: none; display: block;">
                Open Command File
              </a>
            </div>
          `;

          marker.bindPopup(popupHtml, { closeButton: false });
          markersGroupRef.current.addLayer(marker);
        }
      });
    }
  }, [filteredIssues]);

  const getStatusColor = (status, priority) => {
    if (priority === 'Critical' && status !== 'Resolved') return '#DC2626';
    switch (status) {
      case 'Resolved': return '#16A34A';
      case 'In Progress': return '#F59E0B';
      case 'Assigned': return '#2563EB';
      case 'Pending':
      default: 
        return '#DC2626'; // Red for pending
    }
  };

  const categories = ['All', 'Road', 'Garbage', 'Street Light', 'Water', 'Electricity', 'Drainage', 'Traffic'];

  return (
    <div className="relative h-[calc(100vh-140px)] md:h-[calc(100vh-180px)] rounded-3xl overflow-hidden border shadow-lg">
      <div ref={mapContainerRef} className="w-full h-full z-10"></div>

      {/* Control Sidebar */}
      <div className="absolute top-4 left-4 z-20 w-64 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl border text-xs space-y-3">
        <h3 className="font-bold text-slate-850 flex items-center gap-1.5 border-b pb-2">
          <Filter className="w-4 h-4 text-primary-active" />
          <span>Interactive Heat Map</span>
        </h3>

        <div className="space-y-1">
          <label className="font-semibold text-slate-400">Category</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-slate-50 border rounded-lg p-2 font-bold"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-slate-400">Status Checkbox</label>
          <div className="grid grid-cols-2 gap-1.5 font-bold text-[9px]">
            {Object.keys(filterStatus).map(s => (
              <label key={s} className="flex items-center gap-1.5 cursor-pointer bg-slate-50 border p-1.5 rounded-lg">
                <input
                  type="checkbox"
                  checked={filterStatus[s]}
                  onChange={() => setFilterStatus({ ...filterStatus, [s]: !filterStatus[s] })}
                  className="rounded text-primary focus:ring-0 w-3 h-3"
                />
                <span className="truncate">{s}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="border-t pt-2.5">
          <p className="font-bold text-slate-450 uppercase text-[9px] mb-1">Density Legend</p>
          <div className="space-y-1.5 text-[9px] font-bold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-red-500/20 border border-red-500 rounded-full inline-block"></span>
              <span>Red: Pending Review</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-blue-500/20 border border-blue-500 rounded-full inline-block"></span>
              <span>Blue: Assigned Dept</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-amber-500/20 border border-amber-500 rounded-full inline-block"></span>
              <span>Yellow: In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-emerald-500/20 border border-emerald-500 rounded-full inline-block"></span>
              <span>Green: Resolved</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapDashboardPage;
