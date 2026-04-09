import React from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { FileText, Download, Shield, Rocket, Server, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDocumentation() {
  const features = [
    { title: 'System Autentykacji', desc: 'Logowanie przez Google oraz dedykowane konto administratora. Role: Uczeń, Rodzic, Admin.' },
    { title: 'Plan Nauki', desc: '36-tygodniowy program przygotowawczy podzielony na konkretne tematy i działy.' },
    { title: 'Baza Zadań', desc: 'Interaktywne quizy z wyjaśnieniami, kategoryzowane według tygodni i trudności.' },
    { title: 'Panel Administratora', desc: 'Zarządzanie zadaniami, importowanie danych, kontrola widoczności aplikacji dla grup użytkowników.' },
    { title: 'Aplikacje Interaktywne', desc: 'Laboratorium ułamków, Przekształcanie wzorów, Generator wykresów, Przelicznik jednostek.' },
    { title: 'System Postępów', desc: 'Śledzenie ukończonych tematów, statystyki punktowe, ranking (Leaderboard).' },
    { title: 'Panel Rodzica', desc: 'Możliwość podpięcia konta dziecka i monitorowania jego postępów.' },
  ];

  const futurePlans = [
    { title: 'Moduł AI Tutor', desc: 'Integracja z modelem Gemini do personalizowanego tłumaczenia błędów ucznia.' },
    { title: 'Generator Arkuszy PDF', desc: 'Automatyczne tworzenie arkuszy egzaminacyjnych do druku na podstawie bazy zadań.' },
    { title: 'Aplikacja Mobilna', desc: 'Dedykowana wersja na iOS/Android z powiadomieniami push.' },
    { title: 'Więcej Narzędzi', desc: 'Geometria 3D, Statystyka opisowa, Symulacje egzaminacyjne.' },
  ];

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(22);
    doc.text('Dokumentacja Serwisu MathMaster', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Data wygenerowania: ${new Date().toLocaleDateString()}`, 20, 30);

    // Features
    doc.setFontSize(16);
    doc.text('1. Zaimplementowane Funkcje', 20, 45);
    
    let y = 55;
    features.forEach((f, i) => {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i+1}. ${f.title}`, 25, y);
      doc.setFont('helvetica', 'normal');
      doc.text(f.desc, 30, y + 7, { maxWidth: 160 });
      y += 20;
    });

    // Future Plans
    doc.addPage();
    doc.setFontSize(16);
    doc.text('2. Plany na Przyszłość', 20, 20);
    
    y = 30;
    futurePlans.forEach((f, i) => {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i+1}. ${f.title}`, 25, y);
      doc.setFont('helvetica', 'normal');
      doc.text(f.desc, 30, y + 7, { maxWidth: 160 });
      y += 20;
    });

    doc.save('MathMaster_Dokumentacja.pdf');
  };

  const exportDeploymentGuide = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text('Instrukcja Eksportu Serwisu', 20, 20);

    const steps = [
      { step: '1. Przygotowanie Środowiska', desc: 'Zainstaluj Node.js (v18+) oraz npm na serwerze docelowym.' },
      { step: '2. Pobranie Kodu', desc: 'Skopiuj pliki projektu lub sklonuj repozytorium git.' },
      { step: '3. Konfiguracja Supabase', desc: 'Utwórz projekt w Supabase, skonfiguruj tabele i uprawnienia RLS. Skopiuj URL i klucz anonimowy do zmiennych środowiskowych.' },
      { step: '4. Zmienne Środowiskowe', desc: 'Utwórz plik .env i dodaj wymagane klucze (GEMINI_API_KEY, itp.).' },
      { step: '5. Instalacja Zależności', desc: 'Uruchom komendę "npm install" w katalogu głównym.' },
      { step: '6. Budowanie Projektu', desc: 'Uruchom "npm run build". Pliki wynikowe znajdą się w folderze /dist.' },
      { step: '7. Uruchomienie Produkcyjne', desc: 'Uruchom serwer za pomocą "npm start" lub użyj menedżera procesów jak PM2.' },
    ];

    let y = 40;
    steps.forEach((s) => {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(s.step, 20, y);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(s.desc, 25, y + 7, { maxWidth: 160 });
      y += 20;
    });

    doc.save('MathMaster_Instrukcja_Eksportu.pdf');
  };

  return (
    <div className="pt-24 pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <Link to="/admin" className="inline-flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors">
          <ArrowLeft size={20} />
          Powrót do panelu
        </Link>
      </div>

      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold mb-2">
            <FileText size={20} />
            Dokumentacja Systemu
          </div>
          <h1 className="text-4xl font-black text-slate-900">Przegląd i Eksport</h1>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <Download size={20} />
            Eksportuj Dokumentację (PDF)
          </button>
          <button
            onClick={exportDeploymentGuide}
            className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all"
          >
            <Server size={20} />
            Instrukcja Wdrożenia (PDF)
          </button>
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Features List */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="text-xl font-black text-slate-900">Zaimplementowane</h3>
          </div>
          <div className="space-y-6">
            {features.map((f, i) => (
              <div key={i} className="flex gap-4">
                <div className="text-slate-300 font-black text-xl leading-none">{String(i + 1).padStart(2, '0')}</div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">{f.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Future Plans */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Rocket size={20} />
            </div>
            <h3 className="text-xl font-black text-slate-900">Plany Rozwoju</h3>
          </div>
          <div className="space-y-6">
            {futurePlans.map((f, i) => (
              <div key={i} className="flex gap-4">
                <div className="text-slate-300 font-black text-xl leading-none">{String(i + 1).padStart(2, '0')}</div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">{f.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-12 bg-slate-900 p-12 rounded-[3rem] text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <Shield size={24} className="text-indigo-400" />
            <h3 className="text-2xl font-black">Bezpieczeństwo i Architektura</h3>
          </div>
          <p className="text-slate-400 mb-8 max-w-2xl leading-relaxed">
            Serwis oparty jest na architekturze Serverless z wykorzystaniem Supabase (PostgreSQL, Auth). 
            Wszystkie dane są chronione przez rygorystyczne reguły Row Level Security (RLS), zapewniając 
            izolację danych użytkowników i dostęp administracyjny tylko dla uprawnionych osób.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-indigo-400 font-black text-2xl mb-1">React 19</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Frontend</div>
            </div>
            <div>
              <div className="text-indigo-400 font-black text-2xl mb-1">Supabase</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Backend</div>
            </div>
            <div>
              <div className="text-indigo-400 font-black text-2xl mb-1">Tailwind 4</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Styling</div>
            </div>
            <div>
              <div className="text-indigo-400 font-black text-2xl mb-1">TypeScript</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Language</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
