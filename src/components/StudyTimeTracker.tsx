import React, { useState, useEffect } from 'react';
import { Clock, Zap } from 'lucide-react';

const StudyTimeTracker: React.FC = () => {
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(() => {
    const saved = localStorage.getItem('totalStudyTime');
    return saved ? parseInt(saved, 10) : 45900; // Default 12h 45m in seconds if not set
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionSeconds(prev => prev + 1);
      setTotalSeconds(prev => {
        const next = prev + 1;
        localStorage.setItem('totalStudyTime', next.toString());
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h}h ${m}m ${s}s`;
    }
    return `${m}m ${s}s`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Clock size={80} className="text-indigo-600" />
      </div>
      
      <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Clock size={20} className="text-indigo-600" />
        Licznik nauki
      </h3>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ta sesja</p>
          <p className="text-3xl font-black text-indigo-600 tabular-nums">
            {formatTime(sessionSeconds)}
          </p>
        </div>

        <div className="h-px bg-slate-100 w-full" />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Całkowity czas</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums">
              {formatTime(totalSeconds)}
            </p>
          </div>
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Zap size={20} />
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        Twoja sesja jest aktywna i zapisywana w czasie rzeczywistym.
      </div>
    </div>
  );
};

export default StudyTimeTracker;
