import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Upload, MapPin, AlertOctagon, Sparkles, User, HelpCircle, Layers } from 'lucide-react';
import L from 'leaflet';
import { useCreateIssue } from '../hooks/useIssues';
import api from '../services/api';

function ReportIssuePage({ language, showNotification }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // AI Suggestion Panel state
  const [aiScanning, setAiScanning] = useState(false);
  const [aiSug, setAiSug] = useState(null);

  // Duplicate proximity states
  const [duplicateBlock, setDuplicateBlock] = useState(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  // Coordinate States
  const [latitude, setLatitude] = useState(12.9716);
  const [longitude, setLongitude] = useState(77.5946);
  const [address, setAddress] = useState('Sector 15, Near Metro Gate, Bangalore');
  const [ward, setWard] = useState('Ward 142');
  const [district, setDistrict] = useState('Bengaluru Urban');

  // Map references
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const createIssueMutation = useCreateIssue();

  // React Hook Form
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      category: 'Others'
    }
  });

  const watchTitle = watch('title');
  const watchDescription = watch('description');
  const watchCategory = watch('category');

  // Fetch coordinates on load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
      });
    }
  }, []);

  // AI smart suggestion on typing or image change
  useEffect(() => {
    if ((watchTitle && watchTitle.length > 5) || (watchDescription && watchDescription.length > 10)) {
      const delay = setTimeout(() => {
        api.post('/issues/ai-suggest', { title: watchTitle, description: watchDescription })
          .then(data => {
            setAiSug(data);
            setValue('category', data.category);
          })
          .catch(e => console.log(e));
      }, 700);
      return () => clearTimeout(delay);
    }
  }, [watchTitle, watchDescription, setValue]);

  // Duplicate Check hook (30m / 2 days block)
  useEffect(() => {
    if (latitude && longitude && watchCategory !== 'Others') {
      setCheckingDuplicate(true);
      api.post('/issues/check-duplicate', { latitude, longitude, category: watchCategory })
        .then(data => {
          if (data.duplicateFound) {
            setDuplicateBlock(data.duplicates[0]);
          } else {
            setDuplicateBlock(null);
          }
        })
        .catch(err => console.log(err))
        .finally(() => setCheckingDuplicate(false));
    }
  }, [latitude, longitude, watchCategory]);

  // Leaflet map setup on step 2
  useEffect(() => {
    if (step === 2 && mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([latitude, longitude], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);

      const markerIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #2563EB; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.4);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      markerRef.current = L.marker([latitude, longitude], { icon: markerIcon, draggable: true }).addTo(mapRef.current);

      const triggerReverseGeocode = (lat, lng) => {
        const offset = Math.round((lat + lng) * 1000) % 5;
        const wards = ['Ward 142 (Sector 15)', 'Ward 148 (Sector 21)', 'Ward 120 (Outer Ring Road)', 'Ward 104 (Kengeri)', 'Ward 131 (K.R. Market)'];
        setWard(wards[offset] || 'Ward 142');
        setAddress(`Street ${10 + offset}, ${wards[offset].split('(')[1].slice(0, -1)}, Bangalore, Karnataka, India`);
      };

      markerRef.current.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        setLatitude(pos.lat);
        setLongitude(pos.lng);
        triggerReverseGeocode(pos.lat, pos.lng);
      });

      mapRef.current.on('click', (e) => {
        const { lat, lng } = e.latlng;
        markerRef.current.setLatLng([lat, lng]);
        setLatitude(lat);
        setLongitude(lng);
        triggerReverseGeocode(lat, lng);
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [step]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));

      // Trigger AI scan simulation
      setAiScanning(true);
      setTimeout(() => {
        setAiScanning(false);
        const sug = {
          category: 'Road',
          subcategory: 'Pothole Damage',
          severity: 'High',
          riskLevel: 'Dangerous',
          diameter: '1.2 meters',
          suggestedDepartment: 'Road Department',
          confidence: 0.96
        };
        setAiSug(sug);
        setValue('category', 'Road');
      }, 1200);
    }
  };

  const onFormSubmit = (data) => {
    // If step 1, proceed to step 2
    if (step === 1) {
      setStep(2);
      return;
    }

    // Step 2 Submission (Blocked if duplicate exists)
    if (duplicateBlock) {
      alert("Submission Blocked: A duplicate issue exists nearby. Please upvote the existing issue instead.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('category', data.category);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    const locationData = {
      address,
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      ward,
      district,
      postalCode: '560001',
      latitude,
      longitude
    };
    formData.append('location', JSON.stringify(locationData));

    const contactData = {
      name: data.reporterName || 'Anonymous Citizen',
      phone: data.reporterPhone || '0000000000',
      email: data.reporterEmail || 'anonymous@communityhero.in'
    };
    formData.append('reportedBy', JSON.stringify(contactData));

    createIssueMutation.mutate(formData, {
      onSuccess: () => {
        showNotification("Issue Filed and Mapped Successfully!");
        navigate('/');
      },
      onError: (err) => {
        alert(err.message || "Failed reporting issue");
        setLoading(false);
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Progress Bar */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
          <span>{step === 1 ? 'Step 1: Description & Media' : 'Step 2: Location & Contact'}</span>
          <span>Progress {step * 50}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${step * 50}%` }}></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Panel */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="md:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm space-y-6">
          {step === 1 ? (
            <div className="space-y-5">
              <h2 className="text-lg font-black text-slate-800 dark:text-white">Describe the problem</h2>
              
              {/* Uploader */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 uppercase">Upload Issue Image</label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFileChange({ target: { files: e.dataTransfer.files } });
                  }}
                  className="border-2 border-dashed border-slate-250 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-primary/50 cursor-pointer bg-slate-50 dark:bg-slate-900/30 relative overflow-hidden flex flex-col justify-center items-center min-h-48"
                  onClick={() => document.getElementById('citizen-image').click()}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="space-y-2 text-xs">
                      <span className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-xl">📸</span>
                      <p><span className="text-primary font-bold hover:underline">Click to upload</span> or drag & drop</p>
                    </div>
                  )}
                  <input id="citizen-image" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase">Issue Title</label>
                <input
                  type="text"
                  placeholder="e.g. Huge water leakage on Main road"
                  {...register('title', { required: true })}
                  className="w-full px-4.5 py-3 border rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {errors.title && <span className="text-error text-[10px] font-bold">This field is required</span>}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase">Description</label>
                <textarea
                  rows="4"
                  placeholder="Describe the complaint details and safety hazards..."
                  {...register('description', { required: true })}
                  className="w-full px-4.5 py-3 border rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-primary"
                ></textarea>
                {errors.description && <span className="text-error text-[10px] font-bold">This field is required</span>}
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase">Category</label>
                <select
                  {...register('category')}
                  className="w-full px-4.5 py-3 border rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-900 dark:border-slate-700"
                >
                  <option value="Others">Others</option>
                  <option value="Road">Road</option>
                  <option value="Garbage">Garbage</option>
                  <option value="Street Light">Street Light</option>
                  <option value="Water">Water</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Drainage">Drainage</option>
                  <option value="Traffic">Traffic</option>
                </select>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-primary text-white font-extrabold px-6 py-3 rounded-xl text-xs"
                >
                  Next: Pin Location
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-lg font-black text-slate-800 dark:text-white">Pin the Location</h2>
              
              {/* Leaflet map pinning */}
              <div className="space-y-2">
                <div ref={mapContainerRef} className="w-full h-64 rounded-xl border" style={{ minHeight: '260px' }}></div>
                <span className="text-[10px] text-slate-450 block font-semibold">Click to pin coordinates on the map or drag the pin.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <label className="block text-[10px] text-slate-450">Address (Autofilled)</label>
                  <input type="text" readOnly value={address} className="w-full bg-slate-50 p-2.5 rounded-lg border text-[11px]" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-450">Ward Sector</label>
                  <input type="text" readOnly value={ward} className="w-full bg-slate-50 p-2.5 rounded-lg border text-[11px]" />
                </div>
              </div>

              {/* Citizen Information */}
              <hr className="border-slate-100" />
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                  <User className="w-4.5 h-4.5 text-primary" />
                  <span>Reporter Details (Keep Empty for Anonymous)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <input type="text" placeholder="Name" {...register('reporterName')} className="px-3.5 py-2.5 border rounded-lg" />
                  <input type="text" placeholder="Phone" {...register('reporterPhone')} className="px-3.5 py-2.5 border rounded-lg" />
                  <input type="email" placeholder="Email" {...register('reporterEmail')} className="px-3.5 py-2.5 border rounded-lg" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => setStep(1)} className="border px-5 py-3 rounded-xl text-xs font-bold">
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || checkingDuplicate || !!duplicateBlock}
                  className="bg-primary hover:bg-primary-dark text-white font-extrabold px-6 py-3 rounded-xl text-xs disabled:opacity-50"
                >
                  {loading ? 'Registering...' : 'File Issue'}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Info widgets side bar panel */}
        <div className="space-y-6">
          {/* AI Scanning image suggestions */}
          {aiScanning && (
            <div className="bg-indigo-50 border p-5 rounded-2xl text-center space-y-2 animate-pulse text-xs font-semibold">
              <Sparkles className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
              <p className="text-indigo-900 font-bold">AI Smart Assistant Scanning Image...</p>
            </div>
          )}

          {/* AI suggestion panel */}
          {aiSug && !aiScanning && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 p-5 rounded-2xl border border-indigo-100 dark:border-slate-700/50 shadow-sm text-xs font-semibold space-y-3">
              <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-bounce" />
                <span>AI Prediction Analyzer</span>
              </h3>
              
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between bg-white dark:bg-slate-900 p-2 rounded-xl">
                  <span className="text-slate-400">Estimated Size</span>
                  <span className="text-slate-800 dark:text-white font-bold">{aiSug.diameter || '1.2 meters'}</span>
                </div>
                <div className="flex justify-between bg-white dark:bg-slate-900 p-2 rounded-xl">
                  <span className="text-slate-400">Risk Level</span>
                  <span className="text-error font-extrabold uppercase">{aiSug.riskLevel || 'Dangerous'}</span>
                </div>
                <div className="flex justify-between bg-white dark:bg-slate-900 p-2 rounded-xl">
                  <span className="text-slate-400">Confidence</span>
                  <span className="text-success font-extrabold">{Math.round((aiSug.confidence || 0.96)*100)}%</span>
                </div>
              </div>
              <p className="text-[9px] text-slate-400 leading-relaxed font-medium">
                Auto-routed to the <strong>{aiSug.suggestedDepartment || 'Road Department'}</strong>. You may edit these values.
              </p>
            </div>
          )}

          {/* Proximity Duplicate Block Alert */}
          {duplicateBlock && (
            <div className="bg-red-50 dark:bg-red-950/20 p-5 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-sm space-y-3 text-xs">
              <h3 className="text-[10px] font-black text-error uppercase tracking-widest flex items-center gap-1.5">
                <AlertOctagon className="w-4.5 h-4.5 text-error" />
                <span>Duplicate Report Blocked</span>
              </h3>
              
              <p className="text-slate-650 leading-relaxed font-semibold">
                A matching <strong>{watchCategory}</strong> complaint was reported <strong>{duplicateBlock.distance}m away</strong> recently.
              </p>
              
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-red-100 dark:border-slate-850 flex justify-between items-center text-[10px] font-bold">
                <span className="truncate max-w-40">{duplicateBlock.title}</span>
                <span className="text-warning">{duplicateBlock.status}</span>
              </div>

              <p className="text-[9px] text-error font-medium leading-relaxed">
                ❌ Submission is disabled. To keep data clean, please return to the Home feed or map and upvote the existing open complaint.
              </p>
            </div>
          )}

          {/* Guidelines info card */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm space-y-2 text-xs">
            <h4 className="font-extrabold text-slate-800 dark:text-white">Reporting Checklist</h4>
            <ul className="list-disc list-inside space-y-1 font-medium text-slate-500 leading-normal">
              <li>Upload a clear photo of the site damage.</li>
              <li>Provide descriptive landmarks.</li>
              <li>Confirm the category is selected correctly.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportIssuePage;
