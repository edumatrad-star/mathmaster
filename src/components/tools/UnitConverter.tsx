import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scale, ArrowRightLeft, Info, RefreshCw, Languages, Search, ArrowUpDown } from 'lucide-react';

type UnitCategory = 'length' | 'mass' | 'area' | 'volume' | 'time';

interface Unit {
  id: string;
  name: string;
  symbol: string;
  factor: number; // Factor to base unit
}

const UNITS: Record<UnitCategory, Unit[]> = {
  length: [
    { id: 'mm', name: 'milimetr', symbol: 'mm', factor: 0.001 },
    { id: 'cm', name: 'centymetr', symbol: 'cm', factor: 0.01 },
    { id: 'dm', name: 'decymetr', symbol: 'dm', factor: 0.1 },
    { id: 'm', name: 'metr', symbol: 'm', factor: 1 },
    { id: 'km', name: 'kilometr', symbol: 'km', factor: 1000 },
    { id: 'in', name: 'cal', symbol: 'in', factor: 0.0254 },
    { id: 'ft', name: 'stopa', symbol: 'ft', factor: 0.3048 },
    { id: 'mi', name: 'mila', symbol: 'mi', factor: 1609.344 },
  ],
  mass: [
    { id: 'mg', name: 'miligram', symbol: 'mg', factor: 0.000001 },
    { id: 'g', name: 'gram', symbol: 'g', factor: 0.001 },
    { id: 'dag', name: 'dekagram', symbol: 'dag', factor: 0.01 },
    { id: 'kg', name: 'kilogram', symbol: 'kg', factor: 1 },
    { id: 't', name: 'tona', symbol: 't', factor: 1000 },
    { id: 'lb', name: 'funt', symbol: 'lb', factor: 0.45359237 },
    { id: 'oz', name: 'uncja', symbol: 'oz', factor: 0.028349523125 },
  ],
  area: [
    { id: 'mm2', name: 'mm²', symbol: 'mm²', factor: 0.000001 },
    { id: 'cm2', name: 'cm²', symbol: 'cm²', factor: 0.0001 },
    { id: 'dm2', name: 'dm²', symbol: 'dm²', factor: 0.01 },
    { id: 'm2', name: 'm²', symbol: 'm²', factor: 1 },
    { id: 'a', name: 'ar', symbol: 'a', factor: 100 },
    { id: 'ha', name: 'hektar', symbol: 'ha', factor: 10000 },
    { id: 'km2', name: 'km²', symbol: 'km²', factor: 1000000 },
  ],
  volume: [
    { id: 'ml', name: 'mililitr', symbol: 'ml', factor: 0.001 },
    { id: 'cm3', name: 'cm³', symbol: 'cm³', factor: 0.001 },
    { id: 'l', name: 'litr', symbol: 'l', factor: 1 },
    { id: 'dm3', name: 'dm³', symbol: 'dm³', factor: 1 },
    { id: 'm3', name: 'm³', symbol: 'm³', factor: 1000 },
  ],
  time: [
    { id: 's', name: 'sekunda', symbol: 's', factor: 1 },
    { id: 'min', name: 'minuta', symbol: 'min', factor: 60 },
    { id: 'h', name: 'godzina', symbol: 'h', factor: 3600 },
    { id: 'd', name: 'dzień', symbol: 'd', factor: 86400 },
  ]
};

const TRANSLATIONS: Record<string, Record<string, string>> = {
  pl: {
    length: 'Długość',
    mass: 'Masa',
    area: 'Powierzchnia',
    volume: 'Objętość',
    time: 'Czas',
    convert: 'Przelicz',
    from: 'Z',
    to: 'Na',
    value: 'Wartość',
    result: 'Wynik',
    explanation: 'Jak to przeliczyć?',
    search: 'Szukaj jednostki...',
    swap: 'Zamień jednostki'
  },
  en: {
    length: 'Length',
    mass: 'Mass',
    area: 'Area',
    volume: 'Volume',
    time: 'Time',
    convert: 'Convert',
    from: 'From',
    to: 'To',
    value: 'Value',
    result: 'Result',
    explanation: 'How to convert?',
    search: 'Search unit...',
    swap: 'Swap units'
  },
  de: {
    length: 'Länge',
    mass: 'Masse',
    area: 'Fläche',
    volume: 'Volumen',
    time: 'Zeit',
    convert: 'Konvertieren',
    from: 'Von',
    to: 'Nach',
    value: 'Wert',
    result: 'Ergebnis',
    explanation: 'Wie konvertiert man?',
    search: 'Einheit suchen...',
    swap: 'Einheiten tauschen'
  }
};

