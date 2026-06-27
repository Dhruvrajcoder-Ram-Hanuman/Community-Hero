import React, { useState, useEffect } from 'react';
import { Eye, Type, Volume2, HelpCircle } from 'lucide-react';

function AccessibilityBar() {
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [voiceGuidance, setVoiceGuidance] = useState(false);

  // Toggle Large Text
  useEffect(() => {
    if (largeText) {
      document.documentElement.classList.add('text-zoom-large');
    } else {
      document.documentElement.classList.remove('text-zoom-large');
    }
  }, [largeText]);

  // Toggle High Contrast
  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  // Capture text click for voice readout
  useEffect(() => {
    if (!voiceGuidance) {
      window.speechSynthesis.cancel();
      return;
    }

    const handleTextClick = (e) => {
      // Find closest textual element
      const target = e.target;
      const text = target.innerText || target.placeholder || target.alt;
      
      if (text && text.trim().length > 0) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.trim());
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    };

    document.addEventListener('click', handleTextClick);
    return () => {
      document.removeEventListener('click', handleTextClick);
      window.speechSynthesis.cancel();
    };
  }, [voiceGuidance]);

  return (
    <div className="fixed top-20 right-4 z-40 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-xl flex flex-col gap-2.5 glassmorphism select-none">
      {/* Zoom Text */}
      <button
        onClick={() => setLargeText(!largeText)}
        className={`p-2.5 rounded-xl transition-all flex items-center justify-center relative group ${
          largeText 
            ? 'bg-primary text-white' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title="Toggle Large Text Size"
      >
        <Type className="w-4 h-4" />
        <span className="absolute right-12 bg-slate-950 text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">
          Text Zoom
        </span>
      </button>

      {/* High Contrast */}
      <button
        onClick={() => setHighContrast(!highContrast)}
        className={`p-2.5 rounded-xl transition-all flex items-center justify-center relative group ${
          highContrast 
            ? 'bg-primary text-white' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title="Toggle High Contrast Theme"
      >
        <Eye className="w-4 h-4" />
        <span className="absolute right-12 bg-slate-950 text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">
          High Contrast
        </span>
      </button>

      {/* Voice Readout Guidance */}
      <button
        onClick={() => setVoiceGuidance(!voiceGuidance)}
        className={`p-2.5 rounded-xl transition-all flex items-center justify-center relative group ${
          voiceGuidance 
            ? 'bg-primary text-white animate-pulse' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title="Toggle Speech Readout Assistance"
      >
        <Volume2 className="w-4 h-4" />
        <span className="absolute right-12 bg-slate-950 text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">
          Voice Guide (Click items)
        </span>
      </button>
    </div>
  );
}

export default AccessibilityBar;
