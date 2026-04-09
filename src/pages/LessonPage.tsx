import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, CheckCircle2, ChevronRight, Info, PlayCircle, HelpCircle, Clock, Edit3, Save, X, Loader2, Video, Target, Shield } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import MathFormula from '../components/MathFormula';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import ReactMarkdown from 'react-markdown';

// Lazy load heavy components
const Quiz = lazy(() => import('../components/Quiz'));
const MathEditor = lazy(() => import('../components/MathEditor'));
const MathChart = lazy(() => import('../components/MathChart'));

const functionData = Array.from({ length: 21 }, (_, i) => {
  const x = i - 10;
  return { x, y: x * x };
});

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

const quizQuestions: Question[] = [
  {
    id: 1,
    text: "Jaki jest wyróżnik (delta) funkcji $f(x) = x^2 - 4x + 4$?",
    options: ["0", "4", "16", "-16"],
    correctAnswer: 0,
    explanation: "Wzór na deltę to $b^2 - 4ac$. Tutaj $a=1, b=-4, c=4$. Zatem $\\Delta = (-4)^2 - 4 \\cdot 1 \\cdot 4 = 16 - 16 = 0$.",
    difficulty: 'medium'
  },
  {
    id: 2,
    text: "Jeśli $a < 0$, to ramiona paraboli są skierowane:",
    options: ["Do góry", "Do dołu", "W prawo", "W lewo"],
    correctAnswer: 1,
    explanation: "Ujemny współczynnik $a$ oznacza, że funkcja osiąga wartość maksymalną, a jej ramiona skierowane są w dół.",
    difficulty: 'easy'
  },
  {
    id: 3,
    text: "Ile miejsc zerowych ma funkcja, gdy $\\Delta > 0$?",
    options: ["Zero", "Jedno", "Dwa", "Nieskończenie wiele"],
    correctAnswer: 2,
    explanation: "Gdy wyróżnik jest dodatni, istnieją dwa różne pierwiastki rzeczywiste równania kwadratowego.",
    difficulty: 'easy'
  }
];

// Lazy loading wrapper for multimedia
function LazyMultimedia({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="min-h-[200px]">
      {isVisible ? children : (
        <div className="w-full h-full bg-slate-50 animate-pulse rounded-2xl flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-slate-200 animate-spin" />
        </div>
      )}
    </div>
  );
}

