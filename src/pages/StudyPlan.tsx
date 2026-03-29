import { motion } from 'motion/react';
import { Calendar, CheckCircle2, ChevronRight, BookOpen, Target, Clock, Star, AlarmClock, Check, PlayCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, doc, updateDoc, arrayUnion, arrayRemove } from '../firebase';
import { studyPlan } from '../data/curriculum';

const EXAM_DATE = new Date('2026-05-13T09:00:00');

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const difference = EXAM_DATE.getTime() - now.getTime();

      if (difference <= 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeUnits = [
    { label: 'Dni', value: timeLeft.days },
    { label: 'Godz', value: timeLeft.hours },
    { label: 'Min', value: timeLeft.minutes },
    { label: 'Sek', value: timeLeft.seconds },
  ];

  return (
    <div className="bg-indigo-900 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-200 mb-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <AlarmClock size={120} />
      </div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold mb-2">Czas do Egzaminu</h2>
          <p className="text-indigo-200">13 maja 2026, godz. 9:00</p>
        </div>

        <div className="flex gap-4 sm:gap-6">
          {timeUnits.map((unit) => (
            <div key={unit.label} className="flex flex-col items-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-black mb-2 border border-white/20">
                {unit.value.toString().padStart(2, '0')}
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-300">{unit.label}</span>
            </div>
          ))}
        </div>

        <div className="hidden lg:block">
          <div className="px-6 py-3 bg-white text-indigo-900 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg">
            Walcz o każdą minutę!
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudyPlan() {
  const { user, profile } = useAuth();
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);

  useEffect(() => {
    if (profile?.completedStudyTopics) {
      setCompletedTopics(profile.completedStudyTopics);
    }
  }, [profile]);

  const toggleTopic = async (topicId: string) => {
    if (!user) return;
    
    const isCompleted = completedTopics.includes(topicId);
    const newCompleted = isCompleted 
      ? completedTopics.filter(id => id !== topicId)
      : [...completedTopics, topicId];
    
    setCompletedTopics(newCompleted);

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        completedStudyTopics: isCompleted ? arrayRemove(topicId) : arrayUnion(topicId)
      });
    } catch (error) {
      console.error("Error updating topic status:", error);
      // Rollback on error
      setCompletedTopics(completedTopics);
    }
  };

  const calculateProgress = (topics: {id: string, name: string}[]) => {
    const completedCount = topics.filter(t => completedTopics.includes(t.id)).length;
    return Math.round((completedCount / topics.length) * 100);
  };

  return (
    <div className="pt-24 pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <header className="mb-12 text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full font-bold text-sm mb-4"
        >
          <Star size={16} />
          Ekspert Matematyki Radzi
        </motion.div>
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Plan Przygotowań do Egzaminu Ósmoklasisty</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Przygotowałem dla Ciebie 12-tygodniowy plan treningowy, który pokrywa 100% wymagań CKE. 
          Systematyczność to Twój największy sojusznik.
        </p>
      </header>

      <CountdownTimer />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
            <Calendar size={24} />
          </div>
          <div>
            <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">Czas trwania</div>
            <div className="text-xl font-bold text-slate-900">12 Tygodni</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">Zakres</div>
            <div className="text-xl font-bold text-slate-900">Pełna Podstawa</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
            <Target size={24} />
          </div>
          <div>
            <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">Cel</div>
            <div className="text-xl font-bold text-slate-900">Wynik 90%+</div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {studyPlan.map((item, index) => (
          <motion.div
            key={item.week}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className={`relative bg-white p-8 rounded-3xl border ${item.status === 'in-progress' ? 'border-indigo-600 ring-4 ring-indigo-50' : 'border-slate-200'} shadow-sm group hover:shadow-md transition-all`}
          >
            <div className="flex flex-col md:flex-row gap-8">
              <div className="shrink-0 flex flex-col items-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black ${
                  item.status === 'completed' ? 'bg-green-100 text-green-600' : 
                  item.status === 'in-progress' ? 'bg-indigo-600 text-white' : 
                  'bg-slate-100 text-slate-400'
                }`}>
                  {item.week}
                </div>
                <div className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Tydzień</div>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold text-slate-900">{item.title}</h3>
                  {item.status === 'completed' && (
                    <span className="flex items-center gap-1 text-green-600 font-bold text-sm bg-green-50 px-3 py-1 rounded-full">
                      <CheckCircle2 size={16} />
                      Ukończone
                    </span>
                  )}
                  {item.status === 'in-progress' && (
                    <span className="flex items-center gap-1 text-indigo-600 font-bold text-sm bg-indigo-50 px-3 py-1 rounded-full animate-pulse">
                      <Clock size={16} />
                      W trakcie
                    </span>
                  )}
                </div>
                <p className="text-slate-500 mb-6 italic">"{item.description}"</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {item.topics.map((topic, i) => {
                    const isDone = completedTopics.includes(topic.id);
                    return (
                      <button 
                        key={topic.id} 
                        onClick={() => toggleTopic(topic.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                          isDone 
                            ? 'bg-green-50 border-green-100 text-green-700' 
                            : 'bg-slate-50 border-slate-100 text-slate-700 hover:border-indigo-200'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                          isDone ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-slate-300'
                        }`}>
                          {isDone && <Check size={14} />}
                        </div>
                        <span className="text-sm font-medium">{topic.name}</span>
                      </button>
                    );
                  })}
                </div>
                
                <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-1 w-full">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Postęp</span>
                      <span className="text-xs font-bold text-slate-400">{calculateProgress(item.topics)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 transition-all duration-500"
                        style={{ width: `${calculateProgress(item.topics)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {item.lessonId && (
                      <Link 
                        to={`/lesson/${item.lessonId}`}
                        className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all"
                      >
                        <BookOpen size={16} />
                        Lekcja
                      </Link>
                    )}
                    <Link 
                      to={`/plan/revision/${item.week}`}
                      className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        item.status === 'completed' 
                          ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200'
                      }`}
                    >
                      <PlayCircle size={16} />
                      Trenuj
                    </Link>
                  </div>
                </div>
              </div>

              <div className="shrink-0 hidden md:flex items-center justify-center">
                <Link 
                  to={`/plan/revision/${item.week}`}
                  className={`p-4 rounded-2xl transition-all ${
                    item.status === 'completed' ? 'bg-slate-50 text-slate-400' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
                  }`}
                >
                  <ChevronRight size={24} />
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <footer className="mt-16 p-12 bg-slate-900 rounded-[3rem] text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Gotowy na wyzwanie?</h2>
        <p className="text-slate-400 mb-8 max-w-xl mx-auto">
          Pamiętaj, że każdy rozwiązany arkusz to krok bliżej do wymarzonej szkoły średniej. 
          Zacznij realizację planu już dzisiaj!
        </p>
        <Link 
          to="/plan/revision/2"
          className="inline-block px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/20"
        >
          Rozpocznij Trening: Tydzień 2
        </Link>
      </footer>
    </div>
  );
}
