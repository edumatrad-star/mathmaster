import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Clock, Flame, Target, AlertCircle, TrendingUp, BookOpen, Calendar, Mail, Bell, FileText, Download, UserPlus, Check, X, Loader2, ChevronRight, Plus, Settings as SettingsIcon, Lock, Trophy, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import MathChart from '../components/MathChart';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function ParentDashboard() {
  const { user, profile, addChild, checkUsernameAvailability } = useAuth();
  const [childrenData, setChildrenData] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'progress' | 'manage' | 'notifications'>('progress');

  const [newChildName, setNewChildName] = useState('');
  const [newChildUsername, setNewChildUsername] = useState('');
  const [newChildEmail, setNewChildEmail] = useState('');
  const [newChildPassword, setNewChildPassword] = useState('');
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [addChildError, setAddChildError] = useState('');
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [childNewPassword, setChildNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([
    { id: 1, type: 'progress', message: 'Adam ukończył lekcję "Ułamki"', date: '2024-03-20T10:00:00Z' },
    { id: 2, type: 'alert', message: 'Adam nie logował się od 2 dni', date: '2024-03-19T08:30:00Z' },
    { id: 3, type: 'achievement', message: 'Adam zdobył odznakę "Mistrz Algebry"', date: '2024-03-18T15:45:00Z' },
  ]);

  const [notificationSettings, setNotificationSettings] = useState({
    frequency: profile?.notification_frequency || 'none',
    alertOnMissingLogin: profile?.alert_on_missing_login || false
  });

  useEffect(() => {
    const checkUsername = async () => {
      if (newChildUsername.length >= 3) {
        setCheckingUsername(true);
        try {
          const available = await checkUsernameAvailability(newChildUsername);
          setIsUsernameAvailable(available);
        } catch (error) {
          console.error("Error checking username:", error);
        } finally {
          setCheckingUsername(false);
        }
      } else {
        setIsUsernameAvailable(null);
      }
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [newChildUsername, checkUsernameAvailability]);

  useEffect(() => {
    async function fetchChildrenData() {
      if (profile?.role === 'parent' && profile?.children_uids?.length > 0) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .in('id', profile.children_uids);
          
        if (data) {
          setChildrenData(data);
          if (data.length > 0 && !selectedChildId) {
            setSelectedChildId(data[0].id);
          }
        }
      }
      setLoading(false);
    }
    fetchChildrenData();
  }, [profile, selectedChildId]);

  const selectedChild = childrenData.find(c => c.id === selectedChildId);

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddChildError('');
    setIsAddingChild(true);
    try {
      await addChild(newChildName, newChildUsername, newChildEmail, newChildPassword);
      setShowAddChildModal(false);
      setNewChildName('');
      setNewChildUsername('');
      setNewChildEmail('');
      setNewChildPassword('');
      // Profile update will trigger useEffect to fetch new child
    } catch (err: any) {
      setAddChildError(err.message || 'Wystąpił błąd podczas dodawania konta ucznia.');
    } finally {
      setIsAddingChild(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          notification_frequency: notificationSettings.frequency,
          alert_on_missing_login: notificationSettings.alertOnMissingLogin
        })
        .eq('id', user.id);
        
      if (error) throw error;
      alert('Ustawienia zapisane pomyślnie!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Wystąpił błąd podczas zapisywania ustawień.');
    }
    setSavingSettings(false);
  };

  const handleChangeChildPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId || !childNewPassword) return;
    
    if (childNewPassword.length < 6) {
      alert('Hasło musi mieć co najmniej 6 znaków.');
      return;
    }
    
    setIsChangingPassword(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/parent/change-child-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          childUid: selectedChildId,
          newPassword: childNewPassword
        })
      });
      const data = await response.json();
      if (data.success) {
        alert('Hasło zostało zmienione pomyślnie!');
        setChildNewPassword('');
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      alert(`Błąd: ${error.message}`);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const [sendingEmail, setSendingEmail] = useState(false);

  const generatePDF = () => {
    if (!selectedChild) return;
    const doc = new jsPDF();
    
    const fixPolish = (str: string) => {
      const mapping: {[key: string]: string} = {
        'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
        'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
      };
      return str.split('').map(char => mapping[char] || char).join('');
    };

    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text(fixPolish('Raport Postepow Ucznia - MathMaster'), 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(fixPolish(`Wygenerowano dla rodzica: ${profile?.email}`), 20, 30);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 35, 190, 35);

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(fixPolish(`Uczen: ${selectedChild.displayName}`), 20, 45);
    doc.text(fixPolish(`Data raportu: ${new Date().toLocaleDateString('pl-PL')}`), 20, 55);
    
    doc.setFontSize(16);
    doc.text(fixPolish('Statystyki ogolne:'), 20, 75);
    
    const stats = [
      [fixPolish('Kategoria'), fixPolish('Wartosc')],
      [fixPolish('Streak (Dni z rzedu)'), `${selectedChild.streak || 0} dni`],
      [fixPolish('Laczny czas nauki'), `${selectedChild.totalTimeSpent || 0} min`],
      [fixPolish('Zdobyte punkty'), `${selectedChild.totalPoints || 0}`],
      [fixPolish('Ukonczone tematy'), `${selectedChild.completedStudyTopics?.length || 0}`]
    ];

    (doc as any).autoTable({
      startY: 80,
      head: [stats[0]],
      body: stats.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { font: 'helvetica' }
    });

    const lastY = (doc as any).lastAutoTable.finalY;

    doc.setFontSize(16);
    doc.text(fixPolish('Ostatnio ukonczone tematy:'), 20, lastY + 20);
    
    const completedTopics = (selectedChild.completedStudyTopics || []).slice(-5).map((t: string) => [fixPolish(t)]);
    
    if (completedTopics.length > 0) {
      (doc as any).autoTable({
        startY: lastY + 25,
        body: completedTopics,
        theme: 'plain',
        styles: { fontStyle: 'italic' }
      });
    } else {
      doc.setFontSize(12);
      doc.text(fixPolish('Brak ukonczonych tematów w ostatnim czasie.'), 20, lastY + 30);
    }

    const nextY = (doc as any).lastAutoTable.finalY || (lastY + 40);

    doc.setFontSize(16);
    doc.text(fixPolish('Tematy wymagajace powtorki:'), 20, nextY + 20);
    
    const weakTopics = (selectedChild.weakTopics || ['Ulamki dziesietne', 'Pola figur plaskich']).map((t: string) => [fixPolish(t)]);
    
    (doc as any).autoTable({
      startY: nextY + 25,
      body: weakTopics,
      theme: 'plain',
      styles: { textColor: [220, 38, 38] }
    });

    doc.save(`Raport_MathMaster_${selectedChild.displayName}.pdf`);
  };

  const handleSendEmailReport = async () => {
    if (!selectedChild || !profile?.email) return;
    setSendingEmail(true);
    try {
      const response = await fetch('/api/notifications/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentEmail: profile.email,
          childName: selectedChild.displayName,
          stats: {
            streak: selectedChild.streak,
            points: selectedChild.totalPoints,
            completedCount: selectedChild.completedStudyTopics?.length || 0
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error sending email report:', error);
      alert('Wystąpił błąd podczas wysyłania raportu.');
    }
    setSendingEmail(false);
  };

  if (loading) return <div className="pt-32 text-center">Ładowanie danych...</div>;

  if (profile?.role !== 'parent') {
    return (
      <div className="pt-32 text-center px-4">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Brak dostępu</h2>
        <p className="text-slate-500 mt-2">Ta sekcja jest przeznaczona wyłącznie dla rodziców.</p>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Panel Rodzica</h1>
          <p className="text-slate-500 mt-2">Monitoruj postępy i wspieraj naukę swoich dzieci.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={() => setShowAddChildModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            <UserPlus size={20} />
            Dodaj konto ucznia
          </button>
        </div>
      </header>

      {/* Children Selector */}
      <div className="flex flex-wrap gap-4 mb-12">
        {childrenData.map(child => (
          <button
            key={child.uid}
            onClick={() => setSelectedChildId(child.uid)}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all ${
              selectedChildId === child.uid
                ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-50'
                : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              selectedChildId === child.uid ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              <User size={20} />
            </div>
            <div className="text-left">
              <div className={`font-bold ${selectedChildId === child.uid ? 'text-indigo-600' : 'text-slate-700'}`}>
                {child.displayName}
              </div>
              <div className="text-xs text-slate-400">@{child.username}</div>
            </div>
          </button>
        ))}
        {childrenData.length === 0 && (
          <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl w-full text-center">
            <p className="text-slate-500">Nie masz jeszcze dodanych kont uczniów.</p>
            <button 
              onClick={() => setShowAddChildModal(true)}
              className="mt-4 text-indigo-600 font-bold hover:underline"
            >
              Dodaj pierwsze dziecko
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-8">
        {[
          { id: 'progress', name: 'Postępy', icon: TrendingUp },
          { id: 'manage', name: 'Zarządzanie kontem', icon: SettingsIcon },
          { id: 'notifications', name: 'Powiadomienia', icon: Bell },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${
              activeTab === tab.id ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={18} />
            {tab.name}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" 
              />
            )}
          </button>
        ))}
      </div>

      {selectedChild && activeTab === 'progress' && (
        <motion.div
          key={selectedChild.uid}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Statystyki: {selectedChild.displayName}</h2>
            <div className="flex gap-4">
              <button 
                onClick={handleSendEmailReport}
                disabled={sendingEmail}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                <Mail size={16} />
                {sendingEmail ? 'Wysyłanie...' : 'Email'}
              </button>
              <button 
                onClick={generatePDF}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
              >
                <Download size={16} />
                PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                  <Flame size={20} />
                </div>
                <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Streak</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{selectedChild.streak || 0} dni</div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <Clock size={20} />
                </div>
                <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Czas nauki</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{selectedChild.totalTimeSpent || 0} min</div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                  <Target size={20} />
                </div>
                <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Punkty</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{selectedChild.totalPoints || 0}</div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                  <TrendingUp size={20} />
                </div>
                <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Ranking</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">#12</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <AlertCircle className="text-indigo-600" size={24} />
                Nad czym popracować?
              </h3>
              <div className="space-y-4">
                {(selectedChild.weakTopics || ['Ułamki dziesiętne', 'Pola figur płaskich']).map((topic: string, i: number) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                      <BookOpen size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{topic}</div>
                      <p className="text-xs text-slate-500 mt-1">
                        Uczeń miał trudności z ostatnim testem z tego działu. Zalecana powtórka.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Calendar className="text-indigo-600" size={24} />
                Aktywność
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 31 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`aspect-square rounded-md ${Math.random() > 0.4 ? 'bg-indigo-600' : 'bg-slate-100'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {selectedChild && activeTab === 'manage' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Lock className="text-indigo-600" size={24} />
              Zmień hasło dziecka
            </h3>
            <form onSubmit={handleChangeChildPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Nowe hasło</label>
                <input
                  type="password"
                  required
                  value={childNewPassword}
                  onChange={e => setChildNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Minimum 6 znaków"
                />
              </div>
              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isChangingPassword ? <Loader2 className="animate-spin" size={20} /> : 'Zmień hasło'}
              </button>
            </form>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <User size={24} className="text-indigo-600" />
              Informacje o koncie
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Nazwa wyświetlana</div>
                <div className="font-bold text-slate-900">{selectedChild.displayName}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Email</div>
                <div className="font-bold text-slate-900">{selectedChild.email || 'Brak'}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Data dołączenia</div>
                <div className="font-bold text-slate-900">
                  {selectedChild.createdAt?.seconds 
                    ? new Date(selectedChild.createdAt.seconds * 1000).toLocaleDateString('pl-PL')
                    : 'Brak danych'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'notifications' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Bell className="text-indigo-600" size={24} />
              Ostatnie powiadomienia
            </h3>
            <div className="space-y-4">
              {notifications.map((notif) => (
                <div key={notif.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    notif.type === 'alert' ? 'bg-rose-100 text-rose-600' :
                    notif.type === 'achievement' ? 'bg-amber-100 text-amber-600' :
                    'bg-indigo-100 text-indigo-600'
                  }`}>
                    {notif.type === 'alert' ? <AlertCircle size={20} /> :
                     notif.type === 'achievement' ? <Trophy size={20} /> :
                     <Check size={20} />}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-900">{notif.message}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(notif.date).toLocaleString('pl-PL')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings Section */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <SettingsIcon className="text-indigo-600" size={24} />
              Ustawienia powiadomień
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Częstotliwość raportów</label>
                <div className="space-y-3">
                  {['none', 'daily', 'weekly', 'monthly'].map((freq) => (
                    <label key={freq} className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                      <input 
                        type="radio" 
                        name="frequency" 
                        value={freq}
                        checked={notificationSettings.frequency === freq}
                        onChange={(e) => setNotificationSettings({...notificationSettings, frequency: e.target.value})}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="capitalize text-slate-700 font-medium">
                        {freq === 'none' ? 'Brak' : freq === 'daily' ? 'Codziennie' : freq === 'weekly' ? 'Co tydzień' : 'Co miesiąc'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Alerty i powiadomienia</label>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <Mail className="text-slate-400" size={20} />
                      <span className="text-slate-700 font-medium">Alert braku logowania dziecka</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.alertOnMissingLogin}
                      onChange={(e) => setNotificationSettings({...notificationSettings, alertOnMissingLogin: e.target.checked})}
                      className="w-5 h-5 rounded text-indigo-600"
                    />
                  </label>
                  <button 
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    {savingSettings ? 'Zapisywanie...' : 'Zapisz ustawienia'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Add Child Modal */}
      <AnimatePresence>
        {showAddChildModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Dodaj konto ucznia</h3>
                <button onClick={() => setShowAddChildModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              {addChildError && (
                <div className="p-3 mb-4 bg-rose-50 text-rose-500 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={14} />
                  {addChildError}
                </div>
              )}

              <form onSubmit={handleAddChild} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Imię dziecka</label>
                  <input
                    type="text"
                    required
                    value={newChildName}
                    onChange={e => setNewChildName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="np. Adam"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Unikalna nazwa użytkownika</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={newChildUsername}
                      onChange={e => setNewChildUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${
                        isUsernameAvailable === false 
                          ? 'border-rose-300 focus:ring-rose-500 bg-rose-50' 
                          : isUsernameAvailable === true
                            ? 'border-emerald-300 focus:ring-emerald-500 bg-emerald-50'
                            : 'border-slate-200 focus:ring-indigo-500'
                      }`}
                      placeholder="np. adam_nowak_2024"
                    />
                    <div className="absolute right-3 top-3.5">
                      {checkingUsername ? (
                        <Loader2 className="animate-spin text-slate-400" size={18} />
                      ) : isUsernameAvailable === true ? (
                        <CheckCircle2 className="text-emerald-500" size={18} />
                      ) : isUsernameAvailable === false ? (
                        <XCircle className="text-rose-500" size={18} />
                      ) : null}
                    </div>
                  </div>
                  {isUsernameAvailable === false && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">Ta nazwa jest już zajęta</p>
                  )}
                  {isUsernameAvailable === true && (
                    <p className="text-xs text-emerald-500 mt-1 font-medium">Nazwa jest dostępna</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Email dziecka (opcjonalnie)</label>
                  <input
                    type="email"
                    value={newChildEmail}
                    onChange={e => setNewChildEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="adam@email.pl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Hasło dla dziecka</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newChildPassword}
                    onChange={e => setNewChildPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Minimum 6 znaków"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAddingChild}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAddingChild ? <Loader2 className="animate-spin" size={20} /> : 'Utwórz konto ucznia'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
