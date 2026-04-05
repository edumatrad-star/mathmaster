import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Zap, Play, Pause, RotateCcw } from 'lucide-react';

const StudyTimeTracker: React.FC = () => {
  const [isActive, setIsActive] = useState(true);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(() => {
    const saved = localStorage.getItem('totalStudyTime');
    return saved ? parseInt(saved, 10) : 0;
  });

  const saveTotalTime = useCallback((time: number) => {
    localStorage.setItem('totalStudyTime', time.toString());
    // Also dispatch a custom event so other components can listen to it without polling
    window.dispatchEvent(new CustomEvent('studyTimeUpdated', { detail: time }));
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        setSessionSeconds(prev => prev + 1);
        setTotalSeconds(prev => {
          const next = prev + 1;
          saveTotalTime(next);
          return next;
        });
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, saveTotalTime]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    
    if (h > 0) {
      return `${h}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  };

  const handleResetSession = () => {
    setSessionSeconds(0);
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm overflow-hidden relative group">
      <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
        <Clock size={120} className="text-indigo-600" />
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
            <Clock size={18} />
          </div>
          Licznik nauki
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={handleResetSession}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            title="Resetuj sesję"
          >
            <RotateCcw size={18} />
          </button>
          <button 
            onClick={toggleTimer}
            className={`p-2 rounded-xl transition-all ${
              isActive 
                ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' 
                : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
            }`}
            title={isActive ? 'Pauza' : 'Wznów'}
          >
            {isActive ? <Pause size={18} /> : <Play size={18} />}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="relative">
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bieżąca sesja</p>
            {!isActive && <span className="text-[10px] font-bold text-amber-500 uppercase">Wstrzymano</span>}
          </div>
          <p className={`text-4xl font-black tabular-nums tracking-tight transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
            {formatTime(sessionSeconds)}
          </p>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Całkowity czas</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-slate-900 tabular-nums">
                  {formatTime(totalSeconds)}
                </p>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold">
                  <Zap size={10} />
                  <span>+12%</span>
                </div>
              </div>
            </div>
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className={`mt-6 flex items-center gap-2 text-[10px] font-medium p-3 rounded-xl transition-colors ${
        isActive ? 'text-emerald-600 bg-emerald-50/50' : 'text-amber-600 bg-amber-50/50'
      }`}>
        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
        {isActive ? 'Sesja aktywna - czas jest zapisywany' : 'Licznik wstrzymany'}
      </div>
    </div>
  );
};

// Add TrendingUp import
import { TrendingUp } from 'lucide-react';

export default StudyTimeTracker;
