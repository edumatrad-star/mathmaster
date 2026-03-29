import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Clock, Flame, Target, AlertCircle, TrendingUp, BookOpen, Calendar, Mail, Bell, FileText, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, doc, getDoc, updateDoc, collection, query, where, getDocs } from '../firebase';
import MathChart from '../components/MathChart';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function ParentDashboard() {
  const { user, profile } = useAuth();
  const [childData, setChildData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState({
    frequency: profile?.notificationFrequency || 'none',
    alertOnMissingLogin: profile?.alertOnMissingLogin || false
  });

  useEffect(() => {
    async function fetchChildData() {
      if (profile?.role === 'parent' && profile?.childUid) {
        const childDoc = await getDoc(doc(db, 'users', profile.childUid));
        if (childDoc.exists()) {
          setChildData(childDoc.data());
        }
      }
      setLoading(false);
    }
    fetchChildData();
  }, [profile]);

  const handleSaveSettings = async () => {
    if (!user) return;
    setSavingSettings(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        notificationFrequency: notificationSettings.frequency,
        alertOnMissingLogin: notificationSettings.alertOnMissingLogin
      });
      alert('Ustawienia zapisane pomyślnie!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Wystąpił błąd podczas zapisywania ustawień.');
    }
    setSavingSettings(false);
  };

  const [sendingEmail, setSendingEmail] = useState(false);

  const generatePDF = () => {
    if (!childData) return;
    const doc = new jsPDF();
    
    // Helper to fix Polish characters for standard PDF fonts (which don't support them)
    const fixPolish = (str: string) => {
      const mapping: {[key: string]: string} = {
        'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
        'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
      };
      return str.split('').map(char => mapping[char] || char).join('');
    };

    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Indigo-600
    doc.text(fixPolish('Raport Postepow Ucznia - MathMaster'), 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(fixPolish(`Wygenerowano dla rodzica: ${profile?.email}`), 20, 30);
    
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.line(20, 35, 190, 35);

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text(fixPolish(`Uczen: ${childData.displayName}`), 20, 45);
    doc.text(fixPolish(`Data raportu: ${new Date().toLocaleDateString('pl-PL')}`), 20, 55);
    
    doc.setFontSize(16);
    doc.text(fixPolish('Statystyki ogolne:'), 20, 75);
    
    const stats = [
      [fixPolish('Kategoria'), fixPolish('Wartosc')],
      [fixPolish('Streak (Dni z rzedu)'), `${childData.streak || 0} dni`],
      [fixPolish('Laczny czas nauki'), `${childData.totalTimeSpent || 0} min`],
      [fixPolish('Zdobyte punkty'), `${childData.totalPoints || 0}`],
      [fixPolish('Ukonczone tematy'), `${childData.completedStudyTopics?.length || 0}`]
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
    
    const completedTopics = (childData.completedStudyTopics || []).slice(-5).map((t: string) => [fixPolish(t)]);
    
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
    
    const weakTopics = (childData.weakTopics || ['Ulamki dziesietne', 'Pola figur plaskich']).map((t: string) => [fixPolish(t)]);
    
    (doc as any).autoTable({
      startY: nextY + 25,
      body: weakTopics,
      theme: 'plain',
      styles: { textColor: [220, 38, 38] } // Red-600
    });

    doc.save(`Raport_MathMaster_${childData.displayName}.pdf`);
  };

  const handleSendEmailReport = async () => {
    if (!childData || !profile?.email) return;
    setSendingEmail(true);
    try {
      const response = await fetch('/api/notifications/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentEmail: profile.email,
          childName: childData.displayName,
          stats: {
            streak: childData.streak,
            points: childData.totalPoints,
            completedCount: childData.completedStudyTopics?.length || 0
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

  const [childEmail, setChildEmail] = useState('');
  const [linkingChild, setLinkingChild] = useState(false);

  const handleLinkChild = async () => {
    if (!user || !childEmail) return;
    setLinkingChild(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', childEmail.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        alert('Nie znaleziono użytkownika o podanym adresie email.');
        setLinkingChild(false);
        return;
      }

      const childDoc = querySnapshot.docs[0];
      const childUid = childDoc.id;

      if (childUid === user.uid) {
        alert('Nie możesz powiązać własnego konta jako konta dziecka.');
        setLinkingChild(false);
        return;
      }

      await updateDoc(doc(db, 'users', user.uid), {
        childUid: childUid
      });

      setChildData(childDoc.data());
      alert('Konto dziecka zostało pomyślnie powiązane!');
    } catch (error) {
      console.error('Error linking child:', error);
      alert('Wystąpił błąd podczas powiązywania konta.');
    }
    setLinkingChild(false);
  };

  if (loading) return <div className="pt-32 text-center">Ładowanie danych dziecka...</div>;

  if (profile?.role !== 'parent') {
    return (
      <div className="pt-32 text-center px-4">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Brak dostępu</h2>
        <p className="text-slate-500 mt-2">Ta sekcja jest przeznaczona wyłącznie dla rodziców.</p>
      </div>
    );
  }

  if (!childData) {
    return (
      <div className="pt-32 text-center px-4">
        <h2 className="text-2xl font-bold">Połącz konto dziecka</h2>
        <p className="text-slate-500 mt-2 mb-8">Nie masz jeszcze połączonego konta swojego dziecka.</p>
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <input 
            type="email" 
            placeholder="Email dziecka" 
            value={childEmail}
            onChange={(e) => setChildEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 mb-4 outline-none focus:ring-2 focus:ring-indigo-600"
          />
          <button 
            onClick={handleLinkChild}
            disabled={linkingChild || !childEmail}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {linkingChild ? 'Łączenie...' : 'Powiąż konto dziecka'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Panel Rodzica: {childData.displayName}</h1>
          <p className="text-slate-500 mt-2">Monitoruj postępy i wspieraj naukę swojego dziecka.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={handleSendEmailReport}
            disabled={sendingEmail}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 disabled:opacity-50"
          >
            <Mail size={20} />
            {sendingEmail ? 'Wysyłanie...' : 'Wyślij raport na email'}
          </button>
          <button 
            onClick={generatePDF}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            <Download size={20} />
            Pobierz raport PDF
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
              <Flame size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Streak</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">{childData.streak || 0} dni</div>
          <div className="text-xs text-green-500 mt-1 font-medium">Aktywny dzisiaj!</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <Clock size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Czas nauki</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">{childData.totalTimeSpent || 0} min</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">W tym tygodniu</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
              <Target size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Punkty</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">{childData.totalPoints || 0}</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Łącznie zdobyte</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Ranking</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">#12</div>
          <div className="text-xs text-indigo-500 mt-1 font-medium">Top 5% uczniów</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recommendations */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <AlertCircle className="text-indigo-600" size={24} />
            Nad czym popracować?
          </h3>
          <div className="space-y-4">
            {(childData.weakTopics || ['Ułamki dziesiętne', 'Pola figur płaskich']).map((topic: string, i: number) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                  <BookOpen size={16} />
                </div>
                <div>
                  <div className="font-bold text-slate-900">{topic}</div>
                  <p className="text-xs text-slate-500 mt-1">
                    Uczeń miał trudności z ostatnim testem z tego działu. Zalecana powtórka lekcji 4 i 5.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Calendar Mock */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Calendar className="text-indigo-600" size={24} />
            Aktywność w ostatnim miesiącu
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 31 }).map((_, i) => (
              <div 
                key={i} 
                className={`aspect-square rounded-md ${Math.random() > 0.4 ? 'bg-indigo-600' : 'bg-slate-100'}`}
                title={`Dzień ${i + 1}`}
              />
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
            <span>Mniej aktywny</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-slate-100 rounded-sm" />
              <div className="w-3 h-3 bg-indigo-200 rounded-sm" />
              <div className="w-3 h-3 bg-indigo-400 rounded-sm" />
              <div className="w-3 h-3 bg-indigo-600 rounded-sm" />
            </div>
            <span>Bardziej aktywny</span>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Bell className="text-indigo-600" size={24} />
            Ustawienia powiadomień email
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
                <p className="text-xs text-slate-400 px-2">
                  Otrzymasz wiadomość email, jeśli Twoje dziecko nie zaloguje się do platformy przed godziną 20:00 danego dnia.
                </p>
              </div>
              
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
    </div>
  );
}
