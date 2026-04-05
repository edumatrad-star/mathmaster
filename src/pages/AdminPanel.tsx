import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Database, ShieldCheck, AlertCircle, RefreshCw, Plus, X, Filter, ChevronDown, ChevronUp, Eye, EyeOff, Lock, Unlock, LayoutGrid, Settings as SettingsIcon, FileText, Download, Upload, User, Users, BookOpen, Shield, Activity, Search, Edit2, UserPlus, Save } from 'lucide-react';
import { db, auth, collection, onSnapshot, deleteDoc, doc, setDoc, addDoc, getDoc, checkConnection } from '../firebase';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
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
  const [roleFilter, setRoleFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [taskSearch, setTaskSearch] = useState('');
  const [lessonSearch, setLessonSearch] = useState('');
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedUserProgress, setSelectedUserProgress] = useState<any>(null);
  const [userProgressData, setUserProgressData] = useState<any[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [userFormData, setUserFormData] = useState({
    displayName: '',
    email: '',
    password: '', // New field
    role: 'user',
    isPremium: false,
    totalPoints: 0,
    enrolledWeeks: [] as number[],
    childrenUids: [] as string[],
    linkedChildEmail: '',
    schoolClass: ''
  });
  const [lessonFormData, setLessonFormData] = useState({
    week: 1,
    topic: '',
    scope: [] as string[],
    content: '',
    videoUrl: '',
    isDemo: false,
    schoolClass: ''
  });

  const handleOpenUserModal = (user: any = null) => {
    if (user) {
      setEditingUser(user);
      setUserFormData({
        displayName: user.displayName || '',
        email: user.email || '',
        password: '', // Reset password field
        role: user.role || 'user',
        isPremium: user.isPremium || false,
        totalPoints: user.totalPoints || 0,
        enrolledWeeks: user.enrolledWeeks || [],
        childrenUids: user.childrenUids || [],
        linkedChildEmail: user.linkedChildEmail || '',
        schoolClass: user.schoolClass || ''
      });
    } else {
      setEditingUser(null);
      setUserFormData({
        displayName: '',
        email: '',
        password: '',
        role: 'user',
        isPremium: false,
        totalPoints: 0,
        enrolledWeeks: [],
        childrenUids: [],
        linkedChildEmail: '',
        schoolClass: ''
      });
    }
    setShowUserModal(true);
  };

  const handleOpenProgressModal = async (user: any) => {
    setSelectedUserProgress(user);
    setShowProgressModal(true);
    setLoadingProgress(true);
    try {
      // Fetch progress from users/{uid}/progress collection
      const progressRef = collection(db, 'users', user.uid, 'progress');
      const unsubscribe = onSnapshot(progressRef, (snapshot) => {
        const progressList = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        setUserProgressData(progressList);
        setLoadingProgress(false);
      });
      // Note: We are not unsubscribing here to keep it simple, but in a real app we should manage this subscription
    } catch (error) {
      console.error("Error fetching user progress:", error);
      setLoadingProgress(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (userFormData.password && userFormData.password.length < 6) {
      alert('Hasło musi mieć co najmniej 6 znaków.');
      return;
    }
    
    try {
      const idToken = await auth.currentUser?.getIdToken();
      console.log("Current user:", auth.currentUser?.email);
      console.log("ID Token present:", !!idToken);
      
      if (editingUser) {
        // Update Firestore data
        const userData = {
          displayName: userFormData.displayName,
          email: userFormData.email,
          role: userFormData.role,
          isPremium: userFormData.isPremium,
          totalPoints: userFormData.totalPoints,
          enrolledWeeks: userFormData.enrolledWeeks,
          childrenUids: userFormData.childrenUids,
          linkedChildEmail: userFormData.linkedChildEmail,
          schoolClass: userFormData.schoolClass,
          updatedAt: new Date().toISOString()
        };

        const oldChildren = editingUser.childrenUids || [];
        const newChildren = userFormData.childrenUids || [];
        const added = newChildren.filter((id: string) => !oldChildren.includes(id));
        const removed = oldChildren.filter((id: string) => !newChildren.includes(id));

        await setDoc(doc(db, 'users', editingUser.uid), userData, { merge: true });

        // Update reciprocal parentUid for children
        for (const childId of added) {
          await setDoc(doc(db, 'users', childId), { parentUid: editingUser.uid }, { merge: true });
        }
        for (const childId of removed) {
          // Only clear if it was pointing to this parent
          const childDoc = await getDoc(doc(db, 'users', childId));
          if (childDoc.exists() && childDoc.data().parentUid === editingUser.uid) {
            await setDoc(doc(db, 'users', childId), { parentUid: null }, { merge: true });
          }
        }

        // If password is provided, change it via backend
        if (userFormData.password) {
          const response = await fetch('/api/admin/change-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              uid: editingUser.uid,
              newPassword: userFormData.password
            })
          });
          
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const result = await response.json();
            if (!response.ok) {
              if (result.error && result.error.includes('There is no user record')) {
                throw new Error('Użytkownik nie istnieje w systemie autoryzacji (Firebase Auth). Zmiana hasła nie powiodła się.');
              }
              throw new Error(result.error || 'Unknown error');
            }
          } else {
            const text = await response.text();
            console.error("Non-JSON response from change-password:", text);
            throw new Error(`Błąd serwera (${response.status}): Otrzymano nieprawidłowy format odpowiedzi.`);
          }
        }
        
        alert('Użytkownik zaktualizowany!');
      } else {
        // Create new user via backend
        const response = await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            email: userFormData.email,
            password: userFormData.password || 'MathMaster123!', // Default password if none provided
            displayName: userFormData.displayName,
            role: userFormData.role,
            schoolClass: userFormData.schoolClass
          })
        });
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Unknown error');
        } else {
          const text = await response.text();
          console.error("Non-JSON response from create-user:", text);
          throw new Error(`Błąd serwera (${response.status}): Otrzymano nieprawidłowy format odpowiedzi.`);
        }
        
        alert('Użytkownik dodany!');
      }
      
      setShowUserModal(false);
    } catch (error: any) {
      console.error("Error saving user:", error);
      alert(`Błąd podczas zapisywania użytkownika: ${error.message}`);
    }
  };

  const handleImportUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importData.trim()) return;

    setIsImporting(true);
    try {
      // Parse CSV
      const lines = importData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const usersToImport = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const user: any = {};
        headers.forEach((header, index) => {
          user[header] = values[index];
        });
        return user;
      });

      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/admin/import-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ users: usersToImport })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unknown error');

      let message = `Zaimportowano: ${result.success}\nNie udało się: ${result.failed}`;
      if (result.errors && result.errors.length > 0) {
        message += `\n\nBłędy:\n${result.errors.join('\n')}`;
      }
      
      alert(message);
      setShowImportModal(false);
      setImportData('');
    } catch (error: any) {
      console.error("Error importing users:", error);
      alert(`Błąd podczas importu: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const response = await fetch('/api/admin/delete-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ uid: userId })
        });
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Unknown error');
        } else {
          const text = await response.text();
          console.error("Non-JSON response from delete-user:", text);
          throw new Error(`Błąd serwera (${response.status}): Otrzymano nieprawidłowy format odpowiedzi.`);
        }
        
        alert('Użytkownik usunięty!');
      } catch (error: any) {
        console.error("Error deleting user:", error);
        alert(`Błąd podczas usuwania użytkownika: ${error.message}`);
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
        videoUrl: lesson.videoUrl || '',
        isDemo: lesson.isDemo || false,
        schoolClass: lesson.schoolClass || ''
      });
    } else {
      setEditingLesson(null);
      setLessonFormData({
        week: 1,
        topic: '',
        scope: [],
        content: '',
        videoUrl: '',
        isDemo: false,
        schoolClass: ''
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

    const unsubscribeSite = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) {
        setSiteConfig(snapshot.data());
      } else {
        const defaults = {
          landingPage: {
            hero: {
              title: "Zostań mistrzem matematyki",
              subtitle: "Najnowocześniejsza platforma do nauki matematyki dla ósmoklasistów. Interaktywne lekcje, wzory i pełne wsparcie ekspertów.",
              badge: "Przygotowanie do egzaminu 2026",
              ctaPrimary: "Zacznij darmowy okres próbny",
              ctaSecondary: "Zobacz demo"
            },
            features: [
              { id: 1, title: "Szybkie postępy", description: "Nasz algorytm dopasowuje poziom trudności do Twoich umiejętności, abyś uczył się efektywnie.", icon: 'Zap' },
              { id: 2, title: "Pełny program", description: "Wszystkie zagadnienia wymagane na egzaminie ósmoklasisty w jednym miejscu.", icon: 'CheckCircle2' },
              { id: 3, title: "Wsparcie LaTeX", description: "Profesjonalny zapis matematyczny ułatwia zrozumienie skomplikowanych wzorów i równań.", icon: 'Star' }
            ],
            stats: [
              { label: "Uczniów", value: "15k+" },
              { label: "Zdawalność", value: "98%" },
              { label: "Lekcji", value: "500+" },
              { label: "Wsparcie", value: "24/7" }
            ],
            sections: {
              hero: { visible: true, roles: ['guest', 'user', 'parent', 'admin'] },
              features: { visible: true, roles: ['guest', 'user', 'parent', 'admin'] },
              stats: { visible: true, roles: ['guest', 'user', 'parent', 'admin'] }
            }
          },
          dashboard: {
            sections: {
              welcome: { visible: true, roles: ['user', 'parent', 'admin'] },
              stats: { visible: true, roles: ['user', 'parent', 'admin'] },
              lessons: { visible: true, roles: ['user', 'admin'] },
              parentTools: { visible: true, roles: ['parent', 'admin'] },
              leaderboard: { visible: true, roles: ['user', 'parent', 'admin'] }
            }
          }
        };
        setDoc(doc(db, 'settings', 'site'), defaults);
        setSiteConfig(defaults);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeSite();
    };
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

  const updateSiteConfig = async (path: string, value: any) => {
    const keys = path.split('.');
    const newConfig = { ...siteConfig };
    let current = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    await setDoc(doc(db, 'settings', 'site'), newConfig);
  };

  const toggleSiteSection = async (page: 'landingPage' | 'dashboard', sectionId: string, role: string) => {
    const current = siteConfig[page].sections[sectionId];
    const newRoles = current.roles.includes(role)
      ? current.roles.filter((r: string) => r !== role)
      : [...current.roles, role];
    
    const updated = {
      ...siteConfig,
      [page]: {
        ...siteConfig[page],
        sections: {
          ...siteConfig[page].sections,
          [sectionId]: { ...current, roles: newRoles }
        }
      }
    };
    await setDoc(doc(db, 'settings', 'site'), updated);
  };

  const toggleSiteSectionVisibility = async (page: 'landingPage' | 'dashboard', sectionId: string) => {
    const current = siteConfig[page].sections[sectionId];
    const updated = {
      ...siteConfig,
      [page]: {
        ...siteConfig[page],
        sections: {
          ...siteConfig[page].sections,
          [sectionId]: { ...current, visible: !current.visible }
        }
      }
    };
    await setDoc(doc(db, 'settings', 'site'), updated);
  };

  const [selectedWeekFilter, setSelectedWeekFilter] = useState<number | 'all'>('all');
  
  // Chart Data Processing
  const getRegistrationData = () => {
    const counts: { [key: string]: number } = {};
    users.forEach(u => {
      if (u.createdAt) {
        const date = new Date(u.createdAt).toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' });
        counts[date] = (counts[date] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).slice(-7);
  };

  const getRoleData = () => {
    const counts: { [key: string]: number } = {};
    users.forEach(u => {
      const role = u.role || 'user';
      counts[role] = (counts[role] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const getPremiumData = () => {
    const premium = users.filter(u => u.isPremium).length;
    const free = users.length - premium;
    return [
      { name: 'Premium', value: premium },
      { name: 'Free', value: free }
    ];
  };

  const getCompletionData = () => {
    // Aggregate completed topics across all users
    const topicCounts: { [key: string]: number } = {};
    users.forEach(u => {
      (u.completedStudyTopics || []).forEach((topicId: string) => {
        topicCounts[topicId] = (topicCounts[topicId] || 0) + 1;
      });
    });
    return Object.entries(topicCounts)
      .map(([name, value]) => ({ name: name.split('_').pop() || name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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
    if (profile?.role !== 'admin') return;
    
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
  }, [profile?.role]);

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

  if (profile?.role !== 'admin' && profile?.role !== 'wydawca') {
    return (
      <div className="pt-32 px-4 max-w-md mx-auto text-center">
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <ShieldCheck size={40} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Brak Uprawnień</h1>
        <p className="text-slate-500 mb-8">Ta strona jest dostępna tylko dla administratorów i wydawców.</p>
      </div>
    );
  }

  const availableTabs = profile?.role === 'admin' 
    ? ['dashboard', 'tasks', 'users', 'lessons', 'settings']
    : ['lessons'];

  // Ensure activeTab is valid for current role
  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0] as any);
    }
  }, [profile?.role]);

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
              {availableTabs.includes('dashboard') && (
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${
                    activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <LayoutGrid size={20} />
                  Dashboard
                </button>
              )}
              {availableTabs.includes('tasks') && (
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${
                    activeTab === 'tasks' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <FileText size={20} />
                  Zadania
                </button>
              )}
              {availableTabs.includes('users') && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${
                    activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <User size={20} />
                  Użytkownicy
                </button>
              )}
              {availableTabs.includes('lessons') && (
                <button
                  onClick={() => setActiveTab('lessons')}
                  className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${
                    activeTab === 'lessons' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen size={20} />
                  Lekcje
                </button>
              )}
              {availableTabs.includes('settings') && (
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${
                    activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <SettingsIcon size={20} />
                  Ustawienia
                </button>
              )}
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
                  <h3 className="text-xl font-black text-slate-900 mb-6">Trendy Rejestracji</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getRegistrationData()}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <Tooltip 
                          contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        />
                        <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-black text-slate-900 mb-6">Najpopularniejsze Lekcje</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getCompletionData()} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 600}} width={100} />
                        <Tooltip 
                          cursor={{fill: '#f8fafc'}}
                          contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        />
                        <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-black text-slate-900 mb-6">Struktura Użytkowników</h3>
                  <div className="h-[300px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getRoleData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {getRoleData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
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
                    <div className="pt-4 border-t border-slate-100">
                      <h4 className="text-sm font-bold text-slate-900 mb-4">Ostatnie Aktywności</h4>
                      <div className="space-y-3">
                        {users.slice(0, 3).map((u, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                              {u.displayName?.[0] || 'U'}
                            </div>
                            <div className="text-xs">
                              <span className="font-bold text-slate-900">{u.displayName || 'Użytkownik'}</span>
                              <span className="text-slate-500 ml-1">dołączył do platformy</span>
                            </div>
                          </div>
                        ))}
                      </div>
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
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                  <div className="flex gap-2 w-full sm:w-auto">
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-sm font-medium text-slate-600 bg-white"
                    >
                      <option value="all">Wszystkie role</option>
                      <option value="admin">Admin</option>
                      <option value="parent">Rodzic</option>
                      <option value="user">Uczeń</option>
                    </select>
                    <select
                      value={classFilter}
                      onChange={(e) => setClassFilter(e.target.value)}
                      className="px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-sm font-medium text-slate-600 bg-white"
                    >
                      <option value="all">Wszystkie klasy</option>
                      {Array.from(new Set(users.map(u => u.schoolClass).filter(Boolean))).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-64 relative">
                    <input 
                      type="text"
                      placeholder="Szukaj użytkownika..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                    />
                    <Filter className="absolute left-3.5 top-3.5 text-slate-400" size={20} />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => setShowImportModal(true)}
                      className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto"
                    >
                      <Download size={20} />
                      <span className="hidden sm:inline">Importuj</span>
                    </button>
                    <button 
                      onClick={() => handleOpenUserModal()}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 w-full sm:w-auto"
                    >
                      <UserPlus size={20} />
                      <span className="hidden sm:inline">Dodaj Użytkownika</span>
                    </button>
                  </div>
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
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Klasa</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Punkty</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Akcje</th>
                        </tr>
                      </thead>
                      {users
                        // Group logic: NEVER show children as standalone rows. They are only rendered inside parents.
                        .filter(u => !u.parentUid)
                        .filter(u => {
                          const matchesSearch = (u.displayName || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                                                (u.email || '').toLowerCase().includes(userSearch.toLowerCase());
                          
                          // Check if any child matches the search
                          let childMatchesSearch = false;
                          if (u.role === 'parent' && u.childrenUids && u.childrenUids.length > 0) {
                            childMatchesSearch = u.childrenUids.some((childUid: string) => {
                              const child = users.find(usr => usr.uid === childUid);
                              if (!child) return false;
                              return (child.displayName || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                                     (child.email || '').toLowerCase().includes(userSearch.toLowerCase());
                            });
                          }

                          const matchesRole = roleFilter === 'all' || u.role === roleFilter;
                          const matchesClass = classFilter === 'all' || u.schoolClass === classFilter;
                          
                          return (matchesSearch || childMatchesSearch) && matchesRole && matchesClass;
                        })
                        .map((u) => (
                        <tbody key={u.uid} className="group border-b border-slate-50">
                          <tr className="hover:bg-slate-50/50 transition-colors">
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
                                  <div className="font-bold text-slate-900 flex items-center gap-2">
                                    {u.displayName || 'Anonim'}
                                    {u.role === 'parent' && u.childrenUids && u.childrenUids.length > 0 && (
                                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded-full cursor-help" title="Najedź, aby zobaczyć dzieci">
                                        {u.childrenUids.length} dzieci
                                      </span>
                                    )}
                                  </div>
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
                              {u.schoolClass || '-'}
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
                                  onClick={() => handleOpenProgressModal(u)}
                                  className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                  title="Zobacz postępy"
                                >
                                  <Activity size={18} />
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
                          {/* Render children if this is a parent */}
                          {u.role === 'parent' && u.childrenUids && u.childrenUids.length > 0 && (
                            u.childrenUids.map((childUid: string) => {
                              const child = users.find(usr => usr.uid === childUid);
                              if (!child) return null;
                              return (
                                <tr key={`child-${child.uid}`} className="hidden group-hover:table-row bg-slate-50/30 hover:bg-slate-50/80 transition-colors border-l-4 border-l-emerald-400">
                                  <td className="px-6 py-3 pl-12">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center font-bold text-xs">
                                        {child.displayName?.[0] || child.email?.[0] || '?'}
                                      </div>
                                      <div>
                                        <div className="font-bold text-slate-700 text-sm">{child.displayName || 'Anonim'}</div>
                                        <div className="text-[10px] text-slate-400">{child.email}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-3">
                                    <span className="px-2 py-1 rounded-full text-[9px] font-black uppercase bg-slate-200 text-slate-600">
                                      Uczeń
                                    </span>
                                  </td>
                                  <td className="px-6 py-3 font-bold text-slate-600 text-sm">
                                    {child.schoolClass || '-'}
                                  </td>
                                  <td className="px-6 py-3 font-bold text-slate-600 text-sm">
                                    {child.totalPoints || 0} pkt
                                  </td>
                                  <td className="px-6 py-3">
                                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                                      child.isPremium ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-600'
                                    }`}>
                                      {child.isPremium ? 'Premium' : 'Free'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button 
                                        onClick={() => handleOpenUserModal(child)}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                        title="Edytuj ucznia"
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                      <button 
                                        onClick={() => handleOpenProgressModal(child)}
                                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                        title="Zobacz postępy"
                                      >
                                        <Activity size={14} />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteUser(child.uid)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                        title="Usuń ucznia"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                        ))}
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

                {/* Site Content Editor */}
                {siteConfig && (
                  <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                      <LayoutGrid size={24} className="text-indigo-600" />
                      Modelowanie Strony i Treści
                    </h3>
                    
                    <div className="space-y-12">
                      {/* Landing Page Content */}
                      <section>
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Strona Główna (Landing Page)</h4>
                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-600">Nagłówek (Hero Title)</label>
                              <input 
                                type="text"
                                value={siteConfig.landingPage.hero.title}
                                onChange={(e) => updateSiteConfig('landingPage.hero.title', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-600">Podtytuł (Hero Subtitle)</label>
                              <textarea 
                                value={siteConfig.landingPage.hero.subtitle}
                                onChange={(e) => updateSiteConfig('landingPage.hero.subtitle', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600">Główny przycisk (CTA)</label>
                                <input 
                                  type="text"
                                  value={siteConfig.landingPage.hero.ctaPrimary}
                                  onChange={(e) => updateSiteConfig('landingPage.hero.ctaPrimary', e.target.value)}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600">Boczny przycisk (CTA)</label>
                                <input 
                                  type="text"
                                  value={siteConfig.landingPage.hero.ctaSecondary}
                                  onChange={(e) => updateSiteConfig('landingPage.hero.ctaSecondary', e.target.value)}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <span className="text-xs font-bold text-slate-600 block mb-2">Widoczność Sekcji (Landing Page)</span>
                            {Object.keys(siteConfig.landingPage.sections).map(sectionId => (
                              <div key={sectionId} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center justify-between mb-4">
                                  <span className="font-bold text-slate-700 capitalize">{sectionId}</span>
                                  <button 
                                    onClick={() => toggleSiteSectionVisibility('landingPage', sectionId)}
                                    className={`p-2 rounded-xl transition-all ${
                                      siteConfig.landingPage.sections[sectionId].visible ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'
                                    }`}
                                  >
                                    {siteConfig.landingPage.sections[sectionId].visible ? <Eye size={18} /> : <EyeOff size={18} />}
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {['guest', 'user', 'parent', 'admin'].map(role => (
                                    <button
                                      key={role}
                                      onClick={() => toggleSiteSection('landingPage', sectionId, role)}
                                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                        siteConfig.landingPage.sections[sectionId].roles.includes(role)
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
                      </section>

                      {/* Dashboard Sections */}
                      <section>
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Panel Użytkownika (Dashboard)</h4>
                        <div className="grid md:grid-cols-2 gap-8">
                          {Object.keys(siteConfig.dashboard.sections).map(sectionId => (
                            <div key={sectionId} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="flex items-center justify-between mb-4">
                                <span className="font-bold text-slate-700 capitalize">{sectionId.replace(/([A-Z])/g, ' $1')}</span>
                                <button 
                                  onClick={() => toggleSiteSectionVisibility('dashboard', sectionId)}
                                  className={`p-2 rounded-xl transition-all ${
                                    siteConfig.dashboard.sections[sectionId].visible ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'
                                  }`}
                                >
                                  {siteConfig.dashboard.sections[sectionId].visible ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {['user', 'parent', 'admin'].map(role => (
                                  <button
                                    key={role}
                                    onClick={() => toggleSiteSection('dashboard', sectionId, role)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                      siteConfig.dashboard.sections[sectionId].roles.includes(role)
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
                      </section>
                    </div>
                  </div>
                )}
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Klasa/Kurs (opcjonalnie)</label>
                    <input 
                      type="text"
                      value={lessonFormData.schoolClass}
                      onChange={(e) => setLessonFormData({ ...lessonFormData, schoolClass: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                      placeholder="np. 8A"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input 
                      type="checkbox"
                      id="isDemo"
                      checked={lessonFormData.isDemo}
                      onChange={(e) => setLessonFormData({ ...lessonFormData, isDemo: e.target.checked })}
                      className="w-5 h-5 text-indigo-600 rounded-lg border-slate-300 focus:ring-indigo-500"
                    />
                    <label htmlFor="isDemo" className="text-xs font-black text-slate-400 uppercase tracking-widest cursor-pointer">Lekcja Demo</label>
                  </div>
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

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <header className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Importuj Użytkowników</h2>
                  <p className="text-sm text-slate-500 font-medium">Wklej dane w formacie CSV (z nagłówkami)</p>
                </div>
                <button 
                  onClick={() => setShowImportModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
                >
                  <X size={24} />
                </button>
              </header>

              <form onSubmit={handleImportUsers} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Dane CSV</label>
                  <p className="text-xs text-slate-500 mb-2">Wymagane nagłówki: email, password. Opcjonalne: displayName, role, schoolClass</p>
                  <textarea 
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm min-h-[200px]"
                    placeholder="email,password,displayName,role,schoolClass&#10;jan@kowalski.pl,haslo123,Jan Kowalski,user,4A&#10;anna@nowak.pl,haslo456,Anna Nowak,parent,"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Anuluj
                  </button>
                  <button 
                    type="submit"
                    disabled={isImporting}
                    className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isImporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                    {isImporting ? 'Importowanie...' : 'Importuj'}
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
                <div className="grid md:grid-cols-2 gap-6">
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
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      {editingUser ? 'Nowe Hasło (opcjonalnie)' : 'Hasło'}
                    </label>
                    <input 
                      type="password"
                      required={!editingUser}
                      value={userFormData.password}
                      onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                      placeholder={editingUser ? "Zostaw puste, aby nie zmieniać" : "••••••"}
                    />
                  </div>
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
                      <option value="wydawca">Wydawca</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Klasa / Poziom</label>
                    <select 
                      value={userFormData.schoolClass}
                      onChange={(e) => setUserFormData({ ...userFormData, schoolClass: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 bg-white"
                    >
                      <option value="">Wybierz klasę...</option>
                      <optgroup label="Szkoła Podstawowa">
                        <option value="4sp">Klasa 4 SP</option>
                        <option value="5sp">Klasa 5 SP</option>
                        <option value="6sp">Klasa 6 SP</option>
                        <option value="7sp">Klasa 7 SP</option>
                        <option value="8sp">Klasa 8 SP</option>
                      </optgroup>
                      <optgroup label="Szkoła Ponadpodstawowa">
                        <option value="1pp">Klasa 1 PP</option>
                        <option value="2pp">Klasa 2 PP</option>
                        <option value="3pp">Klasa 3 PP</option>
                        <option value="4pp">Klasa 4 PP</option>
                        <option value="5pp">Klasa 5 PP</option>
                      </optgroup>
                      <optgroup label="Egzaminy">
                        <option value="matura">Klasa Maturalna</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
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
                  <div className="space-y-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <div>
                      <label className="text-xs font-black text-emerald-600 uppercase tracking-widest block mb-2">Powiązane konta dzieci</label>
                      {userFormData.childrenUids.length > 0 ? (
                        <div className="space-y-2 mb-4">
                          {userFormData.childrenUids.map(childUid => {
                            const child = users.find(u => u.uid === childUid);
                            return (
                              <div key={childUid} className="flex items-center justify-between bg-white p-2 rounded-xl border border-emerald-100">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center font-bold text-[10px]">
                                    {child?.displayName?.[0] || '?'}
                                  </div>
                                  <div className="text-xs">
                                    <div className="font-bold text-slate-900">{child?.displayName || 'Anonim'}</div>
                                    <div className="text-slate-500">{child?.email}</div>
                                  </div>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => setUserFormData({
                                    ...userFormData,
                                    childrenUids: userFormData.childrenUids.filter(id => id !== childUid)
                                  })}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-emerald-600/60 italic mb-4">Brak powiązanych kont dzieci.</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-emerald-600 uppercase tracking-widest">Dodaj dziecko (Email)</label>
                      <div className="flex gap-2">
                        <input 
                          type="email"
                          id="newChildEmail"
                          className="flex-1 px-4 py-2 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-700 text-sm"
                          placeholder="email-dziecka@przyklad.pl"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const email = (e.target as HTMLInputElement).value;
                              const child = users.find(u => u.email === email);
                              if (child && !userFormData.childrenUids.includes(child.uid)) {
                                setUserFormData({
                                  ...userFormData,
                                  childrenUids: [...userFormData.childrenUids, child.uid]
                                });
                                (e.target as HTMLInputElement).value = '';
                              } else if (!child) {
                                alert('Nie znaleziono użytkownika o takim adresie email.');
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('newChildEmail') as HTMLInputElement;
                            const email = input.value;
                            const child = users.find(u => u.email === email);
                            if (child && !userFormData.childrenUids.includes(child.uid)) {
                              setUserFormData({
                                ...userFormData,
                                childrenUids: [...userFormData.childrenUids, child.uid]
                              });
                              input.value = '';
                            } else if (!child) {
                              alert('Nie znaleziono użytkownika o takim adresie email.');
                            }
                          }}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all"
                        >
                          Dodaj
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {userFormData.role === 'user' && editingUser?.parentUid && (
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <label className="text-xs font-black text-indigo-600 uppercase tracking-widest block mb-2">Powiązany Rodzic</label>
                    {(() => {
                      const parent = users.find(u => u.uid === editingUser.parentUid);
                      return (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">
                            {parent?.displayName?.[0] || '?'}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{parent?.displayName || 'Anonim'}</div>
                            <div className="text-xs text-slate-500">{parent?.email}</div>
                          </div>
                        </div>
                      );
                    })()}
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

      {/* Progress Modal */}
      <AnimatePresence>
        {showProgressModal && selectedUserProgress && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowProgressModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Postępy ucznia</h2>
                  <p className="text-slate-500 font-medium">{selectedUserProgress.displayName || selectedUserProgress.email}</p>
                </div>
                <button 
                  onClick={() => setShowProgressModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1">
                {loadingProgress ? (
                  <div className="flex justify-center py-12">
                    <RefreshCw className="animate-spin text-indigo-600" size={32} />
                  </div>
                ) : userProgressData.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Activity size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Brak postępów</h3>
                    <p className="text-slate-500">Ten uczeń nie ukończył jeszcze żadnych testów.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {userProgressData.map((progress) => {
                      const isRevision = progress.lessonId.startsWith('week_');
                      const title = isRevision 
                        ? `Powtórka - Tydzień ${progress.lessonId.split('_')[1]}`
                        : (lessons.find(l => l.id === progress.lessonId)?.topic || 'Nieznana lekcja');
                      
                      return (
                        <div key={progress.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-bold text-slate-900">
                                <MathFormula formula={title} />
                              </h3>
                              <p className="text-sm text-slate-500">
                                Ukończono: {new Date(progress.completedAt).toLocaleString('pl-PL')}
                              </p>
                            </div>
                            <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-black text-lg">
                              {progress.score} pkt
                            </div>
                          </div>

                          {progress.details && progress.details.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                              <h4 className="text-sm font-bold text-slate-700 mb-3">Szczegóły odpowiedzi:</h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                                {progress.details.map((detail: any, idx: number) => (
                                  <div 
                                    key={idx} 
                                    className={`flex items-center gap-2 p-2 rounded-lg border ${
                                      detail.isCorrect 
                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                                        : 'bg-rose-50 border-rose-100 text-rose-700'
                                    }`}
                                  >
                                    {detail.isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                    <span className="text-xs font-bold">Pytanie {idx + 1}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
