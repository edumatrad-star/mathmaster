import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Star, Users, Zap, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import MathFormula from '../components/MathFormula';
import { useAuth } from '../context/AuthContext';

import { supabase } from '../supabase';

export default function LandingPage() {
  const { profile } = useAuth();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'site')
        .single();
        
      if (data) {
        setConfig(data.data.landingPage);
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const userRole = profile?.role || 'guest';

  const isVisible = (sectionId: string) => {
    if (!config || !config.sections[sectionId]) return true;
    const section = config.sections[sectionId];
    return section.visible && section.roles.includes(userRole);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // Fallback to default content if config is missing
  const hero = config?.hero || {
    title: "Zostań mistrzem matematyki",
    subtitle: "Najnowocześniejsza platforma do nauki matematyki dla ósmoklasistów. Interaktywne lekcje, wzory i pełne wsparcie ekspertów.",
    badge: "Przygotowanie do egzaminu 2026",
    ctaPrimary: "Zacznij darmowy okres próbny",
    ctaSecondary: "Zobacz demo"
  };

  const features = config?.features || [
    { id: 1, title: "Szybkie postępy", description: "Nasz algorytm dopasowuje poziom trudności do Twoich umiejętności, abyś uczył się efektywnie.", icon: 'Zap' },
    { id: 2, title: "Pełny program", description: "Wszystkie zagadnienia wymagane na egzaminie ósmoklasisty w jednym miejscu.", icon: 'CheckCircle2' },
    { id: 3, title: "Wsparcie LaTeX", description: "Profesjonalny zapis matematyczny ułatwia zrozumienie skomplikowanych wzorów i równań.", icon: 'Star' }
  ];

  const stats = config?.stats || [
    { label: "Uczniów", value: "15k+" },
    { label: "Zdawalność", value: "98%" },
    { label: "Lekcji", value: "500+" },
    { label: "Wsparcie", value: "24/7" }
  ];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap': return <Zap size={24} />;
      case 'CheckCircle2': return <CheckCircle2 size={24} />;
      case 'Star': return <Star size={24} />;
      case 'Users': return <Users size={24} />;
      default: return <Zap size={24} />;
    }
  };

  return (
    <div className="pt-16">
      {/* Hero Section */}
      {isVisible('hero') && (
        <section className="relative overflow-hidden bg-slate-50 py-24 sm:py-32">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 mb-6">
                  {hero.badge}
                </span>
                <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-slate-900 mb-8">
                  <MathFormula formula={hero.title} />
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                  <MathFormula formula={hero.subtitle} />
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2">
                    {hero.ctaPrimary}
                    <ArrowRight size={20} />
                  </Link>
                  <Link to="/demo" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-xl font-semibold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                    {hero.ctaSecondary}
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      {isVisible('features') && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {features.map((feature: any) => (
                <div key={feature.id} className="space-y-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                    {getIcon(feature.icon)}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stats */}
      {isVisible('stats') && (
        <section className="bg-slate-900 py-24 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-600/10 blur-3xl rounded-full translate-x-1/2"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((stat: any, i: number) => (
                <div key={i}>
                  <div className="text-4xl font-bold mb-2">{stat.value}</div>
                  <div className="text-slate-400 text-sm uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
