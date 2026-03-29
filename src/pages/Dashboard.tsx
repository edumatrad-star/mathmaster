import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, CheckCircle, Clock, Play, Flame } from 'lucide-react';
import MathChart from '../components/MathChart';
import StudyTimeTracker from '../components/StudyTimeTracker';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const progressData = [
  { day: 'Pon', score: 45 },
  { day: 'Wt', score: 52 },
  { day: 'Śr', score: 48 },
  { day: 'Cz', score: 61 },
  { day: 'Pt', score: 55 },
  { day: 'So', score: 72 },
  { day: 'Nd', score: 85 },
];

const studyTimeData = [
  { day: 'Pon', time: 30 },
  { day: 'Wt', time: 45 },
  { day: 'Śr', time: 60 },
  { day: 'Cz', time: 40 },
  { day: 'Pt', time: 90 },
  { day: 'So', time: 120 },
  { day: 'Nd', time: 150 },
];

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [totalSeconds, setTotalSeconds] = React.useState(() => {
    const saved = localStorage.getItem('totalStudyTime');
    return saved ? parseInt(saved, 10) : 45900;
  });

  React.useEffect(() => {
    const interval = setInterval(() => {
      const saved = localStorage.getItem('totalStudyTime');
      if (saved) setTotalSeconds(parseInt(saved, 10));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTotalTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Witaj ponownie, {user?.displayName?.split(' ')[0]}! 👋</h1>
              <p className="text-slate-500 mt-2">Kontynuuj naukę tam, gdzie skończyłeś.</p>
            </div>
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                <Flame size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Streak</div>
                <div className="text-lg font-bold text-slate-900">{profile?.streak || 0} dni</div>
              </div>
            </div>
          </header>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <MathChart 
                data={progressData} 
                xKey="day" 
                yKey="score" 
                title="Postępy $P(t)$ (%)" 
                type="area"
              />
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <MathChart 
                data={studyTimeData} 
                xKey="day" 
                yKey="time" 
                title="Czas nauki $T(t)$ (min)" 
                type="area"
              />
            </div>
          </div>

          {/* Recent Lessons */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Twoje lekcje</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: '1', title: 'Równania liniowe', category: 'Algebra', progress: 75, icon: BookOpen },
                { id: '2', title: 'Funkcja kwadratowa', category: 'Algebra', progress: 30, icon: Play },
              ].map((lesson, i) => (
                <Link
                  key={i}
                  to={`/lesson/${lesson.id}`}
                  className="block"
                >
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <lesson.icon size={20} />
                      </div>
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                        {lesson.category}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">{lesson.title}</h3>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full transition-all duration-500" 
                        style={{ width: `${lesson.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                      <span>Postęp: {lesson.progress}%</span>
                      <span>15 min pozostało</span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Study Time Tracker Widget */}
          <StudyTimeTracker />

          {/* Stats Card */}
          <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200">
            <h3 className="text-lg font-bold mb-4">Twoje statystyki</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-indigo-200" />
                  <span className="text-sm">Ukończone lekcje</span>
                </div>
                <span className="font-bold">24</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-indigo-200" />
                  <span className="text-sm">Czas nauki</span>
                </div>
                <span className="font-bold">{formatTotalTime(totalSeconds)}</span>
              </div>
            </div>
            <button className="w-full mt-6 py-3 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors">
              Zobacz pełny raport
            </button>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Nadchodzące zadania</h3>
            <div className="space-y-4">
              {[
                { name: 'Test z geometrii', date: 'Jutro, 15:00' },
                { name: 'Powtórka z ułamków', date: '28 Marzec' },
              ].map((task, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="w-2 h-2 rounded-full bg-indigo-600" />
                  <div>
                    <div className="text-sm font-bold text-slate-900">{task.name}</div>
                    <div className="text-xs text-slate-500">{task.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
