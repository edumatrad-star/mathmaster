import React, { useState, useEffect } from 'react';
import { AppWindow, Calculator, Percent, Ruler, Triangle, FunctionSquare, Sigma, Binary, Pizza, Scale, Maximize2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

const allApps = [
  {
    id: 'fraction-lab',
    title: 'Laboratorium Ułamków',
    description: 'Zrozum ułamki za pomocą pizzy! Dodawaj, odejmuj i mnóż wizualnie.',
    icon: Pizza,
    color: 'bg-orange-500',
    status: 'Dostępny',
    path: '/applications/fraction-lab',
  },
  {
    id: 'analytical-geometry',
    title: 'Geometria Analityczna',
    description: 'Interaktywny układ współrzędnych. Badaj punkty, linie i ich wzajemne relacje.',
    icon: Maximize2,
    color: 'bg-indigo-600',
    status: 'Dostępny',
    path: '/applications/analytical-geometry',
  },
  {
    id: 'formula-transformer',
    title: 'Przekształcanie Wzorów',
    description: 'Interaktywne narzędzie do wyznaczania niewiadomej ze wzorów fizycznych i matematycznych.',
    icon: Calculator,
    color: 'bg-blue-500',
    status: 'Dostępny',
    path: '/applications/formula-transformer',
  },
  {
    id: 'graph-generator',
    title: 'Generator Wykresów',
    description: 'Wizualizuj funkcje liniowe i kwadratowe w czasie rzeczywistym.',
    icon: FunctionSquare,
    color: 'bg-indigo-500',
    status: 'Dostępny',
    path: '/applications/graph-generator',
  },
  {
    id: 'unit-converter',
    title: 'Przelicznik Jednostek',
    description: 'Szybko przeliczaj jednostki pola, objętości i prędkości z tłumaczeniem.',
    icon: Scale,
    color: 'bg-emerald-500',
    status: 'Dostępny',
    path: '/applications/unit-converter',
  },
  {
    id: 'geometry-lab',
    title: 'Geometria Interaktywna',
    description: 'Badaj własności figur płaskich i brył w 3D.',
    icon: Triangle,
    color: 'bg-amber-500',
    status: 'Wkrótce',
  },
  {
    id: 'statistics',
    title: 'Statystyka i Prawdopodobieństwo',
    description: 'Analizuj zbiory danych i obliczaj szanse zdarzeń.',
    icon: Sigma,
    color: 'bg-rose-500',
    status: 'Premium',
  },
  {
    id: 'number-systems',
    title: 'Systemy Liczbowe',
    description: 'Konwertuj liczby między systemem dziesiętnym, binarnym i rzymskim.',
    icon: Binary,
    color: 'bg-violet-500',
    status: 'Dostępny',
  },
];

export default function Applications() {
  const { profile, isMockMode } = useAuth();
  const [featureSettings, setFeatureSettings] = useState<any>(null);

  useEffect(() => {
    if (isMockMode) {
      setFeatureSettings({
        'formula-transformer': { visible: true, roles: ['user', 'parent', 'admin'] },
        'graph-generator': { visible: true, roles: ['user', 'parent', 'admin'] },
        'unit-converter': { visible: true, roles: ['user', 'parent', 'admin'] },
        'fraction-lab': { visible: true, roles: ['user', 'parent', 'admin'] },
        'analytical-geometry': { visible: true, roles: ['user', 'parent', 'admin'] }
      });
      return;
    }
    async function fetchSettings() {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'features')
        .single();
        
      if (data) {
        setFeatureSettings(data.data);
      }
    }
    fetchSettings();
  }, []);

  const visibleApps = allApps.filter(app => {
    if (!featureSettings) return true; // Show all while loading settings
    const config = featureSettings[app.id];
    if (!config) return true; // Default to visible if not configured
    
    // Check global visibility
    if (!config.visible && profile?.role !== 'admin') return false;
    
    // Check role-based access
    if (profile?.role && !config.roles.includes(profile.role)) return false;
    
    return true;
  });

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <header className="mb-12">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <AppWindow size={28} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Aplikacje Matematyczne</h1>
        </div>
        <p className="text-lg text-slate-600 max-w-2xl">
          Zbiór interaktywnych narzędzi i aplikacji wspomagających naukę matematyki i przygotowanie do egzaminu.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleApps.map((app, index) => (
          <motion.div
            key={app.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-6">
              <div className={`w-14 h-14 ${app.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-current/20 group-hover:scale-110 transition-transform duration-300`}>
                <app.icon size={32} />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${
                app.status === 'Dostępny' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                app.status === 'Premium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                'bg-slate-50 text-slate-500 border border-slate-100'
              }`}>
                {app.status}
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
              {app.title}
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              {app.description}
            </p>
            
            {app.path ? (
              <Link to={app.path}>
                <button 
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                >
                  Uruchom aplikację
                </button>
              </Link>
            ) : (
              <button 
                disabled={app.status === 'Wkrótce'}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                  app.status === 'Dostępny' ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200' :
                  app.status === 'Premium' ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-200' :
                  'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {app.status === 'Wkrótce' ? 'Już niedługo' : 'Uruchom aplikację'}
              </button>
            )}
          </motion.div>
        ))}
      </div>

      <section className="mt-20 p-8 bg-indigo-900 rounded-[2.5rem] text-white overflow-hidden relative">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Masz pomysł na nową aplikację?</h2>
          <p className="text-indigo-100 mb-8 text-lg">
            Stale rozwijamy nasz zbiór narzędzi. Jeśli brakuje Ci konkretnego kalkulatora lub wizualizacji, daj nam znać!
          </p>
          <button className="px-8 py-4 bg-white text-indigo-900 rounded-2xl font-bold hover:bg-indigo-50 transition-colors shadow-xl">
            Zaproponuj narzędzie
          </button>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl -ml-24 -mb-24"></div>
      </section>
    </div>
  );
}
