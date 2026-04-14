import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, ChevronRight, GraduationCap, Search, Star, Video, Target, Clock, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

export default function LessonsList() {
  const { profile, isMockMode } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!profile) return;
    if (isMockMode) {
      setLessons([{ id: 'mock-1', week: 1, topic: 'Wstęp do ułamków', is_demo: true, scope: ['Ułamki zwykłe'] }]);
      setLoading(false);
      return;
    }
    const fetchLessons = async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('week', { ascending: true });
      if (data) {
        setLessons(data);
      }
      setLoading(false);
    };
    fetchLessons();
  }, [profile]);

  const filteredLessons = lessons.filter(lesson => {
    // Admin sees everything
    if (profile?.role === 'admin') return true;

    // Demo lessons are visible to everyone
    if (lesson.is_demo) return true;

    // If user is not enrolled in any class, they only see demo lessons
    if (!profile?.schoolClass) return false;

    // If lesson has a specific class, check if user matches
    if (lesson.school_class) {
      return lesson.school_class.toLowerCase() === profile.schoolClass.toLowerCase();
    }

    // Standard lessons (no class assigned) are visible to all enrolled students
    return true;
  }).filter(lesson => 
    (lesson.topic || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (lesson.scope || []).some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group lessons by week
  const lessonsByWeek = filteredLessons.reduce((acc, lesson) => {
    if (!acc[lesson.week]) acc[lesson.week] = [];
    acc[lesson.week].push(lesson);
    return acc;
  }, {} as Record<number, any[]>);

  const sortedWeeks = Object.keys(lessonsByWeek).map(Number).sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <div className="pt-24 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 mb-4">Lekcje i Materiały</h1>
        <p className="text-slate-500 max-w-2xl font-medium">
          Gotowe lekcje wprowadzające i przypominające do każdego zagadnienia z programu ósmoklasisty.
        </p>
      </header>

      {/* Search */}
      <div className="relative mb-12">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
        <input 
          type="text" 
          placeholder="Szukaj tematu lub zagadnienia..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-16 pr-6 py-5 bg-white border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 outline-none transition-all shadow-sm text-lg"
        />
      </div>

      {/* Lessons by Week */}
      <div className="space-y-16">
        {sortedWeeks.map((week) => (
          <section key={week} className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-200">
                {week}
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Tydzień {week}</h2>
                <p className="text-slate-500 text-sm font-medium">Zakres wiedzy: {lessonsByWeek[week][0].scope?.join(', ') || 'Brak zakresu'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lessonsByWeek[week].map((lesson, idx) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative bg-white rounded-[2.5rem] border border-slate-200 p-8 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-300 flex flex-col"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <BookOpen size={24} />
                    </div>
                    {lesson.video_url && (
                      <div className="flex items-center gap-1 text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-2 py-1 rounded-full">
                        <Video size={12} />
                        Wideo
                      </div>
                    )}
                    {lesson.is_demo && (
                      <div className="flex items-center gap-1 text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-full">
                        <Star size={12} />
                        Demo
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                    {lesson.topic}
                  </h3>
                  
                  <p className="text-slate-500 text-sm line-clamp-3 mb-8 flex-1">
                    {lesson.scope?.join(', ') || ''}
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                      <Clock size={14} />
                      <span>15 min</span>
                    </div>
                    <Link 
                      to={`/lekcje/${lesson.id}`}
                      className="flex items-center gap-2 text-indigo-600 font-black text-sm hover:gap-3 transition-all"
                    >
                      Rozpocznij
                      <ChevronRight size={18} />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {filteredLessons.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Search size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Nie znaleziono lekcji</h3>
          <p className="text-slate-500">Spróbuj wpisać inne hasło lub sprawdź pisownię.</p>
        </div>
      )}
    </div>
  );
}
