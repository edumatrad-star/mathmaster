import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Database, ShieldCheck, AlertCircle, RefreshCw, Plus, X, Filter, ChevronDown, ChevronUp, Eye, EyeOff, Lock, Unlock, LayoutGrid, Settings as SettingsIcon, FileText, Download, Upload, User, Users, BookOpen, Shield, Activity, Search, Edit2, UserPlus, Save } from 'lucide-react';
import { db, collection, onSnapshot, deleteDoc, doc, setDoc, addDoc, checkConnection } from '../firebase';
import { revisionQuestions, Question } from '../data/revisionQuestions';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { studyPlan, getWeekTitle } from '../data/curriculum';
import MathFormula from '../components/MathFormula';

export default function AdminPanel() {
  const { profile, loading: authLoading } = useAuth();
  const [questions, setQuestions] = useState<(Question & { week: number, docId: string })[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [featureSettings, setFeatureSettings] = useState<any>({});
  const [connectionStatus, setConnectionStatus] = useState<{ checked: boolean, success: boolean, error?: string }>({ checked: false, success: false });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'users' | 'lessons' | 'settings'>('dashboard');
  const [userSearch, setUserSearch] = useState('');
  const [taskSearch, setTaskSearch] = useState('');
  const [lessonSearch, setLessonSearch] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [userFormData, setUserFormData] = useState({
    displayName: '',
    email: '',
    role: 'user',
    isPremium: false,
    totalPoints: 0,
    enrolledWeeks: [] as number[],
    linkedChildEmail: ''
  });
  const [lessonFormData, setLessonFormData] = useState({
    week: 1,
    topic: '',
    scope: [] as string[],
    content: '',
    videoUrl: ''
  });

  const handleOpenUserModal = (user: any = null) => {
    if (user) {
      setEditingUser(user);
      setUserFormData({
        displayName: user.displayName || '',
        email: user.email || '',
        role: user.role || 'user',
        isPremium: user.isPremium || false,
        totalPoints: user.totalPoints || 0,
        enrolledWeeks: user.enrolledWeeks || [],
        linkedChildEmail: user.linkedChildEmail || ''
      });
    } else {
      setEditingUser(null);
      setUserFormData({
        displayName: '',
        email: '',
        role: 'user',
        isPremium: false,
        totalPoints: 0,
        enrolledWeeks: [],
        linkedChildEmail: ''
      });
    }
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userId = editingUser ? editingUser.uid : `user_${Date.now()}`;
      const userData = {
        ...userFormData,
        uid: userId,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', userId), userData, { merge: true });
      setShowUserModal(false);
      alert(editingUser ? 'Użytkownik zaktualizowany!' : 'Użytkownik dodany!');
    } catch (error) {
      console.error("Error saving user:", error);
      alert('Błąd podczas zapisywania użytkownika.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        alert('Użytkownik usunięty!');
      } catch (error) {
        console.error("Error deleting user:", error);
        alert('Błąd podczas usuwania użytkownika.');
      }
    }
  };

  const handleOpenLessonModal = (lesson: any = null) => {
    if (lesson) {
      setEditingLesson(lesson);
      setLessonFormData({
        week: lesson.week || 1,
        topic: lesson.topic || '',
        scope: lesson.scope || [],
        content: lesson.content || '',
        videoUrl: lesson.videoUrl || ''
      });
    } else {
      setEditingLesson(null);
      setLessonFormData({
        week: 1,
        topic: '',
        scope: [],
        content: '',
        videoUrl: ''
      });
    }
    setShowLessonModal(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const lessonId = editingLesson ? editingLesson.docId : `lesson_${Date.now()}`;
      const lessonData = {
        ...lessonFormData,
        id: lessonId,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'lessons', lessonId), lessonData, { merge: true });
      setShowLessonModal(false);
      alert(editingLesson ? 'Lekcja zaktualizowana!' : 'Lekcja dodana!');
    } catch (error) {
      console.error("Error saving lesson:", error);
      alert('Błąd podczas zapisywania lekcji.');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć tę lekcję?')) {
      try {
        await deleteDoc(doc(db, 'lessons', lessonId));
        alert('Lekcja usunięta!');
      } catch (error) {
        console.error("Error deleting lesson:", error);
        alert('Błąd podczas usuwania lekcji.');
      }
    }
  };

  const handleCheckConnection = async () => {
    const result = await checkConnection();
    setConnectionStatus({ checked: true, success: result.success, error: result.error });
  };

  const downloadTemplate = () => {
    const template = [
      {
        id: 1,
        text: "Ile to jest $2 + 2$?",
        options: ["2", "3", "4", "5"],
        correctAnswer: 2,
        explanation: "$2 + 2 = 4$",
        difficulty: "easy",
        week: 1,
        topicName: "Liczby naturalne"
      }
    ];
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'szablon_zadan.json';
    a.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!Array.isArray(json)) throw new Error('Nieprawidłowy format pliku. Oczekiwano tablicy.');

        setIsSeeding(true);
        for (const q of json) {
          const weekNum = q.week || 1;
          const docId = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await setDoc(doc(db, 'questions', docId), {
            ...q,
            id: q.id || Date.now() + Math.floor(Math.random() * 1000),
            week: weekNum,
            topicName: q.topicName || studyPlan.find(p => p.week === weekNum)?.topics[0].name || ''
          });
        }
        alert('Zadania zostały zaimportowane!');
        e.target.value = ''; // Reset input
      } catch (error) {
        console.error("Error importing questions:", error);
        alert('Błąd podczas importu: ' + (error as Error).message);
      } finally {
        setIsSeeding(false);
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'features'), (snapshot) => {
      if (snapshot.exists()) {
        setFeatureSettings(snapshot.data());
      } else {
        // Initial defaults
        const defaults = {
          'formula-transformer': { visible: true, roles: ['user', 'parent', 'admin'] },
          'graph-generator': { visible: true, roles: ['user', 'parent', 'admin'] },
          'unit-converter': { visible: true, roles: ['user', 'parent', 'admin'] },
          'fraction-lab': { visible: true, roles: ['user', 'parent', 'admin'] }
        };
        setDoc(doc(db, 'settings', 'features'), defaults);
        setFeatureSettings(defaults);
      }
    });
    return () => unsubscribe();
  }, []);

  const toggleFeature = async (featureId: string, role: string) => {
    const current = featureSettings[featureId] || { visible: true, roles: ['user', 'parent', 'admin'] };
    const newRoles = current.roles.includes(role) 
      ? current.roles.filter((r: string) => r !== role)
      : [...current.roles, role];
    
    const updated = {
      ...featureSettings,
      [featureId]: { ...current, roles: newRoles }
    };
    
    await setDoc(doc(db, 'settings', 'features'), updated);
  };

  const toggleVisibility = async (featureId: string) => {
    const current = featureSettings[featureId] || { visible: true, roles: ['user', 'parent', 'admin'] };
    const updated = {
      ...featureSettings,
      [featureId]: { ...current, visible: !current.visible }
    };
    await setDoc(doc(db, 'settings', 'features'), updated);
  };
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<number | 'all'>('all');
  
  // Form state
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    week: 1,
    topicName: ''
  });

  useEffect(() => {
    // Set initial topicName when week changes or on mount
    const currentWeekPlan = studyPlan.find(p => p.week === newQuestion.week);
    if (currentWeekPlan && !newQuestion.topicName) {
      setNewQuestion(prev => ({ ...prev, topicName: currentWeekPlan.topics[0].name }));
    }
  }, [newQuestion.week]);

  useEffect(() => {
    setLoadingUsers(true);
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const uList = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      }));
      setUsers(uList);
      setLoadingUsers(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'questions'), (snapshot) => {
      const qList = snapshot.docs.map(doc => ({
        ...doc.data() as Question & { week: number },
        docId: doc.id
      }));
      setQuestions(qList);
      setLoading(false);
    });

    const unsubscribeLessons = onSnapshot(collection(db, 'lessons'), (snapshot) => {
      const lList = snapshot.docs.map(doc => ({
        ...doc.data(),
        docId: doc.id
      }));
      setLessons(lList);
      setLoadingLessons(false);
    });

    return () => {
      unsubscribe();
      unsubscribeLessons();
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'lessons') {
      // Already fetching on mount now
    }
  }, [activeTab]);

  if (authLoading || (profile === null && loading)) {
    return (
      <div className="pt-32 flex flex-col items-center justify-center">
        <RefreshCw className="animate-spin text-indigo-600 mb-4" size={40} />
        <p className="text-slate-500 font-medium">Weryfikacja uprawnień...</p>
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="pt-32 px-4 max-w-md mx-auto text-center">
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <ShieldCheck size={40} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Brak Uprawnień</h1>
        <p className="text-slate-500 mb-8">Ta strona jest dostępna tylko dla administratorów.</p>
      </div>
    );
  }

  const handleDelete = async (docId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć to zadanie?')) {
      try {
        await deleteDoc(doc(db, 'questions', docId));
      } catch (error) {
        console.error("Error deleting question:", error);
      }
    }
  };

  const handleSeed = async () => {
    if (!window.confirm('To nadpisze istniejące zadania o tych samych ID. Kontynuować?')) return;
    setIsSeeding(true);
    try {
      for (const week in revisionQuestions) {
        const weekNum = parseInt(week);
        for (const q of revisionQuestions[weekNum]) {
          const docId = `week${weekNum}_q${q.id}`;
          await setDoc(doc(db, 'questions', docId), {
            ...q,
            week: weekNum
          });
        }
      }
      alert('Zadania zostały zaimportowane do bazy danych!');
    } catch (error) {
      console.error("Error seeding questions:", error);
      alert('Wystąpił błąd podczas importowania zadań.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await setDoc(doc(db, 'questions', editingTask.docId), {
          ...newQuestion,
          id: editingTask.id,
          topicName: newQuestion.topicName || studyPlan.find(p => p.week === newQuestion.week)?.topics[0].name || ''
        });
        alert('Zadanie zaktualizowane!');
      } else {
        await addDoc(collection(db, 'questions'), {
          ...newQuestion,
          id: Date.now(),
          topicName: newQuestion.topicName || studyPlan.find(p => p.week === newQuestion.week)?.topics[0].name || ''
        });
        alert('Zadanie dodane!');
      }
      setShowAddForm(false);
      setEditingTask(null);
      setNewQuestion({
        text: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        difficulty: 'easy',
        week: newQuestion.week,
        topicName: studyPlan.find(p => p.week === newQuestion.week)?.topics[0].name || ''
      });
    } catch (error) {
      console.error("Error saving question:", error);
      alert('Błąd podczas zapisywania zadania.');
    }
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setNewQuestion({
      text: task.text,
      options: task.options,
      correctAnswer: task.correctAnswer,
      explanation: task.explanation,
      difficulty: task.difficulty,
      week: task.week,
      topicName: task.topicName || ''
    });
    setShowAddForm(true);
  };

  const filteredQuestions = questions
    .filter(q => selectedWeekFilter === 'all' || q.week === selectedWeekFilter)
    .filter(q => q.text.toLowerCase().includes(taskSearch.toLowerCase()) || q.explanation.toLowerCase().includes(taskSearch.toLowerCase()));

  const weeks = Array.from(new Set(questions.map(q => q.week))).sort((a: number, b: number) => a - b) as number[];

  return (
    <div className="pt-24 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-4 shadow-sm sticky top-28">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${
                  activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <LayoutGrid size={20} />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${
                  activeTab === 'tasks' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <FileText size={20} />
                Zadania
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${
                  activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <User size={20} />
                Użytkownicy
              </button>
              <button
                onClick={() => setActiveTab('lessons')}
                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${
                  activeTab === 'lessons' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <BookOpen size={20} />
                Lekcje
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${
                  activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <SettingsIcon size={20} />
                Ustawienia
              </button>
            </nav>

            <div className="mt-8 pt-8 border-t border-slate-100 px-4">
              <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
                <Database size={14} />
                Status Systemu
              </div>
              <button 
                onClick={handleCheckConnection}
                className={`w-full py-3 rounded-xl text-xs font-bold transition-all border ${
                  connectionStatus.checked 
                    ? connectionStatus.success 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                      : 'bg-rose-50 text-rose-600 border-rose-100'
                    : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                }`}
              >
                {connectionStatus.checked 
                  ? connectionStatus.success ? 'Połączono' : 'Błąd połączenia' 
                  : 'Sprawdź połączenie'}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <header>
                <h1 className="text-4xl font-black text-slate-900 mb-2">Dashboard Administratora</h1>
                <p className="text-slate-500 font-medium">Przegląd statystyk i aktywności systemu</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                      <Users size={24} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500">Użytkownicy</div>
                      <div className="text-2xl font-bold text-slate-900">{users.length}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="text-emerald-500 font-bold">+{users.filter(u => {
                      const createdAt = u.createdAt ? new Date(u.createdAt) : new Date();
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return createdAt > weekAgo;
                    }).length}</span> nowych w tym tygodniu
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500">Zadania</div>
                      <div className="text-2xl font-bold text-slate-900">{questions.length}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="text-emerald-500 font-bold">+{questions.filter(q => {
                      const createdAt = q.createdAt ? new Date(q.createdAt) : new Date();
                      const dayAgo = new Date();
                      dayAgo.setDate(dayAgo.getDate() - 1);
                      return createdAt > dayAgo;
                    }).length}</span> nowych dzisiaj
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                      <Shield size={24} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500">Premium</div>
                      <div className="text-2xl font-bold text-slate-900">
                        {users.filter(u => u.isPremium).length}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="text-amber-500 font-bold">
                      {users.length > 0 ? Math.round((users.filter(u => u.isPremium).length / users.length) * 100) : 0}%
                    </span> konwersji
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                      <Activity size={24} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500">Lekcje</div>
                      <div className="text-2xl font-bold text-slate-900">{lessons.length}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    Materiały edukacyjne
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-black text-slate-900 mb-6">Ostatnie Aktywności</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">S</div>
                      <div>
                        <div className="font-bold text-slate-900">System gotowy</div>
                        <div className="text-xs text-slate-500">Wszystkie moduły działają poprawnie.</div>
                      </div>
                    </div>
                    {users.slice(0, 3).map((u, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold">
                          {u.displayName?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{u.displayName || 'Nowy użytkownik'}</div>
                          <div className="text-xs text-slate-500">Dołączył do platformy.</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-black text-slate-900 mb-6">Status połączenia</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <Database size={20} className="text-slate-400" />
                        <span className="text-sm font-bold text-slate-700">Firestore Database</span>
                      </div>
                      <span className="flex items-center gap-2 text-xs font-black text-emerald-600">
                        <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                        Połączono
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <Shield size={20} className="text-slate-400" />
                        <span className="text-sm font-bold text-slate-700">Firebase Auth</span>
                      </div>
                      <span className="flex items-center gap-2 text-xs font-black text-emerald-600">
                        <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                        Połączono
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        {activeTab === 'tasks' && (
            <div className="space-y-8">
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 mb-2">Zarządzanie Zadaniami</h1>
                  <p className="text-slate-500 font-medium">Dodawaj, edytuj i usuwaj zadania z bazy danych</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => setShowAddForm(true)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
                  >
                    <Plus size={20} />
                    Dodaj Zadanie
                  </button>
                  <label className="px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer shadow-sm">
                    <Upload size={20} />
                    Importuj
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <button 
                    onClick={downloadTemplate}
                    className="px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
                  >
                    <Download size={20} />
                    Szablon
                  </button>
                </div>
              </header>

              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-3 text-slate-400 mr-2">
                  <Filter size={20} />
                  <span className="text-sm font-bold uppercase tracking-widest">Filtruj:</span>
                </div>
                <div className="flex-1 flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedWeekFilter('all')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      selectedWeekFilter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Wszystkie
                  </button>
                  {studyPlan.map(p => (
                    <button
                      key={p.week}
                      onClick={() => setSelectedWeekFilter(p.week)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        selectedWeekFilter === p.week ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Tydzień {p.week}
                    </button>
                  ))}
                </div>
                <div className="w-full md:w-64 relative">
                  <input 
                    type="text"
                    placeholder="Szukaj zadania..."
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                  <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <RefreshCw className="animate-spin text-indigo-600" size={40} />
                </div>
              ) : questions.length === 0 ? (
                <div className="bg-white p-12 rounded-[3rem] border border-slate-200 text-center">
                  <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Database size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Baza zadań jest pusta</h3>
                  <p className="text-slate-500 mb-8 max-w-md mx-auto">
                    Wygląda na to, że nie zaimportowałeś jeszcze domyślnych zadań lub nie dodałeś własnych. Możesz to zrobić teraz.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <button
                      onClick={handleSeed}
                      disabled={isSeeding}
                      className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                    >
                      {isSeeding ? <RefreshCw className="animate-spin" size={20} /> : <Database size={20} />}
                      Importuj domyślne zadania
                    </button>
                    <label className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                      <Upload size={20} />
                      Importuj z pliku
                      <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <button
                      onClick={downloadTemplate}
                      className="px-8 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                    >
                      <Download size={20} />
                      Pobierz szablon
                    </button>
                  </div>
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="bg-white p-12 rounded-[3rem] border border-slate-200 text-center">
                  <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Brak zadań</h3>
                  <p className="text-slate-500">Nie znaleziono zadań dla wybranego tygodnia.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  <div className="flex items-center justify-between px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <span>Zadanie</span>
                    <span>Akcje</span>
                  </div>
                  {filteredQuestions.sort((a, b) => a.week - b.week || a.id - b.id).map((q) => (
                    <motion.div
                      layout
                      key={q.docId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center justify-between gap-6 hover:shadow-md transition-all group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase">
                            Tydzień {q.week}: {getWeekTitle(q.week)}
                          </span>
                          {(q as any).topicName && (
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-full uppercase">
                              {(q as any).topicName}
                            </span>
                          )}
                          <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase ${
                            q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600' :
                            q.difficulty === 'medium' ? 'bg-amber-50 text-amber-600' :
                            'bg-rose-50 text-rose-600'
                          }`}>
                            {q.difficulty}
                          </span>
                        </div>
                        <p className="text-slate-900 font-bold line-clamp-2">
                          <MathFormula formula={q.text} />
                        </p>
                        <div className="text-slate-400 text-sm mt-1 flex flex-wrap gap-2">
                          <span>Opcje:</span>
                          {q.options.map((opt, i) => (
                            <span key={i} className={i === q.correctAnswer ? "text-emerald-600 font-bold" : ""}>
                              <MathFormula formula={opt} />
                              {i < q.options.length - 1 ? "," : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditTask(q)}
                          className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                          title="Edytuj zadanie"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(q.docId)}
                          className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                          title="Usuń zadanie"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-8">
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 mb-2">Użytkownicy</h1>
                  <p className="text-slate-500 font-medium">Zarządzaj kontami i uprawnieniami użytkowników</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-full md:w-72 relative">
                    <input 
                      type="text"
                      placeholder="Szukaj użytkownika..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                    />
                    <Filter className="absolute left-3.5 top-3.5 text-slate-400" size={20} />
                  </div>
                  <button 
                    onClick={() => handleOpenUserModal()}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
                  >
                    <UserPlus size={20} />
                    <span className="hidden sm:inline">Dodaj Użytkownika</span>
                  </button>
                </div>
              </header>

              {loadingUsers ? (
                <div className="flex justify-center py-20">
                  <RefreshCw className="animate-spin text-indigo-600" size={40} />
                </div>
              ) : (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Użytkownik</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Rola</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Punkty</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Akcje</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {users.filter(u => 
                          (u.displayName || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                          (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
                        ).map((u) => (
                          <tr key={u.uid} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {u.photoURL ? (
                                  <img src={u.photoURL} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                                    {u.displayName?.[0] || u.email?.[0] || '?'}
                                  </div>
                                )}
                                <div>
                                  <div className="font-bold text-slate-900">{u.displayName || 'Anonim'}</div>
                                  <div className="text-xs text-slate-400">{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                u.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 
                                u.role === 'parent' ? 'bg-emerald-100 text-emerald-600' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {u.role === 'parent' ? 'Rodzic' : u.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-700">
                              {u.totalPoints || 0} pkt
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                u.isPremium ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {u.isPremium ? 'Premium' : 'Free'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleOpenUserModal(u)}
                                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                  title="Edytuj użytkownika"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(u.uid)}
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                  title="Usuń użytkownika"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'lessons' && (
            <div className="space-y-8">
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 mb-2">Zarządzanie Lekcjami</h1>
                  <p className="text-slate-500 font-medium">Dodawaj i edytuj materiały edukacyjne dla każdego tygodnia</p>
                </div>
                <button 
                  onClick={() => handleOpenLessonModal()}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
                >
                  <Plus size={20} />
                  Dodaj Lekcję
                </button>
              </header>

              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="flex-1 relative">
                  <input 
                    type="text"
                    placeholder="Szukaj lekcji..."
                    value={lessonSearch}
                    onChange={(e) => setLessonSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <Search className="absolute left-3.5 top-3.5 text-slate-400" size={20} />
                </div>
              </div>

              {loadingLessons ? (
                <div className="flex justify-center py-20">
                  <RefreshCw className="animate-spin text-indigo-600" size={40} />
                </div>
              ) : (
                <div className="grid gap-4">
                  {lessons.filter(l => 
                    l.topic.toLowerCase().includes(lessonSearch.toLowerCase()) ||
                    l.content.toLowerCase().includes(lessonSearch.toLowerCase())
                  ).sort((a, b) => a.week - b.week).map((l) => (
                    <div key={l.docId} className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center justify-between gap-6 hover:shadow-md transition-all">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase">
                            Tydzień {l.week}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">
                          <MathFormula formula={l.topic} />
                        </h3>
                        <p className="text-slate-500 text-sm line-clamp-1">
                          <MathFormula formula={l.scope?.join(', ') || ''} />
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenLessonModal(l)}
                          className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button 
                          onClick={() => handleDeleteLesson(l.docId)}
                          className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8">
              <header>
                <h1 className="text-4xl font-black text-slate-900 mb-2">Ustawienia Aplikacji</h1>
                <p className="text-slate-500 font-medium">Konfiguruj dostępność funkcji i parametry systemowe</p>
              </header>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                    <SettingsIcon size={24} className="text-indigo-600" />
                    Widoczność Funkcji
                  </h3>
                  <div className="space-y-4">
                    {Object.keys(featureSettings).map(featureId => (
                      <div key={featureId} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-bold text-slate-700 capitalize">{featureId.replace(/-/g, ' ')}</span>
                          <button 
                            onClick={() => toggleVisibility(featureId)}
                            className={`p-2 rounded-xl transition-all ${
                              featureSettings[featureId].visible ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'
                            }`}
                          >
                            {featureSettings[featureId].visible ? <Eye size={18} /> : <EyeOff size={18} />}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {['user', 'parent', 'admin'].map(role => (
                            <button
                              key={role}
                              onClick={() => toggleFeature(featureId, role)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                featureSettings[featureId].roles.includes(role)
                                  ? 'bg-white text-indigo-600 border border-indigo-100 shadow-sm'
                                  : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                    <Database size={24} className="text-indigo-600" />
                    Diagnostyka
                  </h3>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      connectionStatus.checked 
                        ? connectionStatus.success ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                        : 'bg-slate-100 text-slate-300'
                    }`}>
                      <Database size={32} />
                    </div>
                    <p className="font-bold text-slate-900 mb-2">Połączenie z Firestore</p>
                    <p className="text-sm text-slate-500 mb-6">
                      {connectionStatus.checked 
                        ? connectionStatus.success ? 'System działa poprawnie.' : `Błąd: ${connectionStatus.error}`
                        : 'Sprawdź czy baza danych jest dostępna.'}
                    </p>
                    <button 
                      onClick={handleCheckConnection}
                      className="w-full py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all"
                    >
                      Uruchom Test
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      {/* Task Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden"
            >
              <header className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    {editingTask ? 'Edytuj Zadanie' : 'Dodaj Nowe Zadanie'}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">
                    {editingTask ? 'Zmień parametry istniejącego zadania' : 'Utwórz nowe zadanie w bazie danych'}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingTask(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
                >
                  <X size={24} />
                </button>
              </header>

              <form onSubmit={handleAddQuestion} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Treść Zadania</label>
                      <textarea 
                        required
                        value={newQuestion.text}
                        onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700 min-h-[100px]"
                        placeholder="np. Ile to jest $2 + 2$?"
                      />
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Podgląd Formuł</span>
                      <div className="text-slate-700 font-medium">
                        <MathFormula formula={newQuestion.text || 'Wpisz treść, aby zobaczyć podgląd...'} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tydzień</label>
                        <select 
                          value={newQuestion.week}
                          onChange={(e) => setNewQuestion({ ...newQuestion, week: parseInt(e.target.value) })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 bg-white"
                        >
                          {studyPlan.map(p => (
                            <option key={p.week} value={p.week}>Tydzień {p.week}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Trudność</label>
                        <select 
                          value={newQuestion.difficulty}
                          onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value as any })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 bg-white"
                        >
                          <option value="easy">Łatwy</option>
                          <option value="medium">Średni</option>
                          <option value="hard">Trudny</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Temat</label>
                      <input 
                        type="text"
                        value={newQuestion.topicName}
                        onChange={(e) => setNewQuestion({ ...newQuestion, topicName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                        placeholder="np. Liczby naturalne"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Opcje Odpowiedzi</label>
                  <div className="grid md:grid-cols-2 gap-4">
                    {newQuestion.options.map((opt, i) => (
                      <div key={i} className="flex gap-3 items-center">
                        <button
                          type="button"
                          onClick={() => setNewQuestion({ ...newQuestion, correctAnswer: i })}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${
                            newQuestion.correctAnswer === i ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </button>
                        <input 
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => {
                            const opts = [...newQuestion.options];
                            opts[i] = e.target.value;
                            setNewQuestion({ ...newQuestion, options: opts });
                          }}
                          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                          placeholder={`Opcja ${String.fromCharCode(65 + i)}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Wyjaśnienie</label>
                  <textarea 
                    value={newQuestion.explanation}
                    onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700 min-h-[80px]"
                    placeholder="Wyjaśnij dlaczego ta odpowiedź jest poprawna..."
                  />
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm italic text-slate-500">
                    <MathFormula formula={newQuestion.explanation || 'Podgląd wyjaśnienia...'} />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    {editingTask ? 'Zapisz Zmiany' : 'Dodaj Zadanie'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingTask(null);
                    }}
                    className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-200 transition-all"
                  >
                    Anuluj
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lesson Modal */}
      <AnimatePresence>
        {showLessonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden"
            >
              <header className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    {editingLesson ? 'Edytuj Lekcję' : 'Dodaj Lekcję'}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">Zarządzaj treścią edukacyjną</p>
                </div>
                <button onClick={() => setShowLessonModal(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-all">
                  <X size={24} />
                </button>
              </header>

              <form onSubmit={handleSaveLesson} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tydzień</label>
                    <select 
                      value={lessonFormData.week}
                      onChange={(e) => setLessonFormData({ ...lessonFormData, week: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 bg-white"
                    >
                      {studyPlan.map(p => (
                        <option key={p.week} value={p.week}>Tydzień {p.week}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Temat Lekcji</label>
                    <input 
                      type="text"
                      required
                      value={lessonFormData.topic}
                      onChange={(e) => setLessonFormData({ ...lessonFormData, topic: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                      placeholder="np. Liczby naturalne"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Zakres Wiedzy (oddzielaj przecinkami)</label>
                  <textarea 
                    value={lessonFormData.scope.join(', ')}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, scope: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '') })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700 min-h-[80px]"
                    placeholder="np. Zapisywanie liczb, Porównywanie liczb"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Treść Lekcji (Markdown + LaTeX)</label>
                  <textarea 
                    required
                    value={lessonFormData.content}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, content: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700 min-h-[200px]"
                    placeholder="Użyj $...$ dla formuł matematycznych"
                  />
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 overflow-x-auto">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Podgląd Treści</span>
                    <MathFormula formula={lessonFormData.content || 'Wpisz treść, aby zobaczyć podgląd...'} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">URL Wideo (opcjonalnie)</label>
                  <input 
                    type="url"
                    value={lessonFormData.videoUrl}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, videoUrl: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
                    <Save size={20} />
                    {editingLesson ? 'Zapisz Zmiany' : 'Dodaj Lekcję'}
                  </button>
                  <button type="button" onClick={() => setShowLessonModal(false)} className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-200 transition-all">
                    Anuluj
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Modal */}
      <AnimatePresence>
        {showUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <header className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    {editingUser ? 'Edytuj Użytkownika' : 'Dodaj Użytkownika'}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">
                    {editingUser ? `Edytujesz konto: ${editingUser.email}` : 'Utwórz nowe konto użytkownika'}
                  </p>
                </div>
                <button 
                  onClick={() => setShowUserModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
                >
                  <X size={24} />
                </button>
              </header>

              <form onSubmit={handleSaveUser} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nazwa Użytkownika</label>
                    <input 
                      type="text"
                      required
                      value={userFormData.displayName}
                      onChange={(e) => setUserFormData({ ...userFormData, displayName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                      placeholder="np. Jan Kowalski"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Email</label>
                    <input 
                      type="email"
                      required
                      disabled={!!editingUser}
                      value={userFormData.email}
                      onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 disabled:bg-slate-50 disabled:text-slate-400"
                      placeholder="email@przyklad.pl"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Rola</label>
                    <select 
                      value={userFormData.role}
                      onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 bg-white"
                    >
                      <option value="user">Uczeń</option>
                      <option value="parent">Rodzic</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Punkty</label>
                    <input 
                      type="number"
                      value={userFormData.totalPoints}
                      onChange={(e) => setUserFormData({ ...userFormData, totalPoints: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div 
                      onClick={() => setUserFormData({ ...userFormData, isPremium: !userFormData.isPremium })}
                      className={`w-12 h-6 rounded-full transition-all relative ${userFormData.isPremium ? 'bg-amber-500' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userFormData.isPremium ? 'left-7' : 'left-1'}`} />
                    </div>
                    <span className="font-bold text-slate-700">Konto Premium</span>
                  </label>
                </div>

                {userFormData.role === 'parent' && (
                  <div className="space-y-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <label className="text-xs font-black text-emerald-600 uppercase tracking-widest">Powiązane konto dziecka (Email)</label>
                    <input 
                      type="email"
                      value={userFormData.linkedChildEmail}
                      onChange={(e) => setUserFormData({ ...userFormData, linkedChildEmail: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-700"
                      placeholder="email-dziecka@przyklad.pl"
                    />
                    <p className="text-[10px] text-emerald-600 font-medium">Rodzic będzie mógł śledzić postępy tego użytkownika.</p>
                  </div>
                )}

                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Zapisany na tygodnie (Kursy)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {studyPlan.map(p => (
                      <button
                        key={p.week}
                        type="button"
                        onClick={() => {
                          const weeks = [...userFormData.enrolledWeeks];
                          if (weeks.includes(p.week)) {
                            setUserFormData({ ...userFormData, enrolledWeeks: weeks.filter(w => w !== p.week) });
                          } else {
                            setUserFormData({ ...userFormData, enrolledWeeks: [...weeks, p.week] });
                          }
                        }}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                          userFormData.enrolledWeeks.includes(p.week)
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-100'
                        }`}
                      >
                        Tydzień {p.week}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    {editingUser ? 'Zapisz Zmiany' : 'Utwórz Użytkownika'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUserModal(false)}
                    className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-200 transition-all"
                  >
                    Anuluj
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