export default function UnitConverter() {
  const [category, setCategory] = useState<UnitCategory>('length');
  const [fromUnit, setFromUnit] = useState(UNITS.length[3]); // m
  const [toUnit, setToUnit] = useState(UNITS.length[4]); // km
  const [value, setValue] = useState<string>('1');
  const [lang, setLang] = useState<'pl' | 'en' | 'de'>('pl');
  const [showExplanation, setShowExplanation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const result = useMemo(() => {
    const numValue = parseFloat(value) || 0;
    const fromInBase = numValue * fromUnit.factor;
    return fromInBase / toUnit.factor;
  }, [value, fromUnit, toUnit]);

  const handleCategoryChange = (cat: UnitCategory) => {
    setCategory(cat);
    setFromUnit(UNITS[cat][0]);
    setToUnit(UNITS[cat][1] || UNITS[cat][0]);
    setSearchQuery('');
  };

  const handleSwap = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  const filteredUnits = useMemo(() => {
    return UNITS[category].filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [category, searchQuery]);

  const t = TRANSLATIONS[lang];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="p-8 md:p-12 border-b border-slate-100 bg-emerald-50/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <Scale size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Przelicznik Jednostek</h2>
                <p className="text-slate-500 font-medium">Szybkie i dokładne przeliczanie miar</p>
              </div>
            </div>

            <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm self-start md:self-center">
              {(['pl', 'en', 'de'] as const).map(l => (
                <button 
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    lang === l ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {(Object.keys(UNITS) as UnitCategory[]).map(cat => (
              <button 
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 border ${
                  category === cat 
                    ? 'bg-white text-emerald-600 shadow-lg border-emerald-100 scale-105' 
                    : 'text-slate-500 bg-white/50 border-transparent hover:bg-white hover:border-slate-200'
                }`}
              >
                {t[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Converter Body */}
        <div className="p-8 md:p-12">
          <div className="grid lg:grid-cols-11 items-center gap-8">
            {/* From Section */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.from}</label>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{fromUnit.name}</span>
              </div>
              <div className="space-y-4">
                <input 
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full px-8 py-6 rounded-[2rem] border-2 border-slate-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none text-3xl font-black text-slate-900 transition-all"
                  placeholder="0"
                />
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    placeholder={t.search}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-100 focus:border-emerald-200 outline-none text-sm font-medium bg-slate-50/50"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-slate-200">
                  {filteredUnits.map(u => (
                    <button
                      key={u.id}
                      onClick={() => setFromUnit(u)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        fromUnit.id === u.id 
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' 
                          : 'bg-white text-slate-600 border-slate-100 hover:border-emerald-200'
                      }`}
                    >
                      {u.symbol}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="lg:col-span-1 flex justify-center">
              <button 
                onClick={handleSwap}
                className="w-14 h-14 bg-white text-emerald-600 rounded-2xl flex items-center justify-center border-2 border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 hover:scale-110 active:scale-95 transition-all group"
                title={t.swap}
              >
                <ArrowRightLeft size={24} className="group-hover:rotate-180 transition-transform duration-500 hidden lg:block" />
                <ArrowUpDown size={24} className="group-hover:rotate-180 transition-transform duration-500 lg:hidden" />
              </button>
            </div>

            {/* To Section */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.to}</label>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{toUnit.name}</span>
              </div>
              <div className="space-y-4">
                <div className="w-full px-8 py-6 rounded-[2rem] bg-emerald-50 border-2 border-emerald-100 text-3xl font-black text-emerald-600 overflow-hidden text-ellipsis shadow-inner">
                  {result.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                </div>
                <div className="pt-10"> {/* Spacer to align with search in "From" */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-slate-200">
                    {filteredUnits.map(u => (
                      <button
                        key={u.id}
                        onClick={() => setToUnit(u)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                          toUnit.id === u.id 
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' 
                            : 'bg-white text-slate-600 border-slate-100 hover:border-emerald-200'
                        }`}
                      >
                        {u.symbol}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-12 border-t border-slate-100">
            <button 
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center gap-3 text-slate-500 font-black uppercase tracking-widest text-xs hover:text-emerald-600 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                <Info size={16} />
              </div>
              {t.explanation}
            </button>

            <AnimatePresence>
              {showExplanation && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                    <h4 className="font-black text-slate-900 mb-6 flex items-center gap-2">
                      <RefreshCw size={18} className="text-emerald-600" />
                      Proces przeliczania:
                    </h4>
                    <div className="space-y-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-emerald-100">1</div>
                        <div>
                          <p className="text-slate-900 font-black uppercase tracking-wider text-xs">Krok 1: Jednostka Podstawowa</p>
                          <p className="text-sm text-slate-500">Przeliczamy {fromUnit.name} na jednostkę bazową ({category === 'length' ? 'metr' : category === 'mass' ? 'kilogram' : category === 'time' ? 'sekunda' : 'jednostka bazowa'}).</p>
                        </div>
                      </div>
                      
                      <div className="ml-14 p-6 bg-white rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-center gap-6">
                        <div className="text-center">
                          <div className="text-2xl font-black text-slate-900">{value}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{fromUnit.symbol}</div>
                        </div>
                        <div className="text-emerald-600">
                          <ArrowRightLeft size={24} className="rotate-90 sm:rotate-0" />
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-black text-emerald-600">{(parseFloat(value) * fromUnit.factor).toLocaleString()}</div>
                          <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Baza</div>
                        </div>
                        <div className="text-xs font-mono bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                          Współczynnik: {fromUnit.factor}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-indigo-100">2</div>
                        <div>
                          <p className="text-slate-900 font-black uppercase tracking-wider text-xs">Krok 2: Jednostka Docelowa</p>
                          <p className="text-sm text-slate-500">Przeliczamy z jednostki bazowej na {toUnit.name}.</p>
                        </div>
                      </div>

                      <div className="ml-14 p-6 bg-white rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-center gap-6">
                        <div className="text-center">
                          <div className="text-2xl font-black text-slate-900">{(parseFloat(value) * fromUnit.factor).toLocaleString()}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Baza</div>
                        </div>
                        <div className="text-indigo-600">
                          <ArrowRightLeft size={24} className="rotate-90 sm:rotate-0" />
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-black text-indigo-600">{result.toLocaleString()}</div>
                          <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{toUnit.symbol}</div>
                        </div>
                        <div className="text-xs font-mono bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                          Współczynnik: {toUnit.factor}
                        </div>
                      </div>

                      <div className="p-6 bg-indigo-900 rounded-[2rem] text-white flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Ostateczny Wynik</p>
                          <p className="text-2xl font-black">{result.toLocaleString()} {toUnit.symbol}</p>
                        </div>
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                          <RefreshCw size={24} className="text-indigo-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