export default function LessonPage() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [mode, setMode] = useState<'content' | 'quiz'>('content');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [lessonTopic, setLessonTopic] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonScope, setLessonScope] = useState<string[]>([]);
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonWeek, setLessonWeek] = useState(1);
  const [lessonIsDemo, setLessonIsDemo] = useState(false);
  const [lessonSchoolClass, setLessonSchoolClass] = useState('');
  const [lessons, setLessons] = useState<any[]>([]);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const fetchLessons = async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('week', { ascending: true });
      if (data) {
        setLessons(data);
      }
    };
    fetchLessons();
  }, []);

  const currentIndex = lessons.findIndex(l => l.id === id);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  useEffect(() => {
    const fetchLesson = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', id)
          .single();
          
        if (data) {
          // Access Control Check
          const isDemo = data.is_demo || false;
          const lessonClass = data.school_class || '';
          const userClass = profile?.schoolClass || '';
          const isAdmin = profile?.role === 'admin';

          if (!isAdmin && !isDemo) {
            if (!userClass || (lessonClass && lessonClass.toLowerCase() !== userClass.toLowerCase())) {
              setAccessDenied(true);
              setIsLoading(false);
              return;
            }
          }

          setLessonContent(data.content || '');
          setLessonTopic(data.topic || data.title || 'Lekcja bez tytułu');
          setLessonScope(data.scope || []);
          setLessonVideoUrl(data.video_url || '');
          setLessonWeek(data.week || 1);
          setLessonIsDemo(isDemo);
          setLessonSchoolClass(lessonClass);
          setAccessDenied(false);
        } else {
          setLessonTopic('Nie znaleziono lekcji');
          setLessonContent('Przepraszamy, ale ta lekcja nie istnieje lub została usunięta.');
        }
      } catch (error) {
        console.error("Error fetching lesson:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLesson();
  }, [id, profile]);

  const handleQuizComplete = async (score: number, details?: { questionId: number, isCorrect: boolean }[]) => {
    console.log("Quiz completed with score:", score, "details:", details);
    setCompleted(true);
    
    if (user && id) {
      try {
        const { error } = await supabase
          .from('lesson_progress')
          .upsert({
            user_id: user.id,
            lesson_id: id,
            score,
            completed_at: new Date().toISOString(),
            details: details || []
          }, { onConflict: 'user_id,lesson_id' });
        if (error) throw error;
        console.log("Progress saved successfully");
      } catch (error) {
        console.error("Error saving progress:", error);
      }
    }
  };

  const handleSave = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('lessons')
        .update({
          topic: lessonTopic,
          content: lessonContent,
          scope: lessonScope,
          video_url: lessonVideoUrl,
          week: lessonWeek,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving lesson:", error);
      alert("Wystąpił błąd podczas zapisywania lekcji.");
    } finally {
      setIsSaving(false);
    }
  };

  if (accessDenied) {
    return (
      <div className="pt-32 pb-24 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mb-6">
          <Shield size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Brak dostępu</h2>
        <p className="text-slate-500 max-w-md mb-8">
          Ta lekcja jest dostępna tylko dla uczniów zapisanych do klasy: <span className="font-bold text-indigo-600">{lessonSchoolClass}</span>. 
          Zaktualizuj swój profil lub skontaktuj się z administratorem.
        </p>
        <div className="flex gap-4">
          <Link to="/lessons" className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
            Wróć do lekcji
          </Link>
          <Link to="/profile" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
            Mój Profil
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="pt-32 pb-24 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Ładowanie treści lekcji...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <Link to="/lessons" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft size={16} className="mr-2" />
          Wszystkie lekcje
        </Link>
        
        <div className="flex items-center gap-4">
          {(profile?.role === 'admin' || profile?.role === 'wydawca') && (
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isEditing ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {isEditing ? <X size={16} /> : <Edit3 size={16} />}
              {isEditing ? 'Anuluj' : 'Edytuj'}
            </button>
          )}

          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setMode('content')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${mode === 'content' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <PlayCircle size={16} />
              Lekcja
            </button>
            <button 
              onClick={() => setMode('quiz')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${mode === 'quiz' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <HelpCircle size={16} />
              Test
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">Edytor Lekcji</h2>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                {isSaving ? 'Zapisywanie...' : 'Zapisz zmiany'}
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Temat Lekcji</label>
                <input 
                  type="text" 
                  value={lessonTopic}
                  onChange={(e) => setLessonTopic(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tydzień</label>
                <input 
                  type="number" 
                  value={lessonWeek}
                  onChange={(e) => setLessonWeek(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <Suspense fallback={<div className="h-64 bg-slate-50 animate-pulse rounded-xl" />}>
                <MathEditor value={lessonContent} onChange={setLessonContent} />
              </Suspense>
            </div>
          </motion.div>
        ) : mode === 'content' ? (
          <motion.article
            key="content"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="h-48 bg-indigo-600 relative flex items-center justify-center">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
              <h1 className="text-4xl font-bold text-white relative z-10 text-center px-4">
                <MathFormula formula={lessonTopic} />
              </h1>
            </div>

            <div className="p-8 sm:p-12 space-y-8">
              {lessonVideoUrl && (
                <LazyMultimedia>
                  <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center group cursor-pointer relative">
                    <PlayCircle size={64} className="text-indigo-600 opacity-80 group-hover:scale-110 transition-transform" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 text-slate-500 text-sm font-bold bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                      <Video size={16} />
                      Obejrzyj wideo
                    </div>
                  </div>
                </LazyMultimedia>
              )}

              <section className="prose prose-slate max-w-none">
                <div className="markdown-body">
                  <ReactMarkdown
                    components={{
                      img: ({ node, ...props }) => (
                        <img {...props} loading="lazy" className="rounded-2xl shadow-md" />
                      )
                    }}
                  >
                    {lessonContent}
                  </ReactMarkdown>
                </div>
              </section>

              {lessonScope.length > 0 && (
                <div className="bg-indigo-50 border-l-4 border-indigo-600 p-6 rounded-r-xl">
                  <div className="flex gap-4">
                    <Target className="text-indigo-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-indigo-900">Zakres wiedzy</h4>
                      <ul className="mt-2 space-y-1">
                        {lessonScope.map((item, i) => (
                          <li key={i} className="text-indigo-700 text-sm flex items-center gap-2">
                            <CheckCircle2 size={14} />
                            <MathFormula formula={item} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-8 border-t border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-400 font-medium">
                  <Clock size={20} />
                  <span>Tydzień {lessonWeek}</span>
                </div>
                <button 
                  onClick={() => setMode('quiz')}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Sprawdź wiedzę (Test)
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Navigation between lessons */}
              <div className="pt-12 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                {prevLesson ? (
                  <Link
                    to={`/lekcje/${prevLesson.id}`}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 bg-white text-slate-600 rounded-2xl font-bold border border-slate-200 hover:bg-slate-50 transition-all group"
                  >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-400">Poprzednia lekcja</div>
                      <div className="text-sm line-clamp-1">{prevLesson.topic}</div>
                    </div>
                  </Link>
                ) : <div className="hidden sm:block" />}

                {nextLesson ? (
                  <Link
                    to={`/lekcje/${nextLesson.id}`}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 bg-white text-indigo-600 rounded-2xl font-bold border border-indigo-100 hover:bg-indigo-50 transition-all group text-right"
                  >
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-indigo-400">Następna lekcja</div>
                      <div className="text-sm line-clamp-1">{nextLesson.topic}</div>
                    </div>
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : <div className="hidden sm:block" />}
              </div>
            </div>
          </motion.article>
        ) : (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Suspense fallback={
              <div className="bg-white p-12 rounded-3xl border border-slate-200 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Przygotowywanie testu...</p>
              </div>
            }>
              <Quiz questions={quizQuestions} onComplete={handleQuizComplete} />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
