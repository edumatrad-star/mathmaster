import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Star, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import MathFormula from '../components/MathFormula';

export default function LandingPage() {
  return (
    <div className="pt-16">
      {/* Hero Section */}
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
                Przygotowanie do egzaminu 2026
              </span>
              <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-slate-900 mb-8">
                Zostań mistrzem <br />
                <span className="text-indigo-600 italic font-serif">matematyki</span>
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                Najnowocześniejsza platforma do nauki matematyki dla ósmoklasistów. 
                Interaktywne lekcje, wzory <MathFormula formula="$a^2 + b^2 = c^2$" /> i pełne wsparcie ekspertów.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2">
                  Zacznij darmowy okres próbny
                  <ArrowRight size={20} />
                </Link>
                <Link to="/demo" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-xl font-semibold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                  Zobacz demo
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Szybkie postępy</h3>
              <p className="text-slate-600">Nasz algorytm dopasowuje poziom trudności do Twoich umiejętności, abyś uczył się efektywnie.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Pełny program</h3>
              <p className="text-slate-600">Wszystkie zagadnienia wymagane na egzaminie ósmoklasisty w jednym miejscu.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                <Star size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Wsparcie LaTeX</h3>
              <p className="text-slate-600">Profesjonalny zapis matematyczny ułatwia zrozumienie skomplikowanych wzorów i równań.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-slate-900 py-24 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-600/10 blur-3xl rounded-full translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">15k+</div>
              <div className="text-slate-400 text-sm uppercase tracking-widest">Uczniów</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-slate-400 text-sm uppercase tracking-widest">Zdawalność</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-slate-400 text-sm uppercase tracking-widest">Lekcji</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-slate-400 text-sm uppercase tracking-widest">Wsparcie</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
