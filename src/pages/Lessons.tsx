import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ChevronRight, Play, CheckCircle2, ArrowLeft, Clock, Target, RefreshCw } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { db, collection, onSnapshot, query, orderBy } from '../firebase';
import MathFormula from '../components/MathFormula';
import ReactMarkdown from 'react-markdown';

export default function Lessons() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'lessons'), orderBy('week', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lList = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      setLessons(lList);
      
      if (lessonId) {
        const found = lList.find(l => l.id === lessonId);
        if (found) setSelectedLesson(found);
      } else if (lList.length > 0 && !selectedLesson) {
        setSelectedLesson(lList[0]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [lessonId]);

  const handleLessonSelect = (lesson: any) => {
    setSelectedLesson(lesson);
    navigate(`/lekcje/${lesson.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-20 px-4 text-center">
        <div className="max-w-md mx-auto bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm">
          <BookOpen className="mx-auto text-slate-200 mb-6" size={64} />
          <h2 className="text-2xl font-black text-slate-900 mb-4">Brak lekcji</h2>
          <p className="text-slate-500 mb-8">Administrator nie dodał jeszcze żadnych materiałów edukacyjnych.</p>
          <Link to="/" className="inline-block px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-all">
            Wróć do strony głównej
          </Link>
        </div>
      </div>
    );
  }

  const currentLesson = selectedLesson || lessons[0];

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Lesson List */}
          <aside className="w-full lg:w-80 space-y-4">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <BookOpen className="text-indigo-600" size={24} />
                Program Kursu
              </h2>
              <div className="space-y-2">
                {lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => handleLessonSelect(lesson)}
                    className={`w-full text-left p-4 rounded-2xl transition-all border ${
                      currentLesson.id === lesson.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
                        : 'bg-slate-50 text-slate-600 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        currentLesson.id === lesson.id ? 'text-indigo-200' : 'text-slate-400'
                      }`}>
                        Tydzień {lesson.week}
                      </span>
                      {currentLesson.id === lesson.id && <ChevronRight size={16} />}
                    </div>
                    <div className="font-bold text-sm line-clamp-2">{lesson.topic}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-indigo-900 p-6 rounded-[2.5rem] text-white overflow-hidden relative group">
              <div className="relative z-10">
                <h3 className="font-black text-lg mb-2">Twoje Postępy</h3>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-4xl font-black">25%</span>
                  <span className="text-indigo-300 text-sm font-bold mb-1">ukończono</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '25%' }}
                    className="h-full bg-indigo-400"
                  />
                </div>
              </div>
              <BookOpen className="absolute -right-4 -bottom-4 text-white/5 rotate-12 group-hover:scale-110 transition-transform" size={120} />
            </div>
          </aside>

          {/* Main Content - Lesson Detail */}
          <main className="flex-1">
            <motion.div
              key={currentLesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-200 shadow-sm">
                <header className="mb-10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-black rounded-full uppercase tracking-widest">
                      Tydzień {currentLesson.week}
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                      <Clock size={14} />
                      15-20 min
                    </span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                    {currentLesson.topic}
                  </h1>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Target size={16} className="text-indigo-600" />
                        Zakres wiedzy
                      </h4>
                      <ul className="space-y-3">
                        {currentLesson.scope?.map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                            <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {currentLesson.videoUrl && (
                      <div className="bg-slate-900 rounded-3xl overflow-hidden relative group cursor-pointer aspect-video flex items-center justify-center">
                        <img 
                          src={`https://img.youtube.com/vi/${currentLesson.videoUrl}/maxresdefault.jpg`} 
                          alt="Video thumbnail"
                          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform"
                        />
                        <div className="relative z-10 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                          <Play className="text-indigo-600 fill-indigo-600 ml-1" size={24} />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <span className="absolute bottom-4 left-6 text-white font-bold text-sm">Obejrzyj lekcję wideo</span>
                      </div>
                    )}
                  </div>
                </header>

                <div className="prose prose-slate max-w-none prose-headings:font-black prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-indigo-600">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => {
                        if (typeof children === 'string') {
                          return <p><MathFormula formula={children} /></p>;
                        }
                        return <p>{children}</p>;
                      }
                    }}
                  >
                    {currentLesson.content}
                  </ReactMarkdown>
                </div>

                <footer className="mt-12 pt-12 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <p className="text-slate-900 font-bold">Lekcja ukończona?</p>
                      <p className="text-sm text-slate-500">Przejdź do zadań, aby utrwalić wiedzę.</p>
                    </div>
                  </div>
                  <Link
                    to={`/zadania?week=${currentLesson.week}`}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                  >
                    Rozpocznij Zadania
                  </Link>
                </footer>
              </div>

              {/* Navigation between lessons */}
              <div className="flex items-center justify-between gap-4">
                <button
                  disabled={currentLesson.week === 1}
                  onClick={() => handleLessonSelect(lessons.find(l => l.week === currentLesson.week - 1))}
                  className="flex items-center gap-3 px-6 py-4 bg-white text-slate-600 rounded-2xl font-bold border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  <ArrowLeft size={20} />
                  Poprzednia Lekcja
                </button>
                <button
                  disabled={currentLesson.week === lessons.length}
                  onClick={() => handleLessonSelect(lessons.find(l => l.week === currentLesson.week + 1))}
                  className="flex items-center gap-3 px-6 py-4 bg-white text-slate-600 rounded-2xl font-bold border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Następna Lekcja
                  <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
