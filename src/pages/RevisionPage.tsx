import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, Target, BookOpen, ChevronRight, Sparkles, RefreshCw } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import Quiz from '../components/Quiz';
import { revisionQuestions, Question } from '../data/revisionQuestions';
import { useAuth } from '../context/AuthContext';
import { db, doc, updateDoc, increment, collection, query, where, getDocs, writeBatch } from '../firebase';
import { getWeekTitle } from '../data/curriculum';

export default function RevisionPage() {
  const { week } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  const weekNum = parseInt(week || '1');

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoadingQuestions(true);
      try {
        const q = query(collection(db, 'questions'), where('week', '==', weekNum));
        const snapshot = await getDocs(q);
        const qList = snapshot.docs.map(doc => doc.data() as Question);
        
        if (qList.length > 0) {
          setQuestions(qList);
        } else {
          // Fallback to static data if Firestore is empty for this week
          setQuestions(revisionQuestions[weekNum] || []);
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
        setQuestions(revisionQuestions[weekNum] || []);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, [weekNum]);

  const handleQuizComplete = async (finalScore: number) => {
    setScore(finalScore);
    setIsCompleted(true);

    if (user && finalScore === questions.length) {
      try {
        const batch = writeBatch(db);
        const userRef = doc(db, 'users', user.uid);
        const publicRef = doc(db, 'public_profiles', user.uid);
        
        const pointsToAdd = 50;
        const updatedCompletedWeeks = (profile?.completedWeeks || []).includes(weekNum) 
          ? profile?.completedWeeks 
          : [...(profile?.completedWeeks || []), weekNum];

        batch.update(userRef, {
          totalPoints: increment(pointsToAdd),
          completedWeeks: updatedCompletedWeeks
        });

        batch.update(publicRef, {
          totalPoints: increment(pointsToAdd)
        });

        await batch.commit();
      } catch (error) {
        console.error("Error updating points:", error);
      }
    }
  };

  if (loadingQuestions) {
    return (
      <div className="pt-32 pb-24 px-4 text-center">
        <RefreshCw className="animate-spin text-indigo-600 mx-auto mb-4" size={40} />
        <p className="text-slate-500">Ładowanie zadań...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="pt-32 pb-24 px-4 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Brak zadań dla tego tygodnia</h2>
        <p className="text-slate-500 mb-8">Pracujemy nad przygotowaniem materiałów dla Tygodnia {weekNum}.</p>
        <Link to="/plan" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">
          <ArrowLeft size={20} />
          Wróć do planu
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <Link to="/plan" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft size={16} className="mr-2" />
          Wróć do planu
        </Link>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full font-bold text-sm">
          <Target size={16} />
          Tydzień {weekNum}: {getWeekTitle(weekNum)}
        </div>
      </div>

      <header className="mb-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Powtórka: {getWeekTitle(weekNum)}</h1>
        <p className="text-slate-500">Rozwiąż zadania, aby sprawdzić swoją wiedzę z tego tygodnia.</p>
      </header>

      <AnimatePresence mode="wait">
        {!isCompleted ? (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Quiz questions={questions} onComplete={handleQuizComplete} />
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-xl text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
            
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mx-auto mb-8 relative">
              <Trophy size={48} />
              <motion.div 
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-white border-4 border-white"
              >
                <Sparkles size={20} />
              </motion.div>
            </div>

            <h2 className="text-4xl font-black text-slate-900 mb-4">
              {score === questions.length ? 'Mistrzowski Wynik!' : 'Dobra Robota!'}
            </h2>
            
            <div className="text-6xl font-black text-indigo-600 mb-6">
              {score}/{questions.length}
            </div>

            <p className="text-xl text-slate-500 mb-12 max-w-md mx-auto">
              {score === questions.length 
                ? 'Gratulacje! Otrzymujesz 50 punktów bonusowych za bezbłędny trening.' 
                : 'Każde rozwiązane zadanie przybliża Cię do celu. Przejrzyj wyjaśnienia i spróbuj jeszcze raz!'}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => setIsCompleted(false)}
                className="px-8 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Spróbuj ponownie
              </button>
              <Link 
                to="/plan"
                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
              >
                Wróć do planu
                <ChevronRight size={20} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
