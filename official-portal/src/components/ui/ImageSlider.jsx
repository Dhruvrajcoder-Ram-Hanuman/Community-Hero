import React, { useState } from 'react';

function ImageSlider({ before, after }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX, rect) => {
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  };

  const onMouseMove = (e) => {
    if (!isDragging && e.buttons !== 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    handleMove(e.clientX, rect);
  };

  const onTouchMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    handleMove(e.touches[0].clientX, rect);
  };

  return (
    <div 
      className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl border border-slate-200 shadow-sm select-none cursor-ew-resize max-h-[420px]"
      onMouseMove={onMouseMove}
      onTouchMove={onTouchMove}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
    >
      {/* Before */}
      <img 
        src={before} 
        alt="Before Remediation" 
        className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
      />

      {/* After */}
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
        style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
      >
        <img 
          src={after} 
          alt="After Resolved" 
          className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
        />
      </div>

      {/* Slider dividing bar */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 flex items-center justify-center"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="w-7 h-7 bg-white border rounded-full shadow-xl flex items-center justify-center text-xs font-black text-slate-500 hover:scale-105 active:scale-95 transition-transform">
          ↔
        </div>
      </div>

      {/* Labels */}
      <span className="absolute bottom-3 left-3 bg-black/60 text-white font-extrabold text-[9px] px-2 py-0.5 rounded z-15 select-none uppercase tracking-wide">
        Before
      </span>
      <span className="absolute bottom-3 right-3 bg-emerald-650 bg-emerald-650/80 text-white font-extrabold text-[9px] px-2 py-0.5 rounded z-15 select-none uppercase tracking-wide">
        Resolved
      </span>
    </div>
  );
}

export default ImageSlider;
