import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, CheckCircle2, ChevronRight, Info, PlayCircle, HelpCircle, Clock, Edit3, Save, X, Loader2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import MathFormula from '../components/MathFormula';
import MathChart from '../components/MathChart';
import Quiz from '../components/Quiz';
import MathEditor from '../components/MathEditor';
import { useAuth } from '../context/AuthContext';
import { db, doc, getDoc, setDoc } from '../firebase';
import katex from 'katex';

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

export default function LessonPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const [mode, setMode] = useState<'content' | 'quiz'>('content');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('Funkcja Kwadratowa');
  const [lessonContent, setLessonContent] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && !isEditing) {
      const formulas = contentRef.current.querySelectorAll('.ql-formula');
      formulas.forEach((el) => {
        const formula = el.getAttribute('data-value');
        if (formula) {
          try {
            katex.render(formula, el as HTMLElement, {
              throwOnError: false,
              displayMode: el.tagName === 'DIV' || el.classList.contains('block-formula')
            });
          } catch (e) {
            console.error(e);
          }
        }
      });
    }
  }, [lessonContent, isEditing, mode]);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const lessonDoc = await getDoc(doc(db, 'lessons', id));
        if (lessonDoc.exists()) {
          const data = lessonDoc.data();
          setLessonContent(data.content);
          setLessonTitle(data.title);
        } else {
          // Default content if lesson doesn't exist yet
          const defaultContent = `
            <h2 class="text-2xl font-bold text-slate-900">1. Definicja</h2>
            <p class="text-slate-600 leading-relaxed">
              Funkcją kwadratową nazywamy funkcję f: R -> R określoną wzorem:
            </p>
            <p class="ql-formula" data-value="f(x) = ax^2 + bx + c"></p>
            <p class="text-slate-600 leading-relaxed">
              gdzie a, b, c są liczbami rzeczywistymi oraz a != 0. 
              Liczby a, b, c nazywamy współczynnikami funkcji kwadratowej.
            </p>
          `;
          setLessonContent(defaultContent);
        }
      } catch (error) {
        console.error("Error fetching lesson:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLesson();
  }, [id]);

  const handleQuizComplete = (score: number) => {
    console.log("Quiz completed with score:", score);
    setCompleted(true);
  };

  const handleSave = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'lessons', id), {
        id,
        title: lessonTitle,
        content: lessonContent,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving lesson:", error);
      alert("Wystąpił błąd podczas zapisywania lekcji.");
    } finally {
      setIsSaving(false);
    }
  };

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
          {profile?.role === 'admin' && (
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
                <label className="block text-sm font-bold text-slate-700 mb-2">Tytuł Lekcji</label>
                <input 
                  type="text" 
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <MathEditor value={lessonContent} onChange={setLessonContent} />
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
              <h1 className="text-4xl font-bold text-white relative z-10 text-center px-4">{lessonTitle}</h1>
            </div>

            <div className="p-8 sm:p-12 space-y-8">
              <section className="prose prose-slate max-w-none">
                <div 
                  ref={contentRef}
                  className="lesson-rich-content"
                  dangerouslySetInnerHTML={{ __html: lessonContent }} 
                />
              </section>

              <div className="bg-indigo-50 border-l-4 border-indigo-600 p-6 rounded-r-xl">
                <div className="flex gap-4">
                  <Info className="text-indigo-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-indigo-900">Ważna uwaga!</h4>
                    <p className="text-indigo-700 text-sm mt-1">
                      Współczynnik <MathFormula formula="a" /> decyduje o kierunku ramion paraboli. 
                      Jeśli <MathFormula formula="a > 0" />, ramiona skierowane są do góry.
                    </p>
                  </div>
                </div>
              </div>

              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">2. Wykres funkcji</h2>
                <p className="text-slate-600 leading-relaxed">
                  Wykresem funkcji kwadratowej jest parabola. Poniżej znajduje się wykres funkcji <MathFormula formula="f(x) = x^2" />.
                </p>
                <MathChart 
                  data={functionData} 
                  xKey="x" 
                  yKey="y" 
                  title="Wykres y = x^2" 
                  type="area"
                />
              </section>

              <div className="pt-8 border-t border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-400 font-medium">
                  <Clock size={20} />
                  <span>Ok. 10 min czytania</span>
                </div>
                <button 
                  onClick={() => setMode('quiz')}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Sprawdź wiedzę (Test)
                  <ChevronRight size={20} />
                </button>
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
            <Quiz questions={quizQuestions} onComplete={handleQuizComplete} />
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        .lesson-rich-content .ql-formula {
          display: block;
          text-align: center;
          margin: 1.5rem 0;
          font-size: 1.25rem;
        }
      `}</style>
    </div>
  );
}
